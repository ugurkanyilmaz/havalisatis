import { useEffect, useMemo, useState } from 'react';
import { fetchProducts, updateProduct, deleteProduct } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Ürün yönetimi (backend'e bağlı) — indirim yüzdesi düzenleme ekli
export default function AdminUrunler(){
  const { isAdmin, accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState({}); // { [id]: { discount_percent: string } }
  const [saving, setSaving] = useState({}); // { [id]: boolean }

  const load = async () => {
    try {
      setLoading(true); setError('');
      const list = await fetchProducts(undefined, { skip:0, limit:100 });
      setItems(Array.isArray(list) ? list : []);
      setEdits({});
    } catch(e){ setError(e?.message || 'Ürünler yüklenemedi'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const calcNet = (p) => {
    const disc = p.discount_percent ?? null;
    if (disc === null || disc === undefined || Number.isNaN(Number(disc))) return null;
    const price = Number(p.price) || 0;
    return Math.round(price * (1 - Number(disc)/100) * 100) / 100;
  };

  const onEditChange = (id, val) => {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id]||{}), discount_percent: val } }));
  };

  const onSave = async (p) => {
    const row = edits[p.id] || {};
    const raw = row.discount_percent ?? '';
    const v = String(raw).trim();
    const payload = { };
    if (v === '') payload.discount_percent = null; else payload.discount_percent = Number(v);
    if (payload.discount_percent !== null && (payload.discount_percent < 0 || payload.discount_percent > 100 || Number.isNaN(payload.discount_percent))) {
      alert('İndirim % 0 ile 100 arasında olmalı');
      return;
    }
    try {
      setSaving(s => ({ ...s, [p.id]: true }));
      await updateProduct(accessToken, p.id, payload);
      await load();
    } catch (e){
      alert(e?.message || 'Kaydetme başarısız');
    } finally {
      setSaving(s => ({ ...s, [p.id]: false }));
    }
  };

  const onDelete = async (p) => {
    if(!isAdmin || !accessToken){ alert('Yetki gerekli'); return; }
    if(!confirm(`Silinsin mi? (SKU: ${p.sku})`)) return;
    try {
      await deleteProduct(accessToken, p.id);
      await load();
    } catch(e){ alert(e?.message || 'Silme başarısız'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Ürün Yönetimi</h1>
          {!isAdmin && (
            <span className="text-[11px] px-2 py-1 rounded bg-yellow-100 text-yellow-800">Sadece görüntüleme — giriş yapıp admin olun</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <button onClick={load} className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100">Yenile</button>
        </div>
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="overflow-auto bg-white border border-neutral-200 rounded-xl shadow-sm">
        <table className="min-w-full text-[12px]">
          <thead>
            <tr className="text-left text-neutral-600 border-b">
              <th className="py-2 px-3">SKU</th>
              <th className="py-2 px-3">Başlık</th>
              <th className="py-2 px-3">Fiyat</th>
              <th className="py-2 px-3">İndirim %</th>
              <th className="py-2 px-3">Net</th>
              <th className="py-2 px-3">Stok</th>
              <th className="py-2 px-3 w-40">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="py-6 px-3 text-neutral-500" colSpan={7}>Yükleniyor…</td></tr>
            )}
            {!loading && items.map(p=>{
              const net = calcNet(p);
              const row = edits[p.id] || {};
              const current = (row.discount_percent ?? (p.discount_percent ?? ''));
              const changed = String(current) !== String(p.discount_percent ?? '');
              return (
                <tr key={p.id} className="border-b last:border-none">
                  <td className="py-2 px-3 text-neutral-500">{p.sku}</td>
                  <td className="py-2 px-3 font-medium text-neutral-800">{p.title || p.sku}</td>
                  <td className="py-2 px-3">{(Number(p.price)||0).toFixed(2)}₺</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={current}
                        onChange={e=>onEditChange(p.id, e.target.value)}
                        placeholder="%"
                        className="w-20 px-2 py-1 rounded border border-neutral-300"
                        disabled={!isAdmin}
                      />
                      {changed && isAdmin && (
                        <button onClick={()=>onSave(p)} disabled={!!saving[p.id] || !accessToken}
                          className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                          {saving[p.id] ? 'Kaydediliyor…' : 'Kaydet'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">{net !== null ? <span className="text-emerald-600 font-semibold">{net.toFixed(2)}₺</span> : '-'}</td>
                  <td className="py-2 px-3">{p.stock ?? '-'}</td>
                  <td className="py-2 px-3 flex gap-1">
                    <button onClick={()=>onSave(p)} disabled={!isAdmin || !!saving[p.id] || !changed || !accessToken} className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50">Güncelle</button>
                    <button onClick={()=>onDelete(p)} disabled={!isAdmin || !accessToken} className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">Sil</button>
                  </td>
                </tr>
              );
            })}
            {!loading && !items.length && (
              <tr><td colSpan={7} className="py-6 text-center text-neutral-500">Kayıt yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
