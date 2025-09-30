import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import StarRating from "../components/common/StarRating.jsx";
import ProtectedImage from "../components/ProtectedImage.jsx";
import { setProductHead, clearHead } from "../lib/head_manager.js";
import { fetchProductBySku, fetchProducts } from "../lib/api_calls.js";

/* -------------------- Helpers -------------------- */
function getProductImage(p) {
  if (!p) return "";
  const keys = ["main_img", "img1", "img2", "img3", "img4"];
  for (let k of keys) {
    let url = p[k];
    if (url && typeof url === "string") {
      url = url.trim();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      } else if (url.startsWith("//")) {
        return "https:" + url;
      } else {
        // senin örnekte olduğu gibi çıplak domain gelirse
        return "https://" + url;
      }
    }
  }
  return "";
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
          <span>
            <strong>{firstBefore}</strong>
            <span>{firstAfter}</span>
          </span>
        ) : (
          <span>{first}</span>
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
                  <span>
                    <strong>{left.trim()}</strong>: <span>{right}</span>
                  </span>
                ) : (
                  <span>{line}</span>
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
    const normalizeImgUrl = (s) => {
      if (!s) return null;
      let t = String(s).trim();
      t = t.replace(/&quot;|"/g, '').trim();
      if (!t) return null;
      if (/^https?:\/\//i.test(t)) return t;
      if (/^\/\//.test(t)) return window.location.protocol + t;
      if (/^[^\s\/]+\.[^\s\/]+/.test(t)) return 'https://' + t;
      return t;
    };

    const list = [product?.main_img, product?.img1, product?.img2, product?.img3, product?.img4]
      .filter((src) => src && typeof src === "string")
      .map((src) => {
        const s = String(src).trim();
        if (s.startsWith("http")) return s;
        if (s.startsWith("//")) return "https:" + s;
        return s;
      });
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
  const [natBox, setNatBox] = useState({ w: 0, h: 0 }); // natural image size
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 }); // px within container
  const ZOOM = 2.0; // zoom factor for side panel
  const LENS = 110; // lens diameter in px
  const PANEL_W = 384; // px (tailwind w-96)
  // Detect hover capability (enable hover zoom if a fine pointer with hover exists)
  const hasHover = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true; // assume desktop in SSR/unknown
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
  // Compute zoom panel style using natural image size to avoid blurry upscaling
  const computeZoomPanelStyle = () => {
    const baseW = Math.max(1, imgBox.w);
    const baseH = Math.max(1, imgBox.h);
    const natW = natBox.w || baseW;
    const natH = natBox.h || baseH;
    const targetW = Math.min(Math.round(baseW * ZOOM), natW);
    const targetH = Math.min(Math.round(baseH * ZOOM), natH);
    return {
      backgroundImage: current ? `url(${current})` : 'none',
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${targetW}px ${targetH}px`,
      backgroundPosition: `${-(rx * targetW - PANEL_W / 2)}px ${-(ry * targetH - contH / 2)}px`,
    };
  };
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
                  <div className="w-full h-full bg-gray-50 grid place-items-center">
                    <ProtectedImage src={u} alt="thumb" className="w-full h-full object-contain no-download product-image" style={{ backgroundSize: 'contain', backgroundPosition: 'center' }} />
                  </div>
              </button>
            ))}
          </aside>
        )}
        <div className="relative flex-1">
          {/* Mobile container (aspect enforced) */}
          <div className="block md:hidden w-full aspect-square bg-transparent overflow-hidden flex items-center justify-center">
            {current ? (
              <ProtectedImage
                src={current}
                alt={product?.title || product?.sku}
                className="w-full h-full object-contain select-none cursor-zoom-in"
                style={{ backgroundSize: 'contain', backgroundPosition: 'center' }}
                onClick={() => setLightbox(true)}
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
            className="hidden md:flex relative w-full h-full min-h-[420px] bg-transparent overflow-hidden items-center justify-center"
            {...(hasHover ? { onMouseMove: onMove, onMouseEnter: onEnter, onMouseLeave: onLeave } : {})}
          >
            {current ? (
              <ProtectedImage
                ref={imgRef}
                src={current}
                alt={product?.title || product?.sku}
                className="absolute inset-0 w-full h-full object-cover select-none cursor-zoom-in no-download product-image"
                style={{ backgroundSize: 'contain', backgroundPosition: 'center' }}
                onClick={() => setLightbox(true)}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el?.naturalWidth && el?.naturalHeight) {
                    setNatBox({ w: el.naturalWidth, h: el.naturalHeight });
                  }
                }}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
            )}
            {/* Hover lens intentionally removed to avoid showing a visible circle overlay on products */}
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
          {hasHover && hover && current && imgBox.w > 0 && (
            <div
              className="hidden md:block absolute top-0"
              style={{ left: `calc(100% + 12px)`, width: PANEL_W, height: contH }}
            >
              <div
                className="w-full h-full rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm"
                style={computeZoomPanelStyle()}
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
              <div className="w-full h-full bg-gray-50 grid place-items-center">
                <ProtectedImage src={u} alt="thumb" className="w-full h-full object-contain no-download product-image" style={{ backgroundSize: 'contain', backgroundPosition: 'center' }} />
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
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col no-download"
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
                <div
                  className="select-none pointer-events-none no-download product-image"
                  style={{
                    maxHeight: '75vh',
                    maxWidth: '90vw',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  <ProtectedImage src={current} alt={product?.title || product?.sku} style={{ backgroundSize: 'contain', backgroundPosition: 'center' }} />
                </div>
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
  const buyMessage = encodeURIComponent(`Merhaba, ${product?.title || product?.sku} ürünü için satın almak istiyorum. Stok ve ödeme bilgilerini paylaşır mısınız?`);
  const waBuy = `${SOCIAL_LINKS.whatsapp}?text=${buyMessage}`;
  const phoneNumber = 'tel:+905414526058';
  // Treat an explicit 0 (number or string) as 'no public price' so we can
  // display a special message "Fiyat için teklif alınız" while preserving
  // truthy numeric prices. Null means unknown/not-provided.
  const rawList = product?.list_price;
  const listPrice = rawList === 0 || rawList === '0' ? 0 : (rawList ? Number(rawList) : null);
  const discountPct = product?.discount ? Number(product.discount) : 0;
  const discounted = listPrice && discountPct > 0 ? Math.round((listPrice * (100 - discountPct)) / 100) : listPrice;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm mb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">Liste Fiyatı</div>
          <div className="flex items-baseline gap-3">
            { (listPrice || listPrice === 0) ? (
              listPrice === 0 ? (
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">Fiyat için teklif alınız</div>
              ) : (
                <>
                  {discountPct > 0 ? (
                    <div className="text-base text-neutral-500 line-through">{listPrice} TL</div>
                  ) : (
                    <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{listPrice} TL</div>
                  )}
                  {discountPct > 0 && (
                    <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-orange">{discounted} TL</div>
                  )}
                </>
              )
            ) : (
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">Teklif İçin İletişim</div>
            )}
          </div>
          <div className="text-xs text-neutral-500 mt-1">WhatsApp ile hızlı satın alma talebi gönderin veya arayın</div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href={waBuy}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl bg-[#25D366] text-white hover:bg-[#20b85a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 active:scale-[0.99] transition"
            aria-label={`WhatsApp ile satın al: ${product?.title || product?.sku}`}
            title="WhatsApp ile satın al"
          >
            <div className="flex items-center gap-2">
              {/* WhatsApp icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M20.52 3.48A11.8 11.8 0 0 0 12 .5 11.91 11.91 0 0 0 .5 12c0 2.11.55 4.18 1.6 6.01L.5 23.5l5.7-1.49A11.91 11.91 0 0 0 12 23.5 11.91 11.91 0 0 0 23.5 12c0-3.19-1.26-6.19-3.0-8.52zM12 21.5c-2.05 0-4.02-.56-5.74-1.62l-.4-.27-3.38.88.9-3.3-.27-.41A9.5 9.5 0 1 1 21.5 12 9.44 9.44 0 0 1 12 21.5z"/>
                <path d="M17.2 13.1c-.3-.15-1.8-.9-2.1-1.0-.3-.1-.5-.15-.7.15-.2.3-.8 1.0-1.0 1.2-.2.2-.4.25-.7.1-.3-.15-1.2-.44-2.3-1.4-.85-.76-1.42-1.7-1.58-2.0-.16-.3 0-.46.12-.6.12-.12.3-.3.45-.45.15-.15.2-.25.3-.4.1-.15.05-.3 0-.45-.05-.15-.7-1.7-.95-2.35-.25-.6-.5-.5-.7-.5-.2 0-.45 0-.7 0-.25 0-.65.1-.99.45-.34.35-1.3 1.27-1.3 3.08 0 1.8 1.33 3.55 1.52 3.8.2.25 2.62 3.9 6.35 5.47 3.73 1.57 3.73 1.05 4.41.98.68-.07 2.18-.9 2.49-1.77.31-.87.31-1.62.22-1.77-.1-.15-.3-.25-.6-.4z"/>
              </svg>
              <span className="font-semibold text-sm">Satın Al</span>
            </div>
            <div className="text-xs opacity-90 flex items-center gap-2">
              <span className="font-medium">{listPrice === 0 ? 'Fiyat için teklif alınız' : (listPrice ? (discountPct>0 ? `${discounted} TL` : `${listPrice} TL`) : 'Teklif Al')}</span>
            </div>
          </a>
          <a
            href={phoneNumber}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm focus:outline-none transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1c0 1.24.19 2.45.57 3.56a1 1 0 0 1-.25 1.01l-2.2 2.22Z" />
            </svg>
            <span className="font-medium text-sm">Ara</span>
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
      <div className="px-4 py-3 bg-gray-50 border-b border-neutral-200 text-sm font-semibold text-neutral-700">Teknik Özellikler</div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {features.map((f, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
  // Touch swipe state
  const touchRef = useRef({ startX: 0, startY: 0, deltaX: 0, dragging: false });

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

  // Touch swipe handlers (mobile)
  const onTouchStart = (e) => {
    if (window.innerWidth > 900) return; // only mobile/tablet
    const t = e.changedTouches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, deltaX: 0, dragging: true };
  };
  const onTouchMove = (e) => {
    if (!touchRef.current.dragging) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    // only consider mostly horizontal gestures
    if (Math.abs(dx) > Math.abs(dy)) {
      touchRef.current.deltaX = dx;
    }
  };
  const onTouchEnd = () => {
    if (!touchRef.current.dragging) return;
    const { deltaX } = touchRef.current;
    const THRESH = 40; // px
    if (Math.abs(deltaX) > THRESH) {
      if (deltaX > 0) go(-1); else go(1);
    }
    touchRef.current.dragging = false;
    touchRef.current.deltaX = 0;
  };

  return (
    <div className="mt-12 relative">
      <div className="px-1 pb-3 text-sm font-semibold text-neutral-700">Benzer Ürünler</div>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
        <div
          ref={viewportRef}
          className="overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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
                  onClick={() => { window.scrollTo(0,0); }}
                  className="group flex-none rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                  style={{ width: slideW }}
                >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center p-0 relative">
                      {Number(r.discount) > 0 && (
                        <div className="absolute left-3 top-3 z-20 bg-red-600 text-white px-2 py-0.5 text-xs font-semibold rounded">-{r.discount}%</div>
                      )}
                      {rimg ? (
                        <ProtectedImage src={rimg} alt={r.title || r.sku} className="block w-full h-full object-cover select-none no-download product-image" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
                      )}
                    </div>
                  <div className="p-3">
                    <div className="text-xs text-neutral-500 mb-1">{r.sku}</div>
                    <div className="text-sm font-semibold line-clamp-2 min-h-[2.25rem] group-hover:underline">{r.title || r.sku}</div>
                    <div className="mt-2 text-sm font-bold text-brand-orange">
                      { (r.list_price || r.list_price === 0) ? (
                          r.list_price === 0 ? (
                            'Fiyat için teklif alınız'
                          ) : Number(r.discount) > 0 ? (
                            `${Math.round((r.list_price * (100 - (Number(r.discount) || 0))) / 100)} TL`
                          ) : (
                            `${r.list_price} TL`
                          )
                        ) : (
                          'Teklif Al'
                        )}
                    </div>
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
    let mounted = true;
    setLoading(true);
    setError('');
    setP(null);
    (async () => {
      try {
        const { product, raw } = await fetchProductBySku(sku);
        if (!mounted) return;
        if (!product) {
          // show backend message when available
          const msg = raw && raw.error ? String(raw.error) : 'Ürün bulunamadı';
          setError(msg);
          setP(null);
        } else {
          setP(product);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('fetchProductBySku error', err);
        setError(err?.message || 'Ürün verisi alınamadı');
        setP(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [sku]);

  // Log product view: yalnızca ürün fetch edildikten sonra bir kez.
  const loggedViewRef = useRef(null);
  useEffect(() => {
    if (!p?.sku) return;
    if (loggedViewRef.current === p.sku) return; // duplicate guard
    loggedViewRef.current = p.sku;
  // analytics removed
   }, [p?.sku]);

  // Apply head/meta using centralized head manager when product is loaded
  useEffect(() => {
    if (!p) return;
    // Env tabanlı varsayılanlar kullanılacak (Vite .env)
    setProductHead(p);
    return () => clearHead();
  }, [p]);

  useEffect(() => {
    // Try to fetch related products using parent/child categories when available.
    // Only bail out when we don't have any category info to query with.
    const parent = p?.parent_category || undefined;
    const child = p?.child_category || undefined;
    if (!p && !parent && !child) {
      setRelated([]);
      return;
    }
    if (!p?.category_id && !parent && !child) {
      // no category info at all
      setRelated([]);
      return;
    }

    const controller = new AbortController();
    setRelatedLoading(true);
    (async () => {
      try {
        // fetch products in same category (prefer parent/child if present)
        const data = await fetchProducts({ parent, child, per_page: 8 });
        if (controller.signal.aborted) return;
        const items = data.items || [];
        // exclude current product
        const filtered = items.filter(it => (it.sku || it.id) !== (p.sku || p.id)).slice(0,6);
        setRelated(filtered);
      } catch (e) {
        setRelated([]);
      } finally {
        if (!controller.signal.aborted) setRelatedLoading(false);
      }
    })();
    return () => { controller.abort(); };
  }, [p?.category_id, p?.parent_category, p?.child_category, p?.id, p?.sku]);

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
    <div className="product-detail max-w-7xl mx-auto px-6 py-10">
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
            <StarRating size={16} value={p.star_rating || 0} />
            <span className="text-sm text-neutral-600">{p.star_rating ? `${Number(p.star_rating).toFixed(1)} Kalite Puanı` : 'Puan yok'}</span>
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
