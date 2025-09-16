import { useState } from 'react';

export default function AdminTeknikServis(){
  const [records, setRecords] = useState([
    { id:501, product:'Endüstriyel Fan', status:'bekliyor', note:'Titreşim şikayeti', created_at:'2025-09-10' },
    { id:502, product:'Filtre Ünitesi', status:'işlemde', note:'Filtre değişimi', created_at:'2025-09-09' },
  ]);
  const statuses = ['bekliyor','işlemde','tamamlandı'];

  const updateStatus = (id, status)=> setRecords(list=>list.map(r=>r.id===id?{...r,status}:r));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Teknik Servis</h1>
      </div>
      <div className="grid gap-4">
        {records.map(r=>(
          <div key={r.id} className="border rounded-lg bg-white p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-700">#{r.id} • {r.product}</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">{r.created_at}</span>
            </div>
            <p className="text-[11px] text-neutral-600">{r.note}</p>
            <div className="flex items-center gap-2">
              {statuses.map(s=> <button key={s} onClick={()=>updateStatus(r.id,s)} className={`px-2 py-1 rounded text-[10px] border ${r.status===s? 'bg-neutral-900 text-white border-neutral-900':'border-neutral-300 hover:bg-neutral-100'}`}>{s}</button>)}
            </div>
          </div>
        ))}
        {!records.length && <div className="text-center text-neutral-500 text-sm py-10">Kayıt yok</div>}
      </div>
    </div>
  );
}
