// src/views/Urunler.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { applyProductsMeta } from '../lib/head_menager_home.js';
import { Link, useLocation, useNavigate } from "react-router-dom";
import StarRating from "../components/common/StarRating.jsx";
import { formatPriceTL } from "../lib/format.js";
import ProtectedImage from "../components/ProtectedImage.jsx";
import { normalizeImageUrl } from "../lib/normalize.js";
import { fetchCategories, fetchProducts, fetchTags, fetchAllProducts } from "../lib/api_calls.js";

function ProductCard({ p }) {
  const img = normalizeImageUrl(p.main_img || p.img1 || p.img || null);

  const fireClick = () => { window.scrollTo(0,0); };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col group transition-all duration-300 ease-out transform-gpu shadow-sm ring-1 ring-black/0 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-300/50 hover:border-neutral-300 hover:ring-black/5 focus-within:ring-black/10">
      <div className="relative aspect-square bg-neutral-50 overflow-hidden flex items-center justify-center p-0 transition-colors duration-300 group-hover:bg-neutral-100">
        {Number(p.discount) > 0 && (
          <div className="absolute left-3 top-3 z-30 bg-red-600 text-white px-2 py-0.5 text-xs font-semibold rounded">-{p.discount}%</div>
        )}
        <Link to={`/urunler/${encodeURIComponent(p.sku || p.id)}`} onClick={fireClick} className="block w-full h-full">
          {img ? (
            <ProtectedImage
              src={img}
              alt={p.title || p.sku}
              className="block w-full h-full object-cover select-none transition-transform duration-300 ease-out group-hover:scale-[1.03] product-image"
              onClick={() => { /* no-op, link wraps image */ }}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
          )}
        </Link>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-sm text-neutral-500">{p.sku || ''}</div>
        <Link to={`/urunler/${encodeURIComponent(p.sku || p.id)}`} onClick={fireClick} className="font-semibold line-clamp-2 min-h-[2.5rem] hover:underline">
          {p.title || p.sku}
        </Link>
        <div className="mt-2 flex items-baseline gap-3">
          {(p.list_price || p.list_price === 0) ? (
            p.list_price === 0 ? (
              <div className="text-sm font-semibold text-neutral-900">Fiyat için teklif alınız</div>
            ) : p.discount > 0 ? (
              <>
                <div className="text-sm text-neutral-500 line-through">{formatPriceTL(p.list_price)}</div>
                <div className="text-sm font-semibold text-brand-orange">{formatPriceTL(Math.round((p.list_price * (100 - (p.discount || 0))) / 100))}</div>
              </>
            ) : (
              <div className="text-sm font-semibold text-neutral-900">{formatPriceTL(p.list_price)}</div>
            )
          ) : null}
        </div>
        <div className="mt-1 h-4 flex items-center gap-2 text-[11px] text-neutral-500">
          <StarRating size={12} value={p.star_rating || 0} />
          <span className="leading-none">{p.star_rating ? `${Number(p.star_rating).toFixed(1)} Kalite` : '—'}</span>
        </div>
        <div className="mt-auto flex items-center justify-end">
          <Link to={`/urunler/${encodeURIComponent(p.sku || p.id)}`} onClick={fireClick} className="text-[10px] font-medium px-2 py-1 rounded-md bg-neutral-500 text-white hover:bg-neutral-600 transition inline-flex items-center gap-1 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Urunler() {
  const [activeTab, setActiveTab] = useState("discover");
  const [categories, setCategories] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  // UI states to mimic `urunler copy.jsx` behavior
  const [trail, setTrail] = useState([]);
  const [levelItems, setLevelItems] = useState([]);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const totalRef = useRef(total);
  const productsRef = useRef(null);
  const scrollPendingRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryTimeout = useRef(null);
  const allModeRef = useRef(false); // when no filters => load all once

  useEffect(() => {
    fetchCategories()
      .then(data => setCategories(data || []))
      .catch(() => setCategories([]));
    // load tags as a separate list to show in sidebar. API returns [{key,label}]
    fetchTags().then(t => setTags(Array.isArray(t) ? t : [])).catch(() => setTags([]));
    // Apply page meta
    applyProductsMeta();
  }, []);

  // derive ordered unique roots from categories if available
  const roots = useMemo(() => {
    // If categories from API are objects with parent_category/child_category, build roots
    if (!categories || categories.length === 0) return [];
    const parents = Array.from(new Set(categories.map(c => c.parent_category).filter(Boolean)));
    return parents.map(p => ({ name: p, children: categories.filter(c => c.parent_category === p).map(x => x.child_category).filter(Boolean) }));
  }, [categories]);

  // initialize levelItems to roots when roots change
  useEffect(() => {
    if (roots.length) setLevelItems(roots.map(r => ({ name: r.name, children: r.children })));
  }, [roots]);

  // Scroll helper: only run on small screens (mobile). Scrolls the products grid into view.
  const scrollToProducts = (opts = {smooth: true}) => {
    try {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth || document.documentElement.clientWidth || 0;
      // Tailwind's md breakpoint is 768px; only scroll for smaller widths
      if (width >= 768) return;
      const el = productsRef.current || document.querySelector('.products-grid');
      if (!el) {
        console.debug('[urunler] scrollToProducts: products element not found');
        return;
      }
      // Try to account for fixed headers. Look for common header selectors, else default to 64px
      let headerHeight = 0;
      try {
        const hdr = document.querySelector('header') || document.querySelector('.site-header') || document.querySelector('#header');
        if (hdr) headerHeight = hdr.getBoundingClientRect().height || 0;
      } catch (e) { headerHeight = 0; }
      const rect = el.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - Math.min(headerHeight, 120);
      if (opts.smooth) {
        // do a couple attempts to ensure the browser has layout updated
        try { window.scrollTo({ top: targetY, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, targetY); }
        // retry after short delay in case content height changes
        setTimeout(() => { try { window.scrollTo({ top: targetY, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, targetY); } }, 300);
      } else {
        window.scrollTo(0, targetY);
      }
      console.debug(`[urunler] scrollToProducts -> width=${width}, header=${headerHeight}, targetY=${targetY}`);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
  console.log(`[urunler] doFetch start -> page=${page}, perPage=${perPage}, q='${query}', parent='${selectedParent}', child='${selectedChild}'`);
      try {
        const noFilter = !selectedParent && !selectedChild && !query;
        if (noFilter) {
          // Load all products once
          if (!allModeRef.current) {
            setLoadingMore(true);
            try {
              console.log('[urunler] fetchAllProducts starting');
              const data = await fetchAllProducts();
              console.log('[urunler] fetchAllProducts result', { total: data.total, items: Array.isArray(data.items) ? data.items.length : typeof data.items });
              if (cancelled) return;
              setProducts(data.items || []);
              setTotal(data.total || (data.items ? data.items.length : 0));
              setPage(1); // pin to first page; sentinel won't trigger more fetches because we won't handle page>1 in all-mode
              // mark all-mode only after successful state update to avoid Strict Mode race
              allModeRef.current = true;
            } catch (e) {
              console.error('[urunler] fetchAllProducts failed', e);
              if (cancelled) return;
              setProducts([]);
              setTotal(0);
            }
          }
          return; // skip paginated fetch while in all-mode
        }

        // filtered/search mode -> paginated fetching
        if (page > 1) setLoadingMore(true);
        const data = await fetchProducts({ parent: selectedParent, child: selectedChild, q: query, page, per_page: perPage });
  console.log(`[urunler] fetch response -> page=${page}, items=${(data.items||[]).length}, total=${data.total}`);
        if (cancelled) return;
        const items = data.items || [];
        setTotal(data.total || 0);
        if (page === 1) {
          setProducts(items);
        } else {
          // append
          setProducts(prev => {
            // avoid duplicates by sku/id if backend may return duplicates
            const existingKeys = new Set(prev.map(p => p.sku || p.id));
            const filtered = items.filter(i => !existingKeys.has(i.sku || i.id));
            return [...prev, ...filtered];
          });
        }
      } catch (err) {
        console.error('[urunler] doFetch error', err);
        if (!cancelled) {
          if (page === 1) { setProducts([]); setTotal(0); }
        }
      } finally {
        if (!cancelled) setLoadingMore(false);
      }
    };
    doFetch();
    return () => { cancelled = true };
  }, [selectedParent, selectedChild, query, page, perPage]);

  // Sync `q` url param => local `query` state so header searches that navigate
  // to /urunler?q=... will actually trigger the product fetch above.
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
  const qParam = params.get('q') || '';
    const parentParam = params.get('parent') || '';
    const childParam = params.get('child') || '';
  const tagParam = params.get('tag') || '';
    // Only update state if different to avoid unnecessary fetch cycles
    if (qParam !== query || (parentParam !== (selectedParent || '')) || (childParam !== (selectedChild || '')) || (tagParam !== (selectedTag || ''))) {
      setQuery(qParam);
      setSelectedParent(parentParam || null);
      setSelectedChild(childParam || null);
      setSelectedTag(tagParam || null);
      setPage(1);
      // reset all-mode when filters/search change
      const noFilterNext = !(parentParam || childParam || qParam);
      allModeRef.current = !noFilterNext ? false : allModeRef.current;
      // request scroll after products load on mobile
      scrollPendingRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Sync local `query`, `selectedParent`, `selectedChild` -> URL (debounced for typing)
  useEffect(() => {
    if (queryTimeout.current) clearTimeout(queryTimeout.current);
    queryTimeout.current = setTimeout(() => {
      const params = new URLSearchParams(location.search || '');
      const currentQ = params.get('q') || '';
      const currentParent = params.get('parent') || '';
      const currentChild = params.get('child') || '';
      const currentTag = params.get('tag') || '';
      const wantQ = query || '';
      const wantParent = selectedParent || '';
      const wantChild = selectedChild || '';
      const wantTag = selectedTag || '';
      if (wantQ !== currentQ || wantParent !== currentParent || wantChild !== currentChild || wantTag !== currentTag) {
        if (wantQ) params.set('q', wantQ); else params.delete('q');
        if (wantParent) params.set('parent', wantParent); else params.delete('parent');
        if (wantChild) params.set('child', wantChild); else params.delete('child');
        if (wantTag) params.set('tag', wantTag); else params.delete('tag');
        const s = params.toString();
        navigate({ pathname: '/urunler', search: s ? `?${s}` : '' }, { replace: true });
      }
    }, 300);
    return () => { if (queryTimeout.current) clearTimeout(queryTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedParent, selectedChild]);

  // When categories are loaded (roots) and we have a selectedParent from the URL,
  // ensure the sidebar UI (trail and levelItems) reflect that selection.
  useEffect(() => {
    if (!roots || roots.length === 0) return;
    if (selectedParent) {
      const root = roots.find(r => r.name === selectedParent);
      if (root) {
        // Only show a trail/child selection if this parent actually has children
        if (Array.isArray(root.children) && root.children.length > 0) {
          setTrail([{ name: selectedParent }]);
          setLevelItems(root.children.map(c => ({ name: c, children: [] })));
          return;
        }
        // If no children, don't change trail/levelItems (keep top-level view)
        // but keep selectedParent state for filtering.
        return;
      }
    }
    // default fallback
    setTrail([]);
    setLevelItems(roots.map(r => ({ name: r.name, children: r.children })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roots, selectedParent]);

  // IntersectionObserver: observe sentinel to load next page
  useEffect(() => {
    // keep a ref with the latest total so the observer callback can access it
    totalRef.current = total;
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          console.debug('[urunler] sentinel intersecting -> currentPage=', page, 'total=', totalRef.current);
          // use functional update to avoid stale `page` closure and read latest total from ref
          setPage(prev => {
            const totalPages = Math.ceil((totalRef.current || 0) / perPage);
            console.debug('[urunler] decide next page -> prev=', prev, 'totalPages=', totalPages);
            if (prev < totalPages) return prev + 1;
            return prev;
          });
        }
      }
    }, { root: null, rootMargin: '400px', threshold: 0.1 });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef.current, perPage, total]);

  // When products update, perform pending scroll (for mobile) if requested
  useEffect(() => {
    if (scrollPendingRef.current) {
      const id = setTimeout(() => {
        scrollToProducts();
        scrollPendingRef.current = false;
      }, 80);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [products]);

  // Debug: log products state whenever it changes to help diagnose render issues
  useEffect(() => {
    try {
      console.log('[urunler][debug] products updated', { count: products.length, total, sample: products.slice(0,3) });
    } catch (e) {
      // ignore
    }
  }, [products, total]);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Ürünler</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64">
            <div className="lg:sticky lg:top-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-4" style={{ maxHeight: '75vh', overflow: 'auto' }}>
                <div className="text-sm font-semibold text-neutral-700 mb-3">Kategoriler</div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center flex-wrap gap-1 text-xs text-neutral-600 mb-2">
                    <button onClick={() => { setTrail([]); setLevelItems(roots.map(r => ({ name: r.name, children: r.children }))); setSelectedChild(null); setSelectedParent(null); setPage(1); scrollPendingRef.current = true; }} className={`px-2 py-0.5 rounded ${trail.length === 0 && !selectedParent ? 'bg-neutral-100 font-semibold ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}>Hepsi</button>
                    {trail.map((t, i) => (
                      <div key={i} className="inline-flex items-center gap-1">
                        <span className="opacity-50">/</span>
                        <button onClick={() => { setTrail(trail.slice(0, i + 1)); setLevelItems(Array.from(roots.find(r=>r.name===t)?.children || []).map(c => ({ name: c, children: [] }))); }} className={`px-2 py-0.5 rounded ${i === trail.length - 1 ? 'bg-neutral-100 font-semibold ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}>{t.name}</button>
                      </div>
                    ))}
                  </div>

                  {levelItems.map((node) => {
                    const hasChildren = node.children && node.children.length > 0
                    const isSelected = selectedChild ? selectedChild === node.name : selectedParent === node.name
                    return (
                      <button
                        key={node.name}
                        onClick={() => {
                            if (hasChildren) {
                              // expand into children as before
                              setTrail(prev => [...prev, { name: node.name }]);
                              setLevelItems(node.children.map(c => ({ name: c, children: [] })));
                              setSelectedParent(node.name);
                              setSelectedChild(null);
                              setPage(1);
                            } else {
                              // Leaf node: do NOT expand the sidebar. Immediately filter products.
                              const currentParent = trail.length ? trail[trail.length - 1].name : null;
                              if (currentParent) {
                                setSelectedParent(currentParent);
                                setSelectedChild(node.name);
                              } else {
                                // treat the clicked node as parent when no trail exists
                                setSelectedParent(node.name);
                                setSelectedChild(null);
                              }
                              // Do not change trail/levelItems here; just trigger fetch
                              setPage(1);
                              // request scroll after products load on mobile
                              scrollPendingRef.current = true;
                            }
                          }}
                        className={`w-full text-left px-2 py-1 rounded inline-flex items-center gap-2 transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200 font-semibold' : 'hover:bg-neutral-100'}`}
                      >
                        <span className="text-neutral-400 select-none" aria-hidden>+</span>
                        <span className="truncate">{node.name}</span>
                      </button>
                    )
                  })}

                  {trail.length > 0 && (
                    <button onClick={() => {
                      const next = trail.slice(0, trail.length - 1)
                      setTrail(next)
                      if (next.length === 0) {
                        setLevelItems(roots.map(r => ({ name: r.name, children: r.children })))
                      } else {
                        const last = next[next.length - 1]
                        setLevelItems(Array.from(roots.find(r=>r.name===last.name)?.children || []).map(c => ({ name: c, children: [] })))
                      }
                      setSelectedChild(null)
                      setPage(1)
                    }} className="mt-2 text-left px-2 py-1 rounded hover:bg-neutral-100 inline-flex items-center gap-2 text-sm text-neutral-700">
                      <span aria-hidden>←</span>
                      Geri
                    </button>
                  )}
                </div>
                {/* Tags section - small "Etiketler" list */}
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-700 mb-2">Etiketler</div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setSelectedTag(null); setQuery(''); setPage(1); navigate('/urunler'); scrollPendingRef.current = true; }} className={`px-2 py-0.5 rounded text-xs ${!selectedTag ? 'bg-neutral-100 font-semibold ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}>Tümü</button>
                    {tags.map((t) => (
                        <button key={t.key} onClick={() => {
                        // selecting a tag should clear category selection and search by tag.key
                        setSelectedParent(null);
                        setSelectedChild(null);
                        setTrail([]);
                        setLevelItems(roots.map(r => ({ name: r.name, children: r.children })));
                        setSelectedTag(t.key);
                        setQuery(t.key);
                        setPage(1);
                        scrollPendingRef.current = true;
                      }} className={`px-2 py-0.5 rounded text-xs ${selectedTag === t.key ? 'bg-blue-50 ring-1 ring-blue-200 font-semibold' : 'hover:bg-neutral-100'}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Tabs removed */}

            {/* Search (static) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Arama
              </label>
              <input
                className="mt-1 block w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ürün adı, SKU, marka..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" ref={productsRef}>
              {products.length === 0 ? (
                <div className="col-span-full bg-white p-6 rounded shadow text-center text-gray-600">Veri alınamadı</div>
              ) : products.map(p => (
                <ProductCard key={p.sku || p.id} p={p} />
              ))}
            </div>

            {/* Dev-only debug panel: append ?debug_products=1 to URL to show client-side products JSON */}
            {new URLSearchParams(location.search || '').get('debug_products') === '1' && (
              <div className="mt-4 p-3 bg-white rounded border border-neutral-200">
                <div className="text-xs text-neutral-600 font-semibold mb-2">Debug: products (client state)</div>
                <pre className="text-xs max-h-64 overflow-auto whitespace-pre-wrap">{JSON.stringify({ total, count: products.length, items: products.slice(0,50) }, null, 2)}</pre>
              </div>
            )}

            {/* Infinite scroll sentinel and loader */}
            <div ref={sentinelRef} style={{ minHeight: 1 }} />
            <div className="mt-6 flex items-center justify-center gap-3">
              {loadingMore ? (
                <div className="text-sm text-neutral-600">Yükleniyor...</div>
              ) : (
                <div className="text-sm text-neutral-600">{products.length} / {total}</div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
