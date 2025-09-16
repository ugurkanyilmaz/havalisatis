import { Link } from 'react-router-dom';

export default function Admin(){
  const cards = [
    { to:'/admin/urunler', icon:'Ü', title:'Ürün Yönetimi', desc:'Ürün ekleme, düzenleme, stok ve indirimler' },
    { to:'/admin/siparisler', icon:'S', title:'Siparişler', desc:'Aktif & tamamlanan sipariş takibi' },
    { to:'/admin/teknik-servis', icon:'T', title:'Teknik Servis', desc:'Servis kayıtları ve durum yönetimi' },
    { to:'/admin/web-istatistikleri', icon:'İ', title:'Web İstatistikleri', desc:'Trafik, dönüşüm ve özet metrikler' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <span className="text-[11px] px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 font-medium">Mod: Kategori Görünümü</span>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-base group-hover:scale-105 group-hover:bg-brand-orange transition">{c.icon}</div>
              <div>
                <h2 className="text-sm font-semibold tracking-wide group-hover:text-brand-orange transition">{c.title}</h2>
                <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">{c.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 group-hover:text-brand-orange">Görüntüle</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-300 group-hover:text-brand-orange transition" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
