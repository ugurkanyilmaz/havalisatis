import { useState } from 'react';

export default function AdminSiparisler(){
  const [tab, setTab] = useState('active');
  const [active, setActive] = useState([
    { id:101, status:'active', total_amount:17600, items:[{product_id:1, quantity:1},{product_id:3, quantity:2}] },
    { id:102, status:'active', total_amount:8400, items:[{product_id:2, quantity:1}] },
  ]);
  const [completed, setCompleted] = useState([
    { id:90, status:'completed', total_amount:12000, items:[{product_id:1, quantity:1}] }
  ]);

  const finish = id => {
    setActive(list=>{
      const found = list.find(o=>o.id===id);
      if(!found) return list;
      setCompleted(c=>[{...found, status:'completed'}, ...c]);
      return list.filter(o=>o.id!==id);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Siparişler</h1>
        <div className="flex gap-2 text-[12px]">
          <button onClick={()=>setTab('active')} className={`px-4 py-1.5 rounded-full border ${tab==='active'?'bg-sky-600 text-white border-sky-600':'border-neutral-300 hover:bg-neutral-100'}`}>Aktif ({active.length})</button>
          <button onClick={()=>setTab('completed')} className={`px-4 py-1.5 rounded-full border ${tab==='completed'?'bg-emerald-600 text-white border-emerald-600':'border-neutral-300 hover:bg-neutral-100'}`}>Tamamlanan ({completed.length})</button>
        </div>
      </div>
      <div className="grid gap-4">
        {(tab==='active'? active: completed).map(o=>
          <div key={o.id} className="border rounded-lg bg-white shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-700">Sipariş #{o.id}</span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{o.status}</span>
            </div>
            <div className="text-[11px] text-neutral-600">Toplam: {o.total_amount.toFixed(2)}₺ • Ürün Adedi: {o.items.length}</div>
            <div className="flex flex-wrap gap-1">
              {o.items.map(it => <span key={it.product_id} className="px-2 py-0.5 bg-neutral-100 rounded text-[10px]">#{it.product_id} x{it.quantity}</span>)}
            </div>
            {tab==='active' && <button onClick={()=>finish(o.id)} className="self-end mt-1 px-3 py-1 rounded bg-emerald-600 text-white text-[11px] hover:bg-emerald-500">Teslim Edildi</button>}
          </div>
        )}
        {!(tab==='active'? active: completed).length && <div className="text-center text-neutral-500 text-sm py-10">Kayıt yok</div>}
      </div>
    </div>
  );
}
