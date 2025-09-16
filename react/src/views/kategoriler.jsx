import { NavLink } from 'react-router-dom';

export default function Kategoriler(){
  // Basit bir placeholder sayfa; backend kategorileri hazır olduğunda API'den listeleyebiliriz
  const demo = [
    { id: 1, name: 'Kategori A', path: 'Kategori A' },
    { id: 2, name: 'Kategori B', path: 'Kategori B' },
    { id: 3, name: 'Kategori C', path: 'Kategori C' },
  ];
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kategoriler</h1>
        <NavLink to="/urunler" className="text-sm font-semibold text-brand-orange hover:underline">Ürünlere Dön</NavLink>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {demo.map(c => (
          <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-5 hover:shadow transition">
            <div className="font-semibold mb-2">{c.name}</div>
            <div className="text-xs text-neutral-500">{c.path}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
