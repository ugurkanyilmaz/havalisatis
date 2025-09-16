// Placeholder servis kayıtları listesi backend bağlanınca API'den gelecek.
import { useState } from 'react';

const MOCK = [
  { id: 1, urun: 'Darbeli Somun Sıkma X120', durum: 'Tamamlandı', tarih: '2025-08-12', aciklama: 'Bakım ve yağ değişimi yapıldı.' },
  { id: 2, urun: 'Pnömatik Matkap M45', durum: 'Beklemede', tarih: '2025-09-01', aciklama: 'Yedek parça bekleniyor.' },
  { id: 3, urun: 'Zımpara Aleti S300', durum: 'Serviste', tarih: '2025-09-05', aciklama: 'Rotor balans kontrolü.' }
];

export default function ServiceRecords(){
  const [filter, setFilter] = useState('');
  const filtered = MOCK.filter(r=> r.urun.toLowerCase().includes(filter.toLowerCase()) || r.durum.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="card-like">
      <h2>Servis Kayıtları</h2>
      <p className="muted">Geçmiş ve aktif teknik servis işlemleriniz. (Mock veriler)</p>
      <input className="filter" placeholder="Filtrele (ürün / durum)" value={filter} onChange={e=>setFilter(e.target.value)} />
      <div className="records-table">
        <div className="thead">
          <span>Tarih</span><span>Ürün</span><span>Durum</span><span>Detay</span>
        </div>
        {filtered.map(r=> (
          <div key={r.id} className="row">
            <span>{r.tarih}</span>
            <span>{r.urun}</span>
            <span><span className={"status "+r.durum.toLowerCase()}>{r.durum}</span></span>
            <span className="desc">{r.aciklama}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">Kayıt bulunamadı</div>}
      </div>
    </div>
  );
}
