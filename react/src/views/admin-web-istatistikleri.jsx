import { useEffect, useState } from 'react';

// Çok basit mock metrikler
const INITIAL = {
  visitorsToday: 128,
  visitorsMonth: 3421,
  conversionRate: 3.4,
  avgOrderValue: 742.5,
  bounceRate: 41.2,
  topProducts: [
    { name:'Endüstriyel Fan', views:420 },
    { name:'Filtre Ünitesi', views:310 },
    { name:'Havalandırma Motoru', views:255 },
  ]
};

export default function AdminWebIstatistikleri(){
  const [metrics, setMetrics] = useState(INITIAL);

  // Örnek: her 10sn'de değişen sahte trafik artışı
  useEffect(()=>{
    const id = setInterval(()=>{
      setMetrics(m=>({
        ...m,
        visitorsToday: m.visitorsToday + Math.floor(Math.random()*3),
        visitorsMonth: m.visitorsMonth + Math.floor(Math.random()*5),
      }));
    }, 10000);
    return ()=>clearInterval(id);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Web İstatistikleri</h1>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Metric label="Bugünkü Ziyaretçi" value={metrics.visitorsToday} />
        <Metric label="Aylık Ziyaretçi" value={metrics.visitorsMonth} />
        <Metric label="Dönüşüm Oranı" value={metrics.conversionRate + '%'} />
        <Metric label="Ortalama Sipariş" value={metrics.avgOrderValue.toFixed(2) + '₺'} />
        <Metric label="Bounce Rate" value={metrics.bounceRate + '%'} />
        <div className="sm:col-span-2 lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-semibold tracking-wide">En Çok Görüntülenen Ürünler</h2>
          <div className="flex flex-col gap-2 text-[11px]">
            {metrics.topProducts.map(p=>(
              <div key={p.name} className="flex items-center justify-between">
                <span className="text-neutral-600">{p.name}</span>
                <span className="font-medium">{p.views}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Mock veriler • Gerçek analitik bağlı değil</div>
    </div>
  );
}

function Metric({ label, value }){
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <span className="text-[11px] text-neutral-500 tracking-wide">{label}</span>
      <span className="text-lg font-semibold text-neutral-800">{value}</span>
      <div className="h-1 rounded bg-gradient-to-r from-brand-orange to-orange-400 w-full" />
    </div>
  );
}
