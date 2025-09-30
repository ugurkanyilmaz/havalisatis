import WhatsAppButton from '../components/common/WhatsAppButton.jsx';
import { useMemo, useState } from 'react';

export default function Iletisim(){
  // Exact address string requested by the user — force this as the default query shown in the map
  const FIXED_ADDRESS = 'Osmanyılmaz, Mehmet Akif Ersoy Cad. No:52, 41400 Gebze/Kocaeli';
  // Allow overriding via Vite env vars for exact control (useful when Google queries are ambiguous)
  const VENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const envQuery = VENV.VITE_CONTACT_QUERY || '';
  const envLat = VENV.VITE_CONTACT_LAT || '';
  const envLng = VENV.VITE_CONTACT_LNG || '';

  // Branches data
  const BRANCHES = {
    merkez: {
      key: 'merkez',
      label: 'Merkez (Gebze)',
      address: FIXED_ADDRESS,
      phones: [
        { label: 'Mobil', display: '+90 (541) 452 60 58', raw: '+905414526058' },
        { label: 'PBX', display: '+90 (262) 643 43 39', raw: '+902626434339', pbx: true }
      ],
      emergencyPhones: [
        { label: 'Acil Durum', display: '+90 (542) 351 00 37', raw: '+905423510037', emergency: true },      ]
    },
    manisa: {
      key: 'manisa',
      label: 'Manisa',
      address: '75. Yıl, 5307. Sk. No:17/A, 45030 Yunusemre/Manisa',
      phones: [
        { label: 'Mobil', display: '+90 (532) 652 41 45', raw: '+905326524145' },
        { label: 'PBX', display: '+90 (236) 236 41 45', raw: '+902362364145', pbx: true }
      ],
      emergencyPhones: [
        { label: 'Acil Durum', display: '+90 (555) 395 75 49', raw: '+905553957549', emergency: true }
      ]
    }
  };

  const [selectedBranchKey, setSelectedBranchKey] = useState('merkez');

  const { mapSrc, displayAddress, mapsUrl, branch } = useMemo(() => {
    const selected = BRANCHES[selectedBranchKey] || BRANCHES.merkez;
    // If explicit lat/lng provided AND center is Gebze (backward compatible), allow precise placement.
    if (selected.key === 'merkez' && envLat && envLng) {
      const lat = String(envLat).trim();
      const lng = String(envLng).trim();
      const src = `https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}&z=15&output=embed`;
      return { mapSrc: src, displayAddress: selected.address, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` , branch: selected };
    }
    // Prefer envQuery for merkez if provided; otherwise branch address
    const baseQuery = (selected.key === 'merkez' && envQuery && envQuery.trim()) ? envQuery.trim() : selected.address;
    const shouldAppendCountry = !/\+/.test(baseQuery) && !/,\s*(turkey|türkiye|tr)$/i.test(baseQuery);
    const queryWithCountry = shouldAppendCountry ? baseQuery + ', Türkiye' : baseQuery;
    const encoded = encodeURIComponent(queryWithCountry);
    const src = `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;
    return { mapSrc: src, displayAddress: selected.address, mapsUrl: `https://maps.google.com/maps?q=${encoded}`, branch: selected };
  }, [selectedBranchKey, envQuery, envLat, envLng]);
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 relative">
      <h1 className="text-3xl font-bold tracking-tight mb-4">İletişim</h1>
      <p className="text-sm text-neutral-600 mb-6">Aşağıdaki bilgilerden bize ulaşabilirsiniz. Servis talepleri için lütfen telefon veya e-posta ile ön kayıt yapın.</p>
  <div className="grid lg:grid-cols-5 gap-10 items-start">
        {/* Bilgi Bloğu */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-neutral-700" htmlFor="branch">Şubelerimiz</label>
            <select
              id="branch"
              className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
              value={selectedBranchKey}
              onChange={(e)=>setSelectedBranchKey(e.target.value)}
            >
              <option value="merkez">Merkez (Gebze)</option>
              <option value="manisa">Manisa</option>
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-neutral-700">Adres</h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed whitespace-pre-line">{displayAddress || FIXED_ADDRESS}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="font-semibold tracking-wide text-neutral-700 text-[11px]">Telefon</h4>
                {branch.phones.map((p, idx) => (
                  <div key={idx} className={idx > 0 ? 'mt-3' : ''}>
                    <p className="text-neutral-600 mt-1">{p.display} {p.pbx && (<span className="text-[11px] text-neutral-500">(PBX)</span>)}</p>
                    <a
                      href={`tel:${p.raw}`}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-green-600 hover:text-green-700 hover:underline transition"
                      aria-label={`${p.label} numarasını ara`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.3 19.3 0 0 1-6-6 19.72 19.72 0 0 1-3.07-8.67A2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.77.73 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.29a2 2 0 0 1 2.11-.45c.83.36 1.7.61 2.6.73A2 2 0 0 1 22 16.92Z" />
                      </svg>
                      Hemen Ara
                    </a>
                  </div>
                ))}

                {branch.emergencyPhones && branch.emergencyPhones.length > 0 && (
                  <>
                    {branch.emergencyPhones.map((p, idx) => (
                      <div key={`e-${idx}`} className={branch.phones.length + idx > 0 ? 'mt-3' : ''}>
                        <p className="text-neutral-600 mt-1">{p.display} {p.pbx && (<span className="text-[11px] text-neutral-500">(PBX)</span>)}</p>
                        <p className="text-xs text-neutral-500 mt-1">Mesai saatleri dışında aranacak numara.</p>
                        <a
                          href={`tel:${p.raw}`}
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-green-600 hover:text-green-700 hover:underline transition"
                          aria-label={`${p.label} numarasını ara`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.3 19.3 0 0 1-6-6 19.72 19.72 0 0 1-3.07-8.67A2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.77.73 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.29a2 2 0 0 1 2.11-.45c.83.36 1.7.61 2.6.73A2 2 0 0 1 22 16.92Z" />
                          </svg>
                          Hemen Ara
                        </a>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div>
                <h4 className="font-semibold tracking-wide text-neutral-700 text-[11px]">E-posta</h4>
                <p className="text-neutral-600 mt-1 break-all">info@ketenpnomatik.com.tr</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-neutral-700">Çalışma Saatleri</h3>
            <ul className="text-xs text-neutral-600 leading-relaxed">
              <li>Hafta içi: 08:00 – 18:00</li>
              <li>Cumartesi: 08:00 – 13:00</li>
              <li>Pazar: Kapalı</li>
            </ul>
          </div>
        </div>

        {/* Harita */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <div className="relative h-[380px] w-full">
            <iframe
              title="İşletme Konumu Harita"
              aria-label="Harita"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapSrc}
            />
          </div>
          <div className="border-t border-neutral-200 bg-neutral-50/70 p-3 text-[11px] font-medium text-neutral-600 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 21s-6-5.686-6-11a6 6 0 1 1 12 0c0 5.314-6 11-6 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Sabit Konum Gösteriliyor — <a className="underline" target="_blank" rel="noopener noreferrer" href={mapsUrl}>Harcaya Git</a>
            </span>
          </div>
        </div>
      </div>
  <WhatsAppButton message="Merhaba, iletişim/servis hakkında bilgi almak istiyorum." subtitle="Bilgi Al" />
    </div>
  );
}
