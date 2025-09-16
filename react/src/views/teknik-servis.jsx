import { useState, useMemo } from 'react';
import WhatsAppButton from '../components/common/WhatsAppButton.jsx';

// Aynı form mantığını burada inline tekrar ediyoruz (nested route yerine tek sayfa istenirse)
// Çalışma saatleri: Hafta içi 08:00-18:00, Cumartesi 08:00-12:00, Pazar kapalı.
const HOURS = { weekday: { start: 8, end: 18 }, saturday: { start: 8, end: 12 } };
const isWeekend = d => d.getDay() === 0;
const isSaturday = d => d.getDay() === 6;

const MOCK = [
  {
    id: 1,
    urun: 'Darbeli Somun Sıkma X120',
    durum: 'Tamamlandı',
    tarih: '2025-08-12', // kapatma tarihi (tamamlandığında)
    aciklama: 'Bakım ve yağ değişimi yapıldı.',
    teslimAlma: '2025-08-10',
    teslimEtme: '2025-08-12',
    tahminiTeslim: null,
    degisenParcalar: ['Yağ filtresi', 'O-ring seti'],
    yapilanIslemler: ['Temizlik', 'Yağ değişimi', 'Performans testi'],
    ucret: 1250
  },
  {
    id: 2,
    urun: 'Pnömatik Matkap M45',
    durum: 'Beklemede',
    tarih: '2025-09-01',
    aciklama: 'Yedek parça bekleniyor.',
    teslimAlma: '2025-09-01',
    teslimEtme: null,
    tahminiTeslim: '2025-09-10',
    degisenParcalar: [],
    yapilanIslemler: ['Arıza tespiti'],
    ucret: null
  },
  {
    id: 3,
    urun: 'Zımpara Aleti S300',
    durum: 'Serviste',
    tarih: '2025-09-05',
    aciklama: 'Rotor balans kontrolü.',
    teslimAlma: '2025-09-05',
    teslimEtme: null,
    tahminiTeslim: '2025-09-08',
    degisenParcalar: ['Rotor'],
    yapilanIslemler: ['Balans ölçümü', 'Rotor sökümü'],
    ucret: 800
  }
];

export default function TeknikServis(){
  // Ilk açılışta hiçbir kategori seçili değil
  const [activeTab, setActiveTab] = useState(null); // 'randevu' | 'kayitlar' | null
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');
  const [upcoming, setUpcoming] = useState(null); // { id, date, hour, note }
  const [selectedRecord, setSelectedRecord] = useState(null); // Detay görüntüleme için

  const hours = useMemo(()=>{
    if(!date) return [];
    const d = new Date(date + 'T00:00:00');
    if(isWeekend(d)) return [];
    const range = isSaturday(d) ? HOURS.saturday : HOURS.weekday;
    const list = [];
    for(let h = range.start; h < range.end; h++){
      list.push(`${String(h).padStart(2,'0')}:00`);
      list.push(`${String(h).padStart(2,'0')}:30`);
    }
    return list;
  }, [date]);

  const filtered = MOCK.filter(r=> r.urun.toLowerCase().includes(filter.toLowerCase()) || r.durum.toLowerCase().includes(filter.toLowerCase()));

  function formatCost(val){
    if(val === null || val === undefined) return '—';
    try { return `₺ ${Number(val).toLocaleString('tr-TR')}`; } catch { return `₺ ${val}`; }
  }

  function submitAppointment(e){
    e.preventDefault();
  if(upcoming) return; // güvenlik bariyeri
  const newAppt = { id: Date.now(), date, hour, note: note.trim() };
  // Mock persistance (sadece state). Gerçekte API çağrısı sonrası set edilecek.
  setUpcoming(newAppt);
  // Temizle
  setDate('');
  setHour('');
  setNote('');
  alert('Randevu oluşturuldu (mock).');
  }

  const showSelector = activeTab === null;

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Teknik Servis</h1>

      {showSelector && (
        <div className="mb-8 grid lg:grid-cols-5 gap-10 items-stretch">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <button onClick={()=>setActiveTab('randevu')} className="group relative rounded-2xl border border-neutral-200 bg-white p-7 text-left shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col gap-4">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/0 to-brand-orange/15 opacity-0 group-hover:opacity-100 transition" />
              <div className="h-12 w-12 rounded-xl bg-brand-orange/15 text-brand-orange font-bold flex items-center justify-center text-sm shadow-inner">R</div>
              <div className="relative z-10">
                <h2 className="text-lg font-semibold tracking-tight mb-1">Randevu Al</h2>
                <p className="text-[11px] leading-relaxed text-neutral-600">Tarih ve saat seçerek teknik servis talebi oluşturun.</p>
              </div>
              <span className="relative z-10 mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange">Devam et →</span>
            </button>
            <button onClick={()=>setActiveTab('kayitlar')} className="group relative rounded-2xl border border-neutral-200 bg-white p-7 text-left shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col gap-4">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 to-sky-500/15 opacity-0 group-hover:opacity-100 transition" />
              <div className="h-12 w-12 rounded-xl bg-sky-500/15 text-sky-600 font-bold flex items-center justify-center text-sm shadow-inner">K</div>
              <div className="relative z-10">
                <h2 className="text-lg font-semibold tracking-tight mb-1">Servis Kayıtları</h2>
                <p className="text-[11px] leading-relaxed text-neutral-600">Geçmiş ve aktif işlemlerinizin durumunu inceleyin.</p>
              </div>
              <span className="relative z-10 mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600">Kayıtları Gör →</span>
            </button>
          </div>
          <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-dashed border-neutral-300/70 bg-neutral-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#ffffff,#f1f5f9)]" />
            <div className="relative flex flex-col items-center text-center gap-4 max-w-sm">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" className="h-12 w-12 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Placeholder Görsel Alanı</h3>
              <p className="text-[12px] leading-relaxed text-neutral-600">Buraya servis operasyonuyla ilgili bir fotoğraf / illustrasyon eklenecek. Şimdilik placeholder.</p>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">SOON</span>
            </div>
          </div>
        </div>
      )}

      {!showSelector && (
        <div className="flex gap-3 mb-6 text-[11px] font-semibold">
          <button onClick={()=>setActiveTab(null)} className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 transition">← Kategoriler</button>
          <div className="flex gap-2">
            <button onClick={()=>setActiveTab('randevu')} className={`px-4 py-2 rounded-full border transition ${activeTab==='randevu' ? 'bg-brand-orange text-white border-brand-orange' : 'border-neutral-300 hover:bg-neutral-100'}`}>Randevu</button>
            <button onClick={()=>setActiveTab('kayitlar')} className={`px-4 py-2 rounded-full border transition ${activeTab==='kayitlar' ? 'bg-brand-orange text-white border-brand-orange' : 'border-neutral-300 hover:bg-neutral-100'}`}>Kayıtlar</button>
          </div>
        </div>
      )}

      {activeTab === 'randevu' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm mb-10 space-y-8 relative">
          <div>
            <h2 className="text-xl font-semibold mb-2">Randevu Al</h2>
            <p className="text-[11px] text-neutral-500">Hafta içi 08:00-18:00 • Cumartesi 08:00-12:00 • Pazar kapalı</p>
          </div>

          {/* Yaklaşan Randevularım */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide">Yaklaşan Randevularım</h3>
              {upcoming && (
                <button onClick={()=>{ if(confirm('Randevuyu iptal etmek istediğinizden emin misiniz?')) setUpcoming(null); }} className="text-[10px] font-semibold px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition">İptal Et</button>
              )}
            </div>
            {!upcoming && (
              <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 text-[10px] font-bold">–</span>
                Aktif randevunuz bulunmuyor.
              </div>
            )}
            {upcoming && (
              <div className="grid md:grid-cols-4 gap-4 text-[11px]">
                <div className="flex flex-col gap-1"><span className="font-semibold text-neutral-600">Tarih</span><span className="text-neutral-800">{upcoming.date}</span></div>
                <div className="flex flex-col gap-1"><span className="font-semibold text-neutral-600">Saat</span><span className="text-neutral-800">{upcoming.hour}</span></div>
                <div className="flex flex-col gap-1 md:col-span-2"><span className="font-semibold text-neutral-600">Not</span><span className="text-neutral-800 truncate" title={upcoming.note || '(yok)'}>{upcoming.note || '(yok)'}</span></div>
              </div>
            )}
            {upcoming && (
              <div className="text-[10px] text-amber-600 font-medium bg-amber-100/60 border border-amber-200 px-3 py-1.5 rounded-md inline-block">Yeni randevu oluşturmak için mevcut randevuyu iptal edin.</div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={submitAppointment} className="grid md:grid-cols-3 gap-6 text-[12px] relative">
            <fieldset className="contents" disabled={!!upcoming} aria-disabled={!!upcoming}>
              <label className="flex flex-col gap-2 font-medium">Tarih
                <input type="date" value={date} onChange={e=>{setDate(e.target.value); setHour('');}} required className="px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-brand-orange disabled:opacity-60" />
              </label>
              <label className="flex flex-col gap-2 font-medium">Saat
                <select value={hour} onChange={e=>setHour(e.target.value)} required disabled={!date || hours.length===0} className="px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-brand-orange disabled:opacity-60">
                  <option value="">Seçiniz</option>
                  {hours.length===0 && date && <option disabled>Uygun saat yok</option>}
                  {hours.map(h=> <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-2 font-medium md:col-span-3">Not (opsiyonel)
                <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Arıza / talep açıklaması" className="px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-brand-orange resize-none disabled:opacity-60" />
              </label>
              <div className="md:col-span-3 flex gap-4">
                <button type="submit" disabled={!date || !hour || !!upcoming} className="px-6 py-2 rounded-lg bg-brand-orange text-white font-semibold text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">Randevu Talep Et</button>
                {!upcoming && <button type="button" onClick={()=>{ setDate(''); setHour(''); setNote(''); }} className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 text-[11px] hover:bg-neutral-100">Temizle</button>}
              </div>
            </fieldset>
            {upcoming && <div className="absolute inset-0 rounded-xl pointer-events-none bg-white/50 backdrop-blur-[1px]" />}
          </form>
        </div>
      )}

  {activeTab === 'kayitlar' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {!selectedRecord && (
            <>
              <h2 className="text-xl font-semibold mb-2">Servis Kayıtları</h2>
              <p className="text-[11px] text-neutral-500 mb-4">Mock veriler - backend entegrasyonu yapılmadı. Bir kayda tıklayarak detay görüntüleyin.</p>
              <input placeholder="Filtrele (ürün / durum)" value={filter} onChange={e=>setFilter(e.target.value)} className="w-full mb-6 px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-brand-orange text-[12px]" />
              <div className="hidden md:grid md:grid-cols-12 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase mb-2">
                <span className="col-span-2">Tarih</span>
                <span className="col-span-4">Ürün</span>
                <span className="col-span-2">Durum</span>
                <span className="col-span-4">Açıklama</span>
              </div>
              <div className="flex flex-col gap-3">
                {filtered.map(r=> (
                  <button type="button" onClick={()=>setSelectedRecord(r)} key={r.id} className="text-left rounded-xl border border-neutral-200 p-4 bg-neutral-50/60 md:grid md:grid-cols-12 flex flex-col gap-2 text-[11px] hover:border-brand-orange/50 hover:bg-orange-50/50 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
                    <span className="col-span-2 font-medium group-hover:text-brand-orange">{r.tarih}</span>
                    <span className="col-span-4 font-medium text-neutral-800 group-hover:text-brand-orange/90">{r.urun}</span>
                    <span className="col-span-2"><span className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold bg-neutral-200 group-hover:bg-brand-orange group-hover:text-white transition">{r.durum}</span></span>
                    <span className="col-span-4 text-neutral-600 leading-relaxed line-clamp-2">{r.aciklama}</span>
                  </button>
                ))}
                {filtered.length===0 && <div className="text-center text-[11px] text-neutral-500 py-4">Kayıt bulunamadı</div>}
              </div>
            </>
          )}

          {selectedRecord && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Servis Detayı</h2>
                  <p className="text-[11px] text-neutral-500">Seçilen kaydın ayrıntıları</p>
                </div>
                <button onClick={()=>setSelectedRecord(null)} className="text-[11px] font-semibold px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 transition">← Kayıtlara Dön</button>
              </div>

              <div className="grid md:grid-cols-4 gap-6 text-[12px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">ÜRÜN</span>
                  <span className="font-medium text-neutral-800">{selectedRecord.urun}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">DURUM</span>
                  <span className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold bg-neutral-200">{selectedRecord.durum}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">TESLİM ALINMA</span>
                  <span>{selectedRecord.teslimAlma || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">TESLİM EDİLME</span>
                  <span>{selectedRecord.teslimEtme || '—'}</span>
                </div>
                {!selectedRecord.teslimEtme && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold tracking-wide text-neutral-500">TAHMİNİ TESLİM</span>
                    <span>{selectedRecord.tahminiTeslim || '—'}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">ÜCRET</span>
                  <span className="font-medium text-neutral-800">{formatCost(selectedRecord.ucret)}</span>
                </div>
                <div className="md:col-span-4 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-500">AÇIKLAMA</span>
                  <p className="text-[12px] leading-relaxed text-neutral-700">{selectedRecord.aciklama || '—'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 text-[12px]">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold tracking-wide">Değişen Parçalar</h3>
                  {selectedRecord.degisenParcalar && selectedRecord.degisenParcalar.length > 0 ? (
                    <ul className="list-disc list-inside text-neutral-700 space-y-1">
                      {selectedRecord.degisenParcalar.map((p,i)=> <li key={i}>{p}</li>)}
                    </ul>
                  ) : <p className="text-[11px] text-neutral-500">Henüz parça değişimi yok</p>}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold tracking-wide">Yapılan İşlemler</h3>
                  {selectedRecord.yapilanIslemler && selectedRecord.yapilanIslemler.length > 0 ? (
                    <ul className="list-disc list-inside text-neutral-700 space-y-1">
                      {selectedRecord.yapilanIslemler.map((p,i)=> <li key={i}>{p}</li>)}
                    </ul>
                  ) : <p className="text-[11px] text-neutral-500">İşlem kaydı yok</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <WhatsAppButton />
    </div>
  );
}
