import WhatsAppButton from '../components/common/WhatsAppButton.jsx';
import { useMemo, useState } from 'react';

export default function Iletisim(){
  const DEFAULT_QUERY = import.meta.env.VITE_MAP_QUERY || 'Gebze, Kocaeli';
  const CITIES = useMemo(() => ([
    { key: 'gebze', label: 'Gebze', query: 'Gebze, Kocaeli' },
    { key: 'manisa', label: 'Manisa', query: 'Manisa, Türkiye' },
    { key: 'ankara', label: 'Ankara', query: 'Ankara, Türkiye' },
  ]), []);
  const defaultKey = useMemo(() => {
    const found = CITIES.find(c => c.query.toLowerCase() === DEFAULT_QUERY.toLowerCase());
    return found?.key || 'gebze';
  }, [CITIES, DEFAULT_QUERY]);
  const [selectedKey, setSelectedKey] = useState(defaultKey);
  const selectedCity = useMemo(() => CITIES.find(c => c.key === selectedKey) || CITIES[0], [CITIES, selectedKey]);
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 relative">
      <h1 className="text-3xl font-bold tracking-tight mb-4">İletişim</h1>
      <p className="text-sm text-neutral-600 mb-10">İşletmemizle iletişim kurmak ve lokasyonumuzu görmek için aşağıdaki bilgileri kullanabilirsiniz.</p>
      <div className="grid lg:grid-cols-5 gap-10 items-start">
        {/* Bilgi Bloğu */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-neutral-700">Adres</h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">(Placeholder) Organize Sanayi Bölgesi<br/> 1. Cadde No: 00 Şehir / Ülke</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="font-semibold tracking-wide text-neutral-700 text-[11px]">Telefon</h4>
                <p className="text-neutral-600 mt-1">+90 (000) 000 00 00</p>
                <a
                  href="tel:+900000000000"
                  className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-green-600 hover:text-green-700 hover:underline transition"
                  aria-label="Telefonu ara"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.3 19.3 0 0 1-6-6 19.72 19.72 0 0 1-3.07-8.67A2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.77.73 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.29a2 2 0 0 1 2.11-.45c.83.36 1.7.61 2.6.73A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  Hemen Ara
                </a>
              </div>
              <div>
                <h4 className="font-semibold tracking-wide text-neutral-700 text-[11px]">E-posta</h4>
                <p className="text-neutral-600 mt-1 break-all">info@ketenpnomatik.com</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-700">Çalışma Saatleri</h3>
            <ul className="text-xs text-neutral-600 leading-relaxed">
              <li>Hafta içi: 08:00 – 18:00</li>
              <li>Cumartesi: 08:00 – 12:00</li>
              <li>Pazar: Kapalı</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-700">Not</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Harita görseli placeholder. Gerçek konum koordinatları ve Google Maps iframe / OpenStreetMap embed daha sonra eklenecek.</p>
          </div>
        </div>

        {/* Harita */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <div className="relative h-[380px] w-full">
            <iframe
              key={selectedCity.key}
              title={`${selectedCity.label} Harita`}
              aria-label="Harita"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(selectedCity.query)}&output=embed&z=13`}
            />
          </div>
          <div className="border-t border-neutral-200 bg-neutral-50/70 p-3 flex items-center justify-between gap-3">
            <label htmlFor="city-select" className="text-[11px] font-semibold tracking-wide text-neutral-600">Şehir Seçin</label>
            <select
              id="city-select"
              value={selectedKey}
              onChange={(e)=>setSelectedKey(e.target.value)}
              className="text-sm bg-white border border-neutral-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              {CITIES.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
  <WhatsAppButton message="Merhaba, lokasyon hakkında bilgi almak istiyorum." subtitle="Bilgi Al" />
    </div>
  );
}
