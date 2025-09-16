import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);
const STORAGE_KEY = 'cart:v1';

export function CartProvider({ children }){
  const [items, setItems] = useState(()=>{
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(()=>{
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const addItem = (item, qty = 1) => {
    if(!item || !item.id) return;
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === item.id);
      if(idx > -1){
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min(99, (copy[idx].qty || 0) + qty) };
        return copy;
      }
      return [...prev, { id: item.id, name: item.name || 'Ürün', price: Number(item.price)||0, qty: Math.max(1, qty), image: item.image||null }];
    });
  };

  const updateQty = (id, qty) => {
    setItems(prev => {
      const q = Math.max(0, Math.min(99, Number(qty)||0));
      if(q === 0) return prev.filter(p => p.id !== id);
      return prev.map(p => p.id === id ? { ...p, qty: q } : p);
    });
  };

  const removeItem = (id) => setItems(prev => prev.filter(p => p.id !== id));
  const clearCart = () => setItems([]);

  const summary = useMemo(()=>{
    const count = items.reduce((s,i)=> s + (i.qty||0), 0);
    const subtotal = items.reduce((s,i)=> s + (i.price||0) * (i.qty||0), 0);
    const total = subtotal; // taxes/shipping not modeled
    return { count, subtotal, total };
  }, [items]);

  const value = { items, addItem, updateQty, removeItem, clearCart, ...summary };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(){
  const ctx = useContext(CartCtx);
  if(!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartCtx;
