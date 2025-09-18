import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, logProductClick } from '../lib/api.js';
import StarRating from '../components/common/StarRating.jsx';

function SearchBar({ value, onChange, onSubmit }){
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onSubmit?.(); }} className="flex gap-2">
      <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder="Ürün ara..."
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none text-sm"
      />
      <button type="submit" className="px-4 py-2 rounded-lg bg-brand-orange text-white hover:bg-orange-500 text-sm font-semibold">Ara</button>
    </form>
  );
}

function ProductCard({ p, onAdd }){
  const img = p.main_img || p.img1 || p.img2 || p.img3 || p.img4 || null;
  const fireClick = () => { if (p?.sku) { logProductClick(p.sku).catch(()=>{}); } window.scrollTo(0,0); };
  return (
  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col group transition-all duration-300 ease-out transform-gpu shadow-sm ring-1 ring-black/0 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-300/50 hover:border-neutral-300 hover:ring-black/5 focus-within:ring-black/10">
      <div className="relative aspect-square bg-neutral-50 overflow-hidden flex items-center justify-center p-0 transition-colors duration-300 group-hover:bg-neutral-100">
        <Link 
          to={`/urunler/${encodeURIComponent(p.sku)}`} 
          onClick={fireClick}
          className="block w-full h-full"
        >
          {img ? (
            <img
              src={img}
              alt={p.title || p.sku}
              loading="lazy"
              className="block w-full h-full object-cover select-none transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
          )}
        </Link>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
  <div className="text-sm text-neutral-500">{p.sku || 'SKU'}</div>
  <Link 
    to={`/urunler/${encodeURIComponent(p.sku)}`} 
    onClick={fireClick}
    className="font-semibold line-clamp-2 min-h-[2.5rem] hover:underline"
  >
    {p.title || p.sku}
  </Link>
        <div className="mt-1 h-4 flex items-center gap-2 text-[11px] text-neutral-500">
          <StarRating size={12} />
          <span className="leading-none">5.0 Kalite</span>
        </div>
        <div className="mt-auto flex items-center justify-end">
          <Link 
            to={`/urunler/${encodeURIComponent(p.sku)}`} 
            onClick={fireClick}
            className="text-[10px] font-medium px-2 py-1 rounded-md bg-neutral-500 text-white hover:bg-neutral-600 transition inline-flex items-center gap-1 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Products(){
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  // Multi-level category navigation
  const [levelItems, setLevelItems] = useState([]); // items at current level (children of current parent)
  const [trail, setTrail] = useState([]); // selected categories from root to current

  // Helper to get current selected category path from trail
  const currentCategoryPath = useMemo(() => (trail.length ? trail[trail.length - 1]?.path : undefined), [trail]);

  const load = async ({ reset=false, categoryId=null, categoryPath=undefined }={}) => {
    try {
      setLoading(true); setError('');
      const activeNode = trail.length ? trail[trail.length - 1] : null;
      const cid = categoryId ?? (activeNode?.id ?? undefined);
      const cpath = categoryPath ?? currentCategoryPath;
      const res = await fetchProducts(undefined, { q, skip: reset ? 0 : skip, limit, category_id: cid, category_path: cpath });
      const list = Array.isArray(res) ? res : [];
      setItems(prev => reset ? list : [...prev, ...list]);
      setSkip(prev => reset ? list.length : prev + list.length);
      setHasMore(list.length >= limit);
    } catch (e) {
      setError(e?.message || 'Ürünler yüklenemedi');
    } finally { setLoading(false); }
  };

  // Build trail from a category path like "A > B > C"
  const buildTrailFromPath = async (pathStr) => {
    const parts = (pathStr || '')
      .split('>')
      .map(p => p.trim())
      .filter(p => p.length);
    const built = [];
    let parentId = null;
    let lastChildren = [];
    for (const part of parts) {
      const children = await fetchCategories(parentId);
      lastChildren = Array.isArray(children) ? children : [];
      const match = lastChildren.find(c => (c.name || '').trim() === part);
      if (!match) break;
      built.push(match);
      parentId = match.id;
    }
    // After building as far as we can, set level items to children of last
    const children = await fetchCategories(parentId);
    setLevelItems(Array.isArray(children) ? children : []);
    setTrail(built);
    return built;
  };

  // React to URL param changes and initial mount
  useEffect(() => {
    (async () => {
      // Always ensure left panel has the correct level items for current selection
      try {
        const catPath = searchParams.get('cat');
        if (catPath) {
          await buildTrailFromPath(catPath);
          setSkip(0);
          await load({ reset: true, categoryPath: catPath });
          return;
        }
        // No cat in URL: load roots and all products
        const roots = await fetchCategories(null);
        setLevelItems(Array.isArray(roots) ? roots : []);
        setTrail([]);
        setSkip(0);
        await load({ reset: true, categoryPath: undefined });
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Infinite scroll: observe sentinel at bottom
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading && hasMore) {
        load();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [items.length, loading, hasMore]);

  const onSearch = () => {
    // Trim whitespace to avoid accidental empty/space-only queries
    const trimmed = (q || '').trim();
    if (trimmed !== q) setQ(trimmed);
    setSkip(0);
    load({ reset: true });
  };

  const enterCategory = async (cat) => {
    // Drive state via URL: set `cat` to the selected category's path
    const newPath = cat?.path || '';
    const next = new URLSearchParams(searchParams);
    if (newPath) next.set('cat', newPath); else next.delete('cat');
    setSearchParams(next, { replace: false });
  };

  const goToTrailIndex = async (idx) => {
    // idx is -1 for root (no selection)
    const newTrail = idx >= 0 ? trail.slice(0, idx + 1) : [];
    const newPath = newTrail.length ? newTrail[newTrail.length - 1].path : '';
    const next = new URLSearchParams(searchParams);
    if (newPath) next.set('cat', newPath); else next.delete('cat');
    setSearchParams(next, { replace: false });
  };

  const handleAdd = (p) => {
    // Redirect to contact page for quote
    window.location.href = '/iletisim';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Ürünler</span>
        </div>
      </div>

      <div className="mb-6"><SearchBar value={q} onChange={setQ} onSubmit={onSearch} /></div>

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Categories */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-semibold text-neutral-700 mb-3">Kategoriler</div>
            {/* Breadcrumb */}
            <div className="flex items-center flex-wrap gap-1 text-xs text-neutral-600 mb-3">
              <button onClick={()=>goToTrailIndex(-1)} className={`px-2 py-0.5 rounded ${trail.length===0?'bg-neutral-100 font-semibold':''} hover:bg-neutral-100`}>Hepsi</button>
              {trail.map((t, i) => (
                <div key={t.id} className="inline-flex items-center gap-1">
                  <span className="opacity-50">/</span>
                  <button onClick={()=>goToTrailIndex(i)} className={`px-2 py-0.5 rounded ${i===trail.length-1?'bg-neutral-100 font-semibold':''} hover:bg-neutral-100`}>{t.name}</button>
                </div>
              ))}
            </div>
            {/* Current level items */}
            <div className="flex flex-col gap-1">
              {levelItems.map(c => (
                <button
                  key={c.id}
                  onClick={()=>enterCategory(c)}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-neutral-100 inline-flex items-center gap-2`}
                >
                  <span className="text-neutral-400 select-none" aria-hidden>+</span>
                  <span>{c.name}</span>
                </button>
              ))}
              {levelItems.length === 0 && (
                <div className="text-xs text-neutral-400 px-2 py-1">Alt kategori yok</div>
              )}
              {trail.length > 0 && (
                <button
                  onClick={() => goToTrailIndex(trail.length - 2)}
                  className="mt-2 text-left px-2 py-1 rounded hover:bg-neutral-100 inline-flex items-center gap-2 text-sm text-neutral-700"
                >
                  <span aria-hidden>←</span>
                  Geri
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Products grid */}
        <div className="lg:col-span-9">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(p => <ProductCard key={p.id} p={p} onAdd={handleAdd} />)}
            {loading && Array.from({length:8}).map((_,i)=>(
              <div key={`s-${i}`} className="rounded-xl border border-neutral-200 p-4 bg-white flex flex-col gap-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-neutral-200" />
                <div className="h-3 w-2/3 rounded bg-neutral-200" />
                <div className="h-2 w-1/3 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8" />

      <div className="flex justify-center mt-8">
        {!loading && hasMore && (
          <button onClick={()=>load()} className="px-5 py-2 rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 text-sm font-semibold">Daha fazla yükle</button>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <div className="text-neutral-500 text-sm">Hepsi yüklendi</div>
        )}
      </div>
    </div>
  );
}
