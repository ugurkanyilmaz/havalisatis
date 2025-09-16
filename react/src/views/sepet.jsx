import { useCart } from '../context/CartContext.jsx';
import { NavLink } from 'react-router-dom';

export default function Sepet(){
  const { items, updateQty, removeItem, clearCart, subtotal, total, count } = useCart();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alışveriş Sepeti</h1>
        <NavLink to="/urunler" className="text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100">Alışverişe Devam Et</NavLink>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl text-neutral-600">
          <p className="mb-3">Sepetiniz boş.</p>
          <NavLink to="/urunler" className="text-sm font-semibold text-brand-orange">Ürünlere göz atın →</NavLink>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl">
                <div className="h-16 w-24 rounded-lg bg-neutral-100" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-[12px] text-neutral-600">₺ {Number(item.price).toLocaleString('tr-TR')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={99} value={item.qty} onChange={e=>updateQty(item.id, e.target.value)} className="w-16 text-center border border-neutral-300 rounded-lg py-1 text-sm" />
                  <button onClick={()=>removeItem(item.id)} className="text-xs px-3 py-1 rounded-md border border-neutral-300 hover:bg-neutral-100">Kaldır</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5 h-fit sticky top-24">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Ürün Adedi</span>
              <span className="font-semibold">{count}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Ara Toplam</span>
              <span className="font-semibold">₺ {subtotal.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <span>Toplam</span>
              <span className="font-bold">₺ {total.toLocaleString('tr-TR')}</span>
            </div>
            <button className="w-full rounded-lg bg-brand-orange text-white text-sm font-semibold py-2 mb-2">Satın Al (Mock)</button>
            <button onClick={clearCart} className="w-full rounded-lg border border-neutral-300 text-sm font-semibold py-2 hover:bg-neutral-100">Sepeti Temizle</button>
          </div>
        </div>
      )}
    </div>
  );
}
