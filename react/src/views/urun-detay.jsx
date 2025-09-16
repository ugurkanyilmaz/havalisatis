import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductBySku, fetchProducts } from "../lib/api.js";
import { logProductView } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { Helmet } from "react-helmet-async";

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
  useEffect(() => { setIdx(0); }, [product?.sku]);
  const current = images[idx] || null;
  const next = (dir) => {
    if (!images.length) return;
    setIdx((i) => (i + dir + images.length) % images.length);
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
          <div
            ref={containerRef}
            className="relative w-full h-full bg-neutral-50 flex items-center justify-center p-0"
            onMouseMove={onMove}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {current ? (
              <img ref={imgRef} src={current} alt={product?.title || product?.sku} className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} />
            ) : (
              <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
            )}
            {/* Lens */}
            {hover && current && (
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
          {/* External zoom panel on desktop, positioned relative to main image container */}
          {hover && current && imgBox.w > 0 && (
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
      {/* Mobile horizontal thumbnails fallback */}
      {images.length > 1 && (
        <div className="md:hidden p-2 flex gap-2 overflow-x-auto">
          {images.map((u, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border ${i===idx ? 'border-brand-orange' : 'border-neutral-200'}`}
              aria-label={`Görsel ${i+1}`}
            >
              <div className="w-full h-full bg-neutral-100 grid place-items-center p-1">
                <img src={u} alt="thumb" className="max-w-full max-h-full object-contain" />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ProductPrice({ price, onAdd }) {
  const formatted = price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm mb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{formatted}</div>
          <div className="text-xs text-neutral-500 mt-1">KDV Dahil</div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onAdd}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-white hover:bg-orange-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 active:scale-[0.99] transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1.5" />
              <circle cx="19" cy="21" r="1.5" />
              <path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
            </svg>
            <span className="font-semibold">Sepete Ekle</span>
          </button>
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
              const rprice = Number(r.price) || 0;
              return (
                <Link
                  key={r.id}
                  to={`/urunler/${encodeURIComponent(r.sku)}`}
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
                    <div className="mt-2 text-sm font-bold">{rprice.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
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
  const { addItem } = useCart();
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
      .then(setP)
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e?.message || "Ürün yüklenemedi");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sku]);

  // Log product view (separately recorded)
  useEffect(() => {
    if (!sku) return;
    // Fire-and-forget; ignore errors
    logProductView(sku).catch(() => {});
  }, [sku]);

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

  // Helmet-managed SEO (title, meta description, OpenGraph/Twitter, JSON-LD)
  const helmet = useMemo(() => {
    if (!p) return null;
    const baseTitle = p?.seo?.meta_title || p?.title || p?.sku || '';
    const title = baseTitle ? `${baseTitle} | Havalı Satış` : 'Havalı Satış';
    const description = p?.seo?.meta_explanation || p?.description || '';
    const img = getProductImage(p);
    const imgAlt = p?.title || p?.sku || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const brandName = p?.brand || '';
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: baseTitle || p?.title || p?.sku,
      image: img || undefined,
      description,
      sku: p?.sku,
      brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "TRY",
        price: String(p?.price ?? ''),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition"
      }
    };
    return (
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {/* OpenGraph */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={baseTitle} />
        {description && <meta property="og:description" content={description} />}
        {img && <meta property="og:image" content={img} />}
        {imgAlt && <meta property="og:image:alt" content={imgAlt} />}        
        {url && <meta property="og:url" content={url} />}
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={baseTitle} />
        {description && <meta name="twitter:description" content={description} />}
        {img && <meta name="twitter:image" content={img} />}
        {imgAlt && <meta name="twitter:image:alt" content={imgAlt} />}
        {/* JSON-LD Product */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
    );
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

  const price = Number(p.price) || 0;
  const handleAdd = () =>
    addItem({ id: p.id, name: p.title || p.sku, price: p.price, image: p.main_img });


  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {helmet}
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
          <ProductPrice price={price} onAdd={handleAdd} />
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
