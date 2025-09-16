import { useCart } from '../context/CartContext.jsx';
import proffesionalImg from '../components/proffesional.png';
import endustryImg from '../components/endustry.png';
import HeroSlider from '../components/HeroSlider.jsx';
import { useEffect, useState } from 'react';
import { fetchPopularProducts } from '../lib/api.js';
import { fetchDiscountedProducts } from '../lib/api.js';
import StarRating from '../components/common/StarRating.jsx';
import { Link } from 'react-router-dom';

export default function Home() {
  const { addItem } = useCart?.() || { addItem: ()=>{} };
  const [catsAnimate, setCatsAnimate] = useState(false);
  const [popular, setPopular] = useState([]);
  const [popLoading, setPopLoading] = useState(true);
  const [popError, setPopError] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [discError, setDiscError] = useState('');
  const COMPANY_SITE_URL = import.meta.env.VITE_COMPANY_SITE_URL || '#';
  const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || '#';

  useEffect(() => {
    let mounted = true;
    setPopLoading(true);
    setPopError('');
    fetchPopularProducts(8)
      .then((list) => { if (mounted) setPopular(Array.isArray(list) ? list : []); })
      .catch((e) => { if (mounted) setPopError(e?.message || 'Popüler ürünler yüklenemedi'); })
      .finally(() => { if (mounted) setPopLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setDiscLoading(true);
    setDiscError('');
    fetchDiscountedProducts(10, 0)
      .then((list) => { if (mounted) setDiscounts(Array.isArray(list) ? list : []); })
      .catch((e) => { if (mounted) setDiscError(e?.message || 'İndirimdeki ürünler yüklenemedi'); })
      .finally(() => { if (mounted) setDiscLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <main className="font-sans bg-neutral-50 text-neutral-800">
  {/* HERO SLIDER */}
  <HeroSlider onFirstShown={()=>setCatsAnimate(true)} />

      {/* KATEGORİLER */}
  <section className="relative mt-0 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 text-center mb-10">Kategoriler</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`group relative rounded-2xl bg-white border border-neutral-200/70 shadow-sm hover:shadow-xl transition overflow-hidden p-7 flex flex-col gap-4 ${catsAnimate? 'animate-cat-left':'opacity-0 translate-x-[-80px]'}`}>
              {/* Arka plan görseli ve katmanlar */}
              <img src={proffesionalImg} alt="Profesyonel Seri" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-white/65" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-brand-orange/5 to-transparent" />
              <span className="relative inline-flex w-fit items-center gap-1 rounded-full bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider px-3 py-1">
                PROFESYONEL
              </span>
              <h3 className="relative text-xl font-semibold">Profesyonel Seri</h3>
              <p className="relative text-sm text-neutral-600 leading-relaxed">Servis, bakım ve atölye uygulamalarında dengeli güç / ağırlık oranı ve ergonomi.</p>
              <ul className="relative mt-2 space-y-1.5 text-sm text-neutral-700 list-disc pl-5">
                <li>Hafif gövde</li>
                <li>Düşük titreşim</li>
                <li>Hassas tork kontrolü</li>
              </ul>
              <div className="mt-auto pt-2 flex flex-wrap gap-2">
                <a
                  href="/urunler"
                  className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange text-white text-[11px] font-semibold tracking-wide px-3 py-1.5 hover:bg-orange-500 transition shadow-sm"
                >
                  Ürünlere göz at
                </a>
                <a
                  href={CATALOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 text-neutral-800 text-[11px] font-semibold tracking-wide px-3 py-1.5 hover:bg-neutral-100 transition"
                >
                  Katalogu görüntüle
                </a>
              </div>
            </div>
            <div className={`group relative rounded-2xl bg-white border border-neutral-200/70 shadow-sm hover:shadow-xl transition overflow-hidden p-7 flex flex-col gap-4 ${catsAnimate? 'animate-cat-right':'opacity-0 translate-x-[80px]'}`}>
              {/* Arka plan görseli ve katmanlar */}
              <img src={endustryImg} alt="Endüstriyel Seri" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-white/65" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-neutral-800/5 to-transparent" />
              <span className="relative inline-flex w-fit items-center gap-1 rounded-full bg-neutral-800/10 text-neutral-800 text-[11px] font-semibold tracking-wider px-3 py-1">
                ENDÜSTRİYEL
              </span>
              <h3 className="relative text-xl font-semibold">Endüstriyel Seri</h3>
              <p className="relative text-sm text-neutral-600 leading-relaxed">Ağır hat üretimi ve kesintisiz vardiya koşulları için maksimum dayanıklılık ve tork.</p>
              <ul className="relative mt-2 space-y-1.5 text-sm text-neutral-700 list-disc pl-5">
                <li>Ağır hizmet bileşenler</li>
                <li>Sürekli çalışma</li>
                <li>Yüksek tork / düşük tüketim</li>
              </ul>
              <div className="mt-auto pt-2 flex flex-wrap gap-2">
                <a
                  href={COMPANY_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange text-white text-[11px] font-semibold tracking-wide px-3 py-1.5 hover:bg-orange-500 transition shadow-sm"
                >
                  Web sitemizi görüntüle
                </a>
                <a
                  href={CATALOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 text-neutral-800 text-[11px] font-semibold tracking-wide px-3 py-1.5 hover:bg-neutral-100 transition"
                >
                  Katalogu görüntüle
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPÜLER ÜRÜNLER */}
      <section className="py-20 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Popüler Ürünler</h2>
            {!popLoading && (
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">En Çok Tıklanan 8 • Tıklanma Sayısına Göre</span>
            )}
          </div>
          {popError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{popError}</div>
          )}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popLoading && Array.from({length:8}).map((_,i)=>(
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
            {!popLoading && popular.map((p, i) => (
              <Link
                key={p.sku || i}
                to={`/urunler/${p.sku}`}
                onClick={() => window.scrollTo(0, 0)}
                className="group relative rounded-xl border border-neutral-200 bg-white overflow-hidden p-4 flex flex-col gap-3 transition-all duration-300 ease-out transform-gpu shadow-sm ring-1 ring-black/0 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-300/50 hover:border-neutral-300 hover:ring-black/5 focus-within:ring-black/10 cursor-pointer"
              >
                <div className="relative aspect-square bg-white border border-neutral-200/70 rounded-lg overflow-hidden grid place-items-center p-2 transition-colors duration-300 group-hover:bg-neutral-50">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name || p.sku}
                      className="block w-full h-full object-contain select-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
                  )}
                </div>
                <div className="text-xs text-neutral-500">{p.sku}</div>
                <div className="text-sm font-semibold line-clamp-2 min-h-[2.25rem]">{p.name || p.sku}</div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <StarRating size={12} />
                  <span>5.0 Kalite</span>
                </div>
                <div className="mt-1 text-sm font-bold">{(Number(p.price)||0).toLocaleString('tr-TR', { style:'currency', currency:'TRY' })}</div>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-neutral-400">{p.clicks} tıklanma</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem({ id:p.sku, name:p.name || p.sku, price: Number(p.price)||0 });
                    }}
                    className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-brand-orange text-white hover:bg-orange-500 transition inline-flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  >
                    Sepete Ekle
                  </button>
                </div>
              </Link>
            ))}
            {!popLoading && !popular.length && (
              Array.from({length:8}).map((_,i)=>(
                <div key={`e-${i}`} className="rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-500 grid place-items-center">
                  Popüler ürün verisi yok
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* İNDİRİMDEKİ ÜRÜNLER */}
      <section className="py-20 bg-neutral-50 border-t border-neutral-200/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">İndirimdeki Ürünler</h2>
            {!discLoading && (
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">İndirimli ürünler</span>
            )}
          </div>
          {discError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{discError}</div>
          )}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {discLoading && Array.from({length:10}).map((_,i)=>(
              <div key={`d-s-${i}`} className="group relative rounded-xl border border-rose-200/60 bg-white transition p-4 flex flex-col gap-3 overflow-hidden">
                <div className="absolute -right-10 -top-10 w-28 h-28 rotate-45 bg-gradient-to-br from-rose-400/10 to-transparent pointer-events-none" />
                <div className="aspect-video rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 relative overflow-hidden">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-rose-200 via-rose-100 to-rose-200 bg-[length:200%_100%]" />
                </div>
                <div className="h-3.5 w-3/5 rounded bg-rose-200 animate-pulse" />
                <div className="h-2.5 w-2/5 rounded bg-rose-100 animate-pulse" />
              </div>
            ))}
            {!discLoading && discounts.map((p) => {
              const img = p.main_img || p.img1 || p.img2 || p.img3 || p.img4 || null;
              const price = Number(p.price) || 0;
              const disc = Number(p.discount_percent) || 0;
              const final = disc ? Math.round(price * (1 - disc/100) * 100) / 100 : price;
              return (
                <Link 
                  key={p.id} 
                  to={`/urunler/${p.sku}`} 
                  onClick={() => window.scrollTo(0, 0)}
                  className="group relative rounded-xl border border-rose-200/60 bg-white hover:shadow-md transition p-4 flex flex-col gap-3 overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-10 -top-10 w-28 h-28 rotate-45 bg-gradient-to-br from-rose-400/10 to-transparent pointer-events-none" />
                  <div className="aspect-video rounded-lg bg-rose-50 relative overflow-hidden">
                    {img ? (
                      <img src={img} alt={p.title || p.sku} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-neutral-400 text-xs">Görsel yok</div>
                    )}
                    {disc > 0 && (
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-rose-500 text-white text-[10px] font-semibold px-2 py-1 shadow-sm">-%{disc}</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{p.sku}</div>
                  <div className="text-sm font-semibold line-clamp-2 min-h-[2.25rem]">{p.title || p.sku}</div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <StarRating size={12} />
                    <span>5.0 Kalite</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {disc > 0 && <div className="text-xs line-through text-neutral-400">{price.toLocaleString('tr-TR', { style:'currency', currency:'TRY' })}</div>}
                    <div className="text-sm font-bold text-rose-600">{final.toLocaleString('tr-TR', { style:'currency', currency:'TRY' })}</div>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-wider text-rose-500/70">KAMPANYA</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({ id:p.id, name:p.title || p.sku, price: final, image: img });
                      }} 
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Sepete Ekle
                    </button>
                  </div>
                </Link>
              );
            })}
            {!discLoading && discounts.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 text-center">
                Şu anda indirimli ürün yoktur.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">Neden Keten?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm hover:shadow-lg transition">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">1</div>
              <h4 className="text-lg font-semibold mb-2">Uzun Ömür</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Optimize iç mekanizma ve kaliteli alaşımlar ile servis intervali uzar.</p>
            </div>
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm hover:shadow-lg transition">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">2</div>
              <h4 className="text-lg font-semibold mb-2">Verimli Hava Tüketimi</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Düşük tüketim = daha düşük işletme maliyeti ve sürdürülebilir performans.</p>
            </div>
            <div className="relative rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm hover:shadow-lg transition">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">3</div>
              <h4 className="text-lg font-semibold mb-2">Servis Ağı</h4>
              <p className="text-sm leading-relaxed text-neutral-600">Yedek parça ve teknik destek ile minimum duruş süresi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-orange via-orange-500 to-amber-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 drop-shadow">Proje Odaklı Çözüm mü Arıyorsunuz?</h3>
            <p className="text-sm md:text-base text-white/90 max-w-xl">Uygulama gereksinimlerinizi paylaşın, doğru pnömatik alet kombinasyonu için sizi yönlendirelim.</p>
          </div>
          <div className="flex gap-4">
            <button className="rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-6 py-3 text-sm font-semibold tracking-wide transition">Teklif Al</button>
            <button className="rounded-xl bg-neutral-900/90 hover:bg-neutral-900 text-sm font-semibold tracking-wide px-6 py-3 transition">İletişim</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1f1f20] text-neutral-400 text-sm">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-12">
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wide">KETEN PNÖMATİK</h4>
            <p className="text-xs leading-relaxed text-neutral-400">Profesyonel ve endüstriyel pnömatik el aletlerinde verimlilik & dayanıklılık.</p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3 text-xs tracking-wider">KATEGORİLER</h5>
            <ul className="space-y-1 text-xs">
              <li>Profesyonel Seri</li>
              <li>Endüstriyel Seri</li>
              <li>Darbeli Sıkma</li>
              <li>Zımpara & Taşlama</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3 text-xs tracking-wider">BİLGİ</h5>
            <ul className="space-y-1 text-xs">
              <li>Hakkında (yakında)</li>
              <li>Servis (yakında)</li>
              <li>İletişim (yakında)</li>
              <li>Gizlilik (placeholder)</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 text-center py-5 text-[11px] tracking-wide">
          © {new Date().getFullYear()} Keten Pnömatik • Tüm hakları saklıdır.
        </div>
      </footer>
    </main>
  );
}
