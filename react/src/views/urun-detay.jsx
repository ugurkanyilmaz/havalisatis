import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductBySku, fetchProducts } from "../lib/api.js";
import { logProductView, logProductClick } from "../lib/api.js";
import StarRating from "../components/common/StarRating.jsx";
import { setProductHead, clearHead } from "../lib/head_manager.js";

/* -------------------- Helpers -------------------- */
function getProductImage(p) {
  return p?.main_img || p?.img1 || p?.img2 || p?.img3 || p?.img4 || null;
}

/* -------------------- Components -------------------- */
function DescriptionFormatted({ text }) {
  const lines = useMemo(() => {
    if (!text) return [];
    return String(text)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [text]);

  if (!lines.length) return null;

  const [first, ...rest] = lines;
  const commaIdx = first.indexOf(",");
  const firstBefore = commaIdx >= 0 ? first.slice(0, commaIdx) : null;
  const firstAfter = commaIdx >= 0 ? first.slice(commaIdx) : first;

  return (
    <div className="space-y-3">
      <p className="text-neutral-700">
        {firstBefore ? (
          <>
            <strong>{firstBefore}</strong>
            {firstAfter}
          </>
        ) : (
          first
        )}
      </p>
      {rest.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 text-neutral-700">
          {rest.map((line, idx) => {
            const [left, ...rightParts] = line.split(":");
            const right = rightParts.join(":").trim();
            return (
              <li key={idx}>
                {right ? (
                  <>
                    <strong>{left.trim()}</strong>: {right}
                  </>
                ) : (
                  line
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProductGallery({ product }) {
  const images = useMemo(() => {
    const list = [product?.main_img, product?.img1, product?.img2, product?.img3, product?.img4]
      .map((u) => (u && String(u).trim()) || null)
      .filter(Boolean);
    // Remove duplicates (normalize URL: strip query/hash, lowercase)
    const normalize = (s) => {
      try {
        const url = new URL(s);
        return (url.origin + url.pathname).toLowerCase();
      } catch {
        return s.split('?')[0].split('#')[0].toLowerCase();
      }
    };
    const seen = new Set();
    const uniq = [];
    for (const u of list) {
      const key = normalize(u);
      if (!seen.has(key)) { seen.add(key); uniq.push(u); }
    }
    return uniq;
  }, [product]);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false); // fullscreen viewer
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const touchMode = useRef(false);
  const swipeStart = useRef(null);
  useEffect(() => { setIdx(0); }, [product?.sku]);
  const current = images[idx] || null;
  const next = (dir) => {
    if (!images.length) return;
    setIdx((i) => (i + dir + images.length) % images.length);
  };
  // Reset zoom when index changes or lightbox closes
  useEffect(() => { setZoom(1); setOffset({x:0,y:0}); }, [idx, lightbox]);

  // ESC close & body scroll lock
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') next(1);
      if (e.key === 'ArrowLeft') next(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [lightbox]);

  const clampOffset = (x, y, z) => {
    // limit pan so image doesn't leave container too far; allow some slack
    const slack = 40;
    const max = (val) => Math.max(-((z-1)*500) - slack, Math.min(((z-1)*500)+slack, val));
    return { x: max(x), y: max(y) };
  };

  const onWheel = (e) => {
    if (!lightbox) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => {
      const nz = Math.min(4, Math.max(1, +(z + delta).toFixed(2)));
      if (nz === 1) setOffset({x:0,y:0});
      return nz;
    });
  };

  const onMouseDown = (e) => {
    if (zoom === 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };
  const onMouseMovePan = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset(clampOffset(offsetStart.current.x + dx, offsetStart.current.y + dy, zoom));
  };
  const endPan = () => setIsPanning(false);

  // Touch gestures (pinch + swipe)
  const onTouchStart = (e) => {
    if (!lightbox) return;
    if (e.touches.length === 1) {
      swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      if (zoom > 1) {
        touchMode.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        offsetStart.current = { ...offset };
      }
    } else if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };
  const onTouchMove = (e) => {
    if (!lightbox) return;
    if (e.touches.length === 2 && lastTouchDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastTouchDist.current;
      lastTouchDist.current = dist;
      setZoom((z) => {
        const nz = Math.min(4, Math.max(1, +(z + delta / 300).toFixed(2)));
        if (nz === 1) setOffset({x:0,y:0});
        return nz;
      });
    } else if (e.touches.length === 1 && touchMode.current && zoom > 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setOffset(clampOffset(offsetStart.current.x + dx, offsetStart.current.y + dy, zoom));
    }
  };
  const onTouchEnd = (e) => {
    if (!lightbox) return;
    if (e.touches.length === 0) {
      // Swipe detection
      if (swipeStart.current && zoom === 1) {
        const dx = (e.changedTouches[0].clientX - swipeStart.current.x);
        const dt = Date.now() - swipeStart.current.time;
        if (dt < 500 && Math.abs(dx) > 60) {
          if (dx < 0) next(1); else next(-1);
        }
      }
      touchMode.current = false;
      lastTouchDist.current = null;
      swipeStart.current = null;
    }
  };
  // Zoom state
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [rx, setRx] = useState(0.5); // relative x [0,1] on image
  const [ry, setRy] = useState(0.5); // relative y [0,1] on image
  const [contH, setContH] = useState(0);
  const [imgBox, setImgBox] = useState({ w: 0, h: 0 });
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 }); // px within container
  const ZOOM = 2.0; // zoom factor for side panel
  const LENS = 110; // lens diameter in px
  const PANEL_W = 384; // px (tailwind w-96)
  // Detect touch device (disable hover zoom)
  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || (navigator?.maxTouchPoints || 0) > 0;
  }, []);

  const onMove = (e) => {
    if (!containerRef.current || !imgRef.current) return;
    const cont = containerRef.current.getBoundingClientRect();
    const imgR = imgRef.current.getBoundingClientRect();
    // relative position within actual rendered image (exclude letterbox)
    const relX = (e.clientX - imgR.left) / imgR.width;
    const relY = (e.clientY - imgR.top) / imgR.height;
    const cx = Math.max(0, Math.min(1, relX));
    const cy = Math.max(0, Math.min(1, relY));
    setRx(cx); setRy(cy);
    setContH(cont.height);
    setImgBox({ w: imgR.width, h: imgR.height });
    // lens position within container
    const lx = Math.max(0, Math.min(cont.width - LENS, e.clientX - cont.left - LENS / 2));
    const ly = Math.max(0, Math.min(cont.height - LENS, e.clientY - cont.top - LENS / 2));
    setLensPos({ x: lx, y: ly });
  };
  const onEnter = (e) => { setHover(true); };
  const onLeave = () => { setHover(false); };
  return (
    <>
      <div className="flex gap-3 p-2 md:p-3">
        {images.length > 1 && (
          <aside className="hidden md:flex md:flex-col md:w-20 lg:w-24 gap-2 overflow-y-auto pr-1">
            {images.map((u, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`relative w-full aspect-square rounded-lg overflow-hidden border transition ${i===idx ? 'border-brand-orange ring-1 ring-brand-orange/30' : 'border-neutral-200 hover:border-neutral-300'}`}
                aria-label={`Görsel ${i+1}`}
              >
                <div className="w-full h-full bg-neutral-100 grid place-items-center p-1">
                  <img src={u} alt="thumb" className="max-w-full max-h-full object-contain" />
                </div>
              </button>
            ))}
          </aside>
        )}
        <div className="relative flex-1">
          {/* Mobile container (aspect enforced) */}
          <div className="block md:hidden w-full aspect-square bg-neutral-50 rounded-xl overflow-hidden flex items-center justify-center">
            {current ? (
              <img
                src={current}
                alt={product?.title || product?.sku}
                className="w-full h-full object-contain select-none cursor-zoom-in"
                onClick={() => setLightbox(true)}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => next(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm rounded-full w-8 h-8 grid place-items-center"
                  aria-label="Önceki görsel"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => next(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm rounded-full w-8 h-8 grid place-items-center"
                  aria-label="Sonraki görsel"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {/* Desktop container (restore original absolute cover style + zoom) */}
          <div
            ref={containerRef}
            className="hidden md:flex relative w-full h-full min-h-[420px] bg-neutral-50 rounded-xl overflow-hidden items-center justify-center"
            {...(!isTouch ? { onMouseMove: onMove, onMouseEnter: onEnter, onMouseLeave: onLeave } : {})}
          >
            {current ? (
              <img
                ref={imgRef}
                src={current}
                alt={product?.title || product?.sku}
                className="absolute inset-0 w-full h-full object-cover select-none cursor-zoom-in"
                onClick={() => setLightbox(true)}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
            )}
            {!isTouch && hover && current && (
              <div
                className="pointer-events-none absolute rounded-full border border-orange-300 bg-orange-200/25 shadow-sm"
                style={{ width: LENS, height: LENS, left: lensPos.x, top: lensPos.y }}
              />
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => next(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm rounded-full w-9 h-9 grid place-items-center"
                  aria-label="Önceki görsel"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => next(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm rounded-full w-9 h-9 grid place-items-center"
                  aria-label="Sonraki görsel"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {!isTouch && hover && current && imgBox.w > 0 && (
            <div
              className="hidden md:block absolute top-0"
              style={{ left: `calc(100% + 12px)`, width: PANEL_W, height: contH }}
            >
              <div
                className="w-full h-full rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm"
                style={{
                  backgroundImage: `url(${current})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${imgBox.w * ZOOM}px ${imgBox.h * ZOOM}px`,
                  backgroundPosition: `${-(rx * imgBox.w * ZOOM - PANEL_W / 2)}px ${-(ry * imgBox.h * ZOOM - contH / 2)}px`,
                }}
              />
            </div>
          )}
        </div>
      </div>
      {/* Mobile horizontal thumbnails */}
      {images.length > 1 && (
        <div className="md:hidden px-2 pb-2 flex gap-2 overflow-x-auto">
          {images.map((u, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative flex-none w-16 h-16 rounded-lg overflow-hidden border ${i===idx ? 'border-brand-orange' : 'border-neutral-200'}`}
              aria-label={`Görsel ${i+1}`}
            >
              <div className="w-full h-full bg-neutral-100 grid place-items-center p-1">
                <img src={u} alt="thumb" className="max-w-full max-h-full object-contain" />
              </div>
            </button>
          ))}
        </div>
      )}
      {/* Lightbox fullscreen viewer */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setLightbox(false); }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white text-sm">
            <div className="font-medium truncate max-w-[60%]">{product?.title || product?.sku}</div>
            <div className="flex items-center gap-2">
              {images.length > 1 && (
                <span className="text-xs opacity-70">{idx + 1} / {images.length}</span>
              )}
              <button
                onClick={() => setLightbox(false)}
                aria-label="Kapat"
                className="p-2 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 transition"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-8 select-none">
            {current ? (
              <div
                className="relative max-h-[75vh] max-w-[90vw] flex items-center justify-center"
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMovePan}
                onMouseUp={endPan}
                onMouseLeave={endPan}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={current}
                  alt={product?.title || product?.sku}
                  className="select-none pointer-events-none"
                  style={{
                    maxHeight: '75vh',
                    maxWidth: '90vw',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                  }}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="text-neutral-400 text-xs">Görsel yok</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(-1); }}
                  aria-label="Önceki"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 grid place-items-center backdrop-blur-sm"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(1); }}
                  aria-label="Sonraki"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 grid place-items-center backdrop-blur-sm"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            {images.length > 1 && (
              <div className="flex gap-2 px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm">
                {images.map((u,i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`w-3 h-3 rounded-full ${i===idx ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                    aria-label={`Görsel ${i+1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Zoom controls */}
          <div className="absolute right-3 bottom-20 flex flex-col gap-2">
            <button
              onClick={() => setZoom((z)=> Math.min(4, +(z+0.25).toFixed(2)))}
              disabled={zoom>=4}
              className="w-10 h-10 rounded-md bg-white/15 hover:bg-white/25 text-white text-xl font-semibold backdrop-blur disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Yakınlaştır"
            >+
            </button>
            <button
              onClick={() => setZoom((z)=> Math.max(1, +(z-0.25).toFixed(2)))}
              disabled={zoom<=1}
              className="w-10 h-10 rounded-md bg-white/15 hover:bg-white/25 text-white text-xl font-semibold backdrop-blur disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Uzaklaştır"
            >−
            </button>
            <button
              onClick={() => { setZoom(1); setOffset({x:0,y:0}); }}
              disabled={zoom===1}
              className="w-10 h-10 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-medium backdrop-blur disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Sıfırla"
            >Sıfırla
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import { SOCIAL_LINKS } from "../lib/socialLinks.js";
function ProductPrice({ product }) {
  const message = encodeURIComponent(`Merhaba, ${product?.title || product?.sku} ürünü için fiyat teklifi almak istiyorum.`);
  const wa = `${SOCIAL_LINKS.whatsapp}?text=${message}`;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm mb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">Fiyat Teklifi İste</div>
          <div className="text-xs text-neutral-500 mt-1">WhatsApp üzerinden hızlı teklif alın</div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-[0.99] transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12.04 2c-5.52 0-10 4.42-10 9.87 0 1.74.47 3.43 1.37 4.92L2 22l5.4-1.76c1.43.78 3.05 1.19 4.67 1.19h.01c5.52 0 10-4.42 10-9.87 0-2.64-1.07-5.12-3.02-6.99A10.55 10.55 0 0 0 12.04 2Zm5.88 14.19c-.25.7-1.46 1.33-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.11-1-.32-1.72-.63-3.03-1.31-5-4.37-5.15-4.58-.15-.21-1.23-1.64-1.23-3.13 0-1.48.78-2.2 1.06-2.5.28-.3.61-.37.82-.37.2 0 .4.01.57.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.21-.15.33-.3.51-.15.17-.31.39-.44.52-.15.15-.31.32-.13.63.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.54.31.15.49.13.67-.08.18-.21.77-.88.97-1.18.2-.3.41-.24.68-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.07.12.07.72-.18 1.42Z" />
            </svg>
            <span className="font-semibold">Teklif al</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureTable({ features }) {
  if (!features.length) return null;
  return (
    <div className="mt-12 max-w-3xl mx-auto rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-semibold text-neutral-700">Teknik Özellikler</div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {features.map((f, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                <td className="py-3 px-4 align-top w-1/3 font-semibold text-neutral-700">{f.name || '-'}</td>
                <td className="py-3 px-4 text-neutral-800">{f.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatedSlider({ items }) {
  const viewportRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [perView, setPerView] = useState(3);
  const [vw, setVw] = useState(0);

  useEffect(() => {
    const calc = () => {
      const w = viewportRef.current?.clientWidth || window.innerWidth;
      setVw(w);
      // responsive slides per view
      const pv = w >= 1200 ? 4 : w >= 900 ? 3 : 2;
      setPerView(pv);
      setIdx((i) => Math.min(i, Math.max(0, (items.length - pv))));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [items.length]);

  if (!items.length) return null;

  const slideW = vw > 0 ? vw / perView : 0;
  const canLeft = idx > 0;
  const canRight = idx < Math.max(0, items.length - perView);
  const go = (dir) => {
    setIdx((i) => {
      const next = i + dir;
      return Math.max(0, Math.min(next, items.length - perView));
    });
  };

  return (
    <div className="mt-12 relative">
      <div className="px-1 pb-3 text-sm font-semibold text-neutral-700">Benzer Ürünler</div>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
        <div ref={viewportRef} className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ width: slideW * items.length, transform: `translateX(-${idx * slideW}px)` }}
          >
            {items.map((r) => {
              const rimg = getProductImage(r);
              return (
                <Link
                  key={r.id}
                  to={`/urunler/${encodeURIComponent(r.sku)}`}
                  onClick={() => { if (r?.sku) { logProductClick(r.sku).catch(()=>{}); } window.scrollTo(0,0); }}
                  className="group flex-none rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                  style={{ width: slideW }}
                >
                  <div className="aspect-square bg-neutral-50 flex items-center justify-center p-0">
                    {rimg ? (
                      <img src={rimg} alt={r.title || r.sku} className="block w-full h-full object-cover select-none" draggable={false} />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-neutral-500 mb-1">{r.sku}</div>
                    <div className="text-sm font-semibold line-clamp-2 min-h-[2.25rem] group-hover:underline">{r.title || r.sku}</div>
                    <div className="mt-2 text-sm font-bold text-brand-orange">Teklif Al</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        {canLeft && (
          <button
            type="button"
            aria-label="Geri"
            onClick={() => go(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white border border-neutral-200 shadow-sm rounded-full w-8 h-8 grid place-items-center hover:bg-neutral-50"
          >
            ‹
          </button>
        )}
        {canRight && (
          <button
            type="button"
            aria-label="İleri"
            onClick={() => go(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white border border-neutral-200 shadow-sm rounded-full w-8 h-8 grid place-items-center hover:bg-neutral-50"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------- Skeletons -------------------- */
function HeroSkeleton(){
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="aspect-[4/3] bg-neutral-200" />
        <div className="p-2 flex gap-2">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="w-16 h-16 rounded-lg bg-neutral-200" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-7 w-2/3 rounded bg-neutral-200 mb-3" />
        <div className="h-5 w-32 rounded bg-neutral-200 mb-4" />
        <div className="h-9 w-36 rounded bg-neutral-200 mb-6" />
        <div className="h-3 w-4/5 rounded bg-neutral-200 mb-2" />
        <div className="h-3 w-3/5 rounded bg-neutral-200 mb-2" />
        <div className="h-3 w-2/5 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function FeatureTableSkeleton(){
  return (
    <div className="mt-12 max-w-3xl mx-auto rounded-xl border border-neutral-200 bg-white overflow-hidden animate-pulse">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 h-5" />
      <div className="divide-y">
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="grid grid-cols-3 gap-4 p-4">
            <div className="h-4 bg-neutral-200 rounded" />
            <div className="col-span-2 h-4 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedSliderSkeleton(){
  return (
    <div className="mt-12 animate-pulse">
      <div className="px-1 pb-3 h-4 bg-neutral-200 w-32 rounded" />
      <div className="flex gap-4">
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="flex-none w-56 rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="aspect-square bg-neutral-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-40 bg-neutral-200 rounded" />
              <div className="h-3 w-20 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Main Page -------------------- */
export default function UrunDetay() {
  const { sku } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchProductBySku(sku, { signal: controller.signal })
      .then((product) => {
        console.log("Fetched product:", product);
        console.log("SEO data:", product?.seo);
        setP(product);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e?.message || "Ürün yüklenemedi");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sku]);

  // Log product view: yalnızca ürün fetch edildikten sonra bir kez.
  const loggedViewRef = useRef(null);
  useEffect(() => {
    if (!p?.sku) return;
    if (loggedViewRef.current === p.sku) return; // duplicate guard
    loggedViewRef.current = p.sku;
    logProductView(p.sku).catch(() => {});
   }, [p?.sku]);

  // Apply head/meta using centralized head manager when product is loaded
  useEffect(() => {
    if (!p) return;
    // Env tabanlı varsayılanlar kullanılacak (Vite .env)
    setProductHead(p);
    return () => clearHead();
  }, [p]);

  useEffect(() => {
    if (!p?.category_id) {
      setRelated([]);
      return;
    }
    const controller = new AbortController();
    setRelatedLoading(true);

    fetchProducts(undefined, {
      skip: 0,
      limit: 8,
      category_id: p.category_id,
      signal: controller.signal,
    })
      .then((list) => {
        const items = Array.isArray(list) ? list : [];
        setRelated(
          items.filter((it) => it.id !== p.id && it.sku !== p.sku).slice(0, 8)
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setRelated([]);
      })
      .finally(() => setRelatedLoading(false));

    return () => controller.abort();
  }, [p?.category_id, p?.id, p?.sku]);

  // Content logic removed

  const features = useMemo(() => {
    const keys = Array.from({ length: 8 }, (_, i) => `feature${i + 1}`);
    return keys
      .map((k) => p?.[k]?.toString().trim())
      .filter(Boolean)
      .map((raw) => {
        const [name, ...rest] = raw.split(":");
        return { name: name.trim(), value: rest.join(":").trim() || "" };
      });
  }, [p]);


  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <HeroSkeleton />
      <FeatureTableSkeleton />
      <RelatedSliderSkeleton />
    </div>
  );
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!p) return <div className="p-10">Ürün bulunamadı</div>;

  const handleRequestQuote = () => {
    // Teklif talebi için iletişim sayfasına yönlendir veya modal aç
    window.location.href = `/iletisim?sku=${encodeURIComponent(p.sku)}&product=${encodeURIComponent(p.title || p.sku)}`;
  };


  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-4 text-sm text-neutral-600">
        <Link to="/urunler" className="hover:underline">
          Ürünler
        </Link>
        <span className="mx-2">/</span>
        <span className="font-semibold">{p.title || p.sku}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductGallery product={p} />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            {p.title || p.sku}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating size={16} />
            <span className="text-sm text-neutral-600">5.0 Kalite Puanı</span>
          </div>
          <ProductPrice product={p} />
          {p.description && (
            <div className="mb-6">
              <DescriptionFormatted text={p.description} />
            </div>
          )}
          <div className="text-sm text-neutral-500">SKU: {p.sku}</div>
        </div>
      </div>

      <FeatureTable features={features} />

      {!relatedLoading && <RelatedSlider items={related} />}
    </div>
  );
}
