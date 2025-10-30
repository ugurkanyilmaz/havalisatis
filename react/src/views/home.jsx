import React from 'react';
import proffesionalImg from '../components/proffesional.jpg';
import endustryImg from '../components/endustry.jpg';
import senolbeyImg from '../components/senolbey.jpg';
import HeroSlider from '../components/HeroSlider.jsx';
import ProtectedImage from '../components/ProtectedImage.jsx';
import StarRating from '../components/common/StarRating.jsx';
import { fetchHome, fetchCategories, fetchProducts } from '../lib/api_calls.js';
import { useEffect, useState, useMemo, useRef } from 'react';
import { applyHomeMeta } from '../lib/head_menager_home.js';
import { Link, useNavigate } from 'react-router-dom';
// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// Swiper core modules (used only if available in the bundler environment)
// Import Swiper modules from their module paths to avoid named-export issues with Vite
// Use the same module entry import that works in the copy version
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import SpecialPrices from '../components/SpecialPrices.jsx';

/**
 * Bu dosya SIFIR işlevsellikle (no-fetch, no-state, no-effects) sadece UI barındırır.
 * Tıklamalar / yenilemeler / navigation vb. kaldırıldı veya disabled yapıldı.
 */

function CategorySidebar({ visibleByScroll = false }) {
  const [categories, setCategories] = useState([]);
  const [trail, setTrail] = useState([]);
  const [levelItems, setLevelItems] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories().then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => setCategories([]));
  }, []);

  const roots = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    const parents = Array.from(new Set(categories.map(c => c.parent_category).filter(Boolean)));
    return parents.map(p => ({ name: p, children: categories.filter(c => c.parent_category === p).map(x => x.child_category).filter(Boolean) }));
  }, [categories]);

  // initialize levelItems when roots load
  useEffect(() => {
    if (roots.length) setLevelItems(roots.map(r => ({ name: r.name, children: r.children })));
  }, [roots]);

  // helper when selecting a leaf to navigate to /urunler
  const applyFilter = (parent, child) => {
    const params = new URLSearchParams();
    if (parent) params.set('parent', parent);
    if (child) params.set('child', child);
    const s = params.toString();
    navigate({ pathname: '/urunler', search: s ? `?${s}` : '' });
  };

  return (
    <div className="pointer-events-auto">
      <div
        className={`fixed top-[220px] left-0 z-50 transform transition-transform duration-300 ease-out ${
          visibleByScroll ? (open ? 'translate-x-0' : '-translate-x-[88%] lg:-translate-x-32') : '-translate-x-full'
        } lg:shadow-2xl`}
        style={{ width: 280 }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="rounded-r-xl overflow-hidden shadow-lg bg-white border border-neutral-200 lg:ring-2 lg:ring-brand-orange/20">
          <div className="px-3 py-2 bg-brand-orange text-sm font-semibold text-white text-right pr-4">Kategoriler</div>
          <div className="max-h-[60vh] overflow-auto py-2">
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center flex-wrap gap-1 text-xs text-neutral-600 mb-2 px-2">
                <button onClick={() => { setTrail([]); setLevelItems(roots.map(r => ({ name: r.name, children: r.children }))); setSelectedChild(null); setSelectedParent(null); applyFilter(null, null); }} className={`px-2 py-0.5 rounded ${trail.length === 0 && !selectedParent ? 'bg-neutral-100 font-semibold ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}>Hepsi</button>
                {trail.map((t, i) => (
                  <div key={i} className="inline-flex items-center gap-1">
                    <span className="opacity-50">/</span>
                    <button onClick={() => { setTrail(trail.slice(0, i + 1)); setLevelItems(Array.from(roots.find(r=>r.name===t)?.children || []).map(c => ({ name: c, children: [] }))); }} className={`px-2 py-0.5 rounded ${i === trail.length - 1 ? 'bg-neutral-100 font-semibold ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}>{t.name}</button>
                  </div>
                ))}
              </div>

              {levelItems.map((node) => {
                const hasChildren = node.children && node.children.length > 0;
                const isSelected = selectedChild ? selectedChild === node.name : selectedParent === node.name;
                return (
                  <button
                    key={node.name}
                    onClick={() => {
                        if (hasChildren) {
                          setTrail(prev => [...prev, { name: node.name }]);
                          setLevelItems(node.children.map(c => ({ name: c, children: [] })));
                          setSelectedParent(node.name);
                          setSelectedChild(null);
                        } else {
                          const currentParent = trail.length ? trail[trail.length - 1].name : null;
                          if (currentParent) {
                            setSelectedParent(currentParent);
                            setSelectedChild(node.name);
                            applyFilter(currentParent, node.name);
                          } else {
                            setSelectedParent(node.name);
                            setSelectedChild(null);
                            applyFilter(node.name, null);
                          }
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
                }} className="mt-2 text-left px-2 py-1 rounded hover:bg-neutral-100 inline-flex items-center gap-2 text-sm text-neutral-700">
                  <span aria-hidden>←</span>
                  Geri
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* small tab removed per request */}
    </div>
  );
}

function ProductSkeleton({ id }) {
  return (
    <div key={id} className="min-w-[220px] w-[220px] rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3">
      <div className="aspect-square rounded-lg bg-neutral-200" />
      <div className="h-3 w-2/3 rounded bg-neutral-200" />
      <div className="h-2 w-1/3 rounded bg-neutral-200" />
    </div>
  );
}

function normalizeImgUrl(s) {
  if (!s) return null;
  s = String(s).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return window.location.protocol + s;
  if (/^[^\s\/]+\.[^\s\/]+/.test(s)) return 'https://' + s;
  return s;
}

function HomeProductCard({p}){
  const img = normalizeImgUrl(p.main_img || p.img1 || null);
  return (
    <Link to={`/urunler/${encodeURIComponent(p.sku)}`} className="max-w-[320px] w-full rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3 transform transition hover:scale-[1.02] hover:shadow-md focus:outline-none" onClick={()=>window.scrollTo(0,0)}>
      <div className="relative rounded-lg bg-neutral-50 overflow-hidden">
        {Number(p.discount) > 0 && (
          <div className="absolute left-3 top-3 z-20 bg-red-600 text-white px-2 py-0.5 text-xs font-semibold rounded">-{p.discount}%</div>
        )}
        <div className="m-4 bg-white rounded-lg border border-neutral-100 p-4 flex items-center justify-center" style={{minHeight:160}}>
          {img ? (
            <ProtectedImage src={img} alt={p.title} className="max-w-full max-h-[200px] object-contain" />
          ) : (
            <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
          )}
        </div>
      </div>
      <div className="text-sm text-neutral-600">{p.sku}</div>
      <div className="font-semibold line-clamp-2">{p.title}</div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{p.list_price ? p.list_price + ' TL' : ''}</div>
        <div className="text-xs text-neutral-500 flex items-center gap-1">
          <StarRating size={12} value={p.star_rating || 0} />
          {p.star_rating ? <span className="ml-1">{Number(p.star_rating).toFixed(1)}</span> : null}
        </div>
      </div>
      <div className="pt-3">
        <button className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 text-white text-sm font-semibold px-4 py-2 shadow-sm">İncele</button>
      </div>
    </Link>
  );
}

export default function Home() {
  console.log('[home] Home component render');
  useEffect(() => { applyHomeMeta(); }, []);
  // state for dynamic home lists
  const [popular, setPopular] = useState([]);
  const [popLoading, setPopLoading] = useState(true);
  const [popError, setPopError] = useState('');
  const [specialPrices, setSpecialPrices] = useState([]);

  useEffect(() => {
    setPopLoading(true); setPopError('');
    fetchHome().then(data => {
      setPopular(data.popular || []);
      setSpecialPrices(data.specialPrices || []);
    }).catch((err) => {
      setPopular([]);
      setSpecialPrices([]);
      setPopError('Veri alınamadı');
    }).finally(()=> setPopLoading(false));

    // fetch home data (popular & special prices)
    // random category/slot logic removed
  }, []);

  // random slot logic removed

  // sidebar visibility controlled by scroll relative to the hero slider
  const heroRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // detect mobile to fully deactivate sidebar on small screens
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    // If heroRef isn't mounted yet, skip setup
    if (!heroRef.current) return;

    // Use a scroll/resize listener with requestAnimationFrame to compute
    // how much of the hero is visible. This is more deterministic than
    // IntersectionObserver for a few display edge-cases where the hero
    // may report a small intersection immediately on some laptop sizes.
    let ticking = false;

    const checkHeroVisibility = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const height = rect.height || 1;
      // visible pixels of the hero within viewport
      const visiblePx = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      const ratio = visiblePx / height;
      // show sidebar only when hero is mostly out of view (<25% visible)
      setSidebarVisible(ratio < 0.25);
      ticking = false;
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checkHeroVisibility);
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    // initial check
    onScrollOrResize();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [heroRef]);

  return (
    <main className="font-sans bg-neutral-50 text-neutral-800">
      {/* SEO başlığı (görünmez) */}
      <h1 className="sr-only">Profesyonel ve Endüstriyel Pnömatik Havalı El Aletleri | Keten Pnömatik</h1>

      {/* HERO SLIDER (component görsel olarak durur) */}
      <div ref={heroRef}>
        <HeroSlider />
      </div>

  {/* Category sidebar removed from homepage (rendered on product list instead) */}

      {/* Random category sliders removed */}

      {/* Random category sliders removed */}

      {/* POPÜLER ÜRÜNLER */}
      <section className="py-20 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Popüler Ürünler</h2>
                {!popLoading && (
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">En Çok Tıklanan</span>
                )}
              </div>
              {popError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{popError}</div>
              )}
              <div className="relative">
                {popLoading ? (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`s-${i}`} className="group relative rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-white transition p-4 flex flex-col gap-3">
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 relative overflow-hidden">
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]" />
                        </div>
                        <div className="h-3.5 w-3/5 rounded bg-neutral-200 animate-pulse" />
                        <div className="h-2.5 w-2/5 rounded bg-neutral-200 animate-pulse" />
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold tracking-wider text-neutral-400">YÜKLENİYOR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <Swiper
                      modules={[Navigation, Autoplay]}
                      spaceBetween={24}
                      slidesPerView={1}
                      loop={false}
                      breakpoints={{
                        640: { slidesPerView: 2, spaceBetween: 16 },
                        768: { slidesPerView: 3, spaceBetween: 20 },
                        1024: { slidesPerView: 4, spaceBetween: 24 },
                      }}
                      navigation={{ nextEl: '.pop-next', prevEl: '.pop-prev' }}
                      className="py-2"
                    >
                      {popular.map((p, i) => {
                        const img = normalizeImgUrl(p.main_img || p.img1 || null);
                        const name = p.title || p.name || p.sku;
                        const handleClick = (e) => { e.stopPropagation(); window.scrollTo(0, 0); };

                        return (
                          <SwiperSlide key={p.sku || i}>
                            <Link
                              to={`/urunler/${encodeURIComponent(p.sku)}`}
                              onClick={handleClick}
                              className="group relative rounded-xl border border-neutral-200 bg-white overflow-hidden p-4 flex flex-col gap-3 transition-all duration-300 ease-out transform-gpu shadow-sm ring-1 ring-black/0 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-300/50 hover:border-neutral-300 hover:ring-black/5 focus-within:ring-black/10 cursor-pointer"
                            >
                              <div className="relative aspect-square bg-white border border-neutral-200/70 rounded-lg overflow-hidden grid place-items-center p-2 transition-colors duration-300 group-hover:bg-neutral-50">
                                  {Number(p.discount) > 0 && (
                                          <div className="absolute left-3 top-3 z-30 bg-red-600 text-white px-2 py-0.5 text-xs font-semibold rounded">-{p.discount}%</div>
                                        )}
                                {img ? (
                                    <ProtectedImage
                                      src={img}
                                      alt={name || p.sku}
                                      className="block w-full h-full object-contain select-none product-image"
                                    />
                                  ) : (
                                    <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
                                  )}
                              </div>
                              <div className="text-xs text-neutral-500">{p.sku}</div>
                              <div className="text-sm font-semibold line-clamp-2 min-h-[2.25rem]">{name}</div>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                                <StarRating size={12} value={p.star_rating || 0} />
                                <span>{p.star_rating ? `${Number(p.star_rating).toFixed(1)} Kalite` : '—'}</span>
                              </div>
                              <div className="mt-2 flex items-baseline gap-3">
                                  { (p.list_price || p.list_price === 0) ? (
                                    p.list_price === 0 ? (
                                      <div className="text-sm font-semibold text-neutral-900">Fiyat için teklif alınız</div>
                                    ) : p.discount > 0 ? (
                                      <>
                                        <div className="text-sm text-neutral-500 line-through">{p.list_price} TL</div>
                                        <div className="text-sm font-semibold text-brand-orange">{Math.round((p.list_price * (100 - (p.discount || 0))) / 100)} TL</div>
                                      </>
                                    ) : (
                                      <div className="text-sm font-semibold text-neutral-900">{p.list_price} TL</div>
                                    )
                                  ) : null}
                                </div>
                              <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-neutral-500 text-white inline-flex items-center gap-2 shadow-sm">İncele</span>
                              </div>
                            </Link>
                          </SwiperSlide>
                        );
                      })}

                      {popular.length === 0 && (
                        Array.from({ length: 8 }).map((_, i) => (
                          <div key={`e-${i}`} className="rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-500 grid place-items-center">
                            Popüler ürün verisi yok
                          </div>
                        ))
                      )}

                      <div className="pop-prev swiper-button-prev !text-neutral-700 !bg-white !shadow-lg !border !border-neutral-200" />
                      <div className="pop-next swiper-button-next !text-neutral-700 !bg-white !shadow-lg !border !border-neutral-200" />
                    </Swiper>
                  </div>
                )}
              </div>
        </div>
      </section>

  {/* PAYMENT METHODS removed from here — rendered globally in Layout at the bottom of the page */}

      {/* ÖZEL FİYATLAR (yeni bileşen) */}
      <SpecialPrices specialPrices={specialPrices} />

      {/* TESTIMONIAL */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative grid md:grid-cols-2 items-center gap-0">
            <div>
              {/* Use native img temporarily to ensure the local asset renders */}
              <img src={senolbeyImg} alt="Şenol" className="w-full h-[420px] object-cover rounded-lg" />
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8 md:p-10 -mt-10 md:mt-0 md:-translate-x-16 lg:-translate-x-28 z-[2] relative">
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Şenol</p>
              <p className="text-sm font-medium text-brand-orange uppercase tracking-wider mb-4">Keten Pnömatik</p>
              <p className="text-neutral-700 leading-relaxed">“Sadece en iyi kaliteyi almanızı sağlamak için, teknolojik ürünlerimizi düzenli olarak sıkı testlere tabi tutuyoruz.”<br /><br /><span className="text-brand-orange font-semibold">#KALITELIHIZMET</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">Neden Biz?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">1</div>
              <h4 className="text-lg font-semibold mb-2">Uygulamalı Deneyim ve Hızlı Çözümler</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Müşterilerimize özel demo hizmetleri sunarak ürünlerimizin performansını yerinde test etme imkanı sağlıyoruz.</p>
            </div>
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">2</div>
              <h4 className="text-lg font-semibold mb-2">Verimli Hava Tüketimi</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Pazardaki tecrübemizle, müşterilerimizin ihtiyaçlarına en uygun, yüksek performanslı ürünleri seçiyoruz.</p>
            </div>
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">3</div>
              <h4 className="text-lg font-semibold mb-2">Servis Ağı</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Düşük hava tüketimiyle işletme maliyetlerinizi düşürürken, uzman teknik ekibimizle ihtiyacınız olduğunda anında yanınızdayız.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer moved to shared component (Layout) */}
    </main>
  );
}