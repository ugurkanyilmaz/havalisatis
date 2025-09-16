import { useState, useEffect, useRef } from 'react';

// Basit otomatik kayan hero slider (placeholder içerik)
const SLIDES = [
  {
    id: 1,
    title: 'KETEN PNÖMATİK',
    tagline: 'Pnömatik Güç. Kesintisiz Performans.',
    desc: 'Profesyonel ve endüstriyel kullanım için tasarlanan yüksek verimli ve dayanıklı havalı el aletleri.',
    ctaPrimary: 'Katalog Görüntüle',
    ctaSecondary: 'İletişime Geç',
    bg: 'from-[#1f1f20] via-[#262729] to-[#141415]',
    accent: 'brand-orange'
  },
  {
    id: 2,
    title: 'PROFESYONEL SERİ',
    tagline: 'Hafif • Ergonomik • Verimli',
    desc: 'Atölye ve servis uygulamalarında optimum tork / ağırlık dengesi ile üretkenliğinizi artırın.',
    ctaPrimary: 'Profesyonel Seri',
    ctaSecondary: 'Detay Al',
    bg: 'from-[#081a2b] via-[#0f2538] to-[#05101a]',
    accent: 'sky-500'
  },
  {
    id: 3,
    title: 'ENDÜSTRİYEL SERİ',
    tagline: '24/7 Çalışma Dayanıklılığı',
    desc: 'Ağır hat üretimi ve vardiya koşulları için sürekli performans, düşük arıza süresi.',
    ctaPrimary: 'Endüstriyel Seri',
    ctaSecondary: 'Dayanıklılık',
    bg: 'from-[#1d120f] via-[#2a1c17] to-[#120904]',
    accent: 'amber-500'
  }
];

export default function HeroSlider({ onFirstShown }){
  const [index, setIndex] = useState(0);
  const next = ()=> setIndex(i => (i + 1) % SLIDES.length);
  const prev = () => setIndex(i => (i - 1 + SLIDES.length) % SLIDES.length);
  const go = i => setIndex(i);

  // İlk slide görünür olduğunda callback tetikle (bir kez)
  const firstShownRef = useRef(false);
  useEffect(()=>{
    if(index === 0 && !firstShownRef.current){
      firstShownRef.current = true;
      onFirstShown?.();
    }
  }, [index, onFirstShown]);

  // No auto-rotation, no swipe/scroll handlers

  return (
    <section className="relative overflow-hidden isolate">
      <div
        className="relative h-[560px] md:h-[600px]"
      >
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${active? 'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.bg}`} />
              <div className="absolute -top-32 -left-40 w-[520px] h-[520px] rounded-full bg-brand-orange/30 blur-3xl opacity-40" />
              <div className="absolute top-24 -right-40 w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl opacity-40" />
              <div className="relative max-w-6xl mx-auto px-6 pt-28 md:pt-32 pb-20 text-center text-white flex flex-col gap-6">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-orange via-orange-400 to-amber-200 drop-shadow-sm">
                  {s.title}
                </h1>
                <p className="text-lg md:text-2xl font-light text-neutral-200">{s.tagline}</p>
                <p className="max-w-3xl mx-auto text-base md:text-lg text-neutral-300 leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(255,122,0,.55)] hover:bg-orange-500 transition">
                    {s.ctaPrimary}
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                  <button className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition">
                    {s.ctaSecondary}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Buttons */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
          <button aria-label="Önceki" onClick={prev} className="pointer-events-auto h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18 9 12l6-6"/></svg>
          </button>
          <button aria-label="Sonraki" onClick={next} className="pointer-events-auto h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((s,i)=>(
            <button
              key={s.id}
              aria-label={`Slide ${i+1}`}
              onClick={()=>go(i)}
              className={`h-2.5 rounded-full transition-all ${i===index? 'w-8 bg-brand-orange shadow':'w-2.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}