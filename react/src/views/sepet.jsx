import { useCart } from '../context/CartContext.jsx';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

// Checkout Modal Component
function CheckoutModal({ isOpen, onClose, cartItems, total }) {
  const [step, setStep] = useState(1); // 1: Özet, 2: Bilgiler, 3: Ödeme
  const [formData, setFormData] = useState({
    // Kişisel Bilgiler
    fullName: '',
    email: '',
    phone: '',
    // Adres Bilgileri
    address: '',
    city: '',
    district: '',
    postalCode: '',
    // Ödeme Bilgileri (Mock)
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Mock ödeme işlemi
    alert('Ödeme işlemi başarılı! (Mock)');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {step === 1 && 'Sipariş Özeti'}
            {step === 2 && 'Teslimat & İletişim Bilgileri'}
            {step === 3 && 'Ödeme Bilgileri'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Sipariş Özeti */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs text-neutral-400">Resim</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-neutral-600">Adet: {item.qty}</div>
                    </div>
                    <div className="text-sm font-bold">
                      ₺{(Number(item.price) * item.qty).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Toplam:</span>
                  <span>₺{total.toLocaleString('tr-TR')}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-brand-orange text-white font-semibold py-3 rounded-lg hover:bg-orange-500 transition"
              >
                Devam Et
              </button>
            </div>
          )}

          {/* Step 2: Kişisel & Adres Bilgileri */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="E-posta"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none md:col-span-2"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Teslimat Adresi</h3>
                <div className="space-y-4">
                  <textarea
                    placeholder="Adres"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none h-20 resize-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="İl"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="İlçe"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Posta Kodu"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 border border-neutral-300 text-neutral-700 font-semibold py-3 rounded-lg hover:bg-neutral-100 transition"
                >
                  Geri
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 bg-brand-orange text-white font-semibold py-3 rounded-lg hover:bg-orange-500 transition"
                >
                  Ödemeye Geç
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ödeme Bilgileri */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Kart Bilgileri</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Kart Üzerindeki İsim"
                    value={formData.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Kart Numarası (1234 5678 9012 3456)"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Ürünler:</span>
                  <span className="text-sm font-semibold">₺{total.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Kargo:</span>
                  <span className="text-sm font-semibold text-green-600">Ücretsiz</span>
                </div>
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Toplam:</span>
                    <span className="font-bold text-lg">₺{total.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 border border-neutral-300 text-neutral-700 font-semibold py-3 rounded-lg hover:bg-neutral-100 transition"
                >
                  Geri
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Ödemeyi Tamamla
                </button>
              </div>

              <div className="text-xs text-neutral-500 text-center">
                🔒 Bu bir demo uygulamasıdır. Gerçek ödeme yapılmayacaktır.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sepet(){
  const { items, updateQty, removeItem, clearCart, subtotal, total, count } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alışveriş Sepeti</h1>
        <NavLink to="/urunler" className="text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100">Alışverişe Devam Et</NavLink>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl text-neutral-600">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
          </div>
          <p className="mb-3 text-lg">Sepetiniz boş.</p>
          <p className="mb-4 text-sm text-neutral-500">Harika ürünlerimizi keşfetmek için alışverişe başlayın!</p>
          <NavLink 
            to="/urunler" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand-orange px-6 py-3 rounded-lg hover:bg-orange-500 transition"
          >
            Ürünlere Göz At
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NavLink>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl hover:shadow-sm transition">
                <div className="h-16 w-24 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-neutral-400">Resim</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{item.name}</div>
                  <div className="text-xs text-neutral-600">Birim Fiyat: ₺{Number(item.price).toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-neutral-500 mt-1">ID: {item.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-lg">
                    <button 
                      onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-l-lg"
                    >
                      −
                    </button>
                    <input 
                      type="number" 
                      min={1} 
                      max={99} 
                      value={item.qty} 
                      onChange={e => updateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-0 py-1.5 text-sm focus:ring-0" 
                    />
                    <button 
                      onClick={() => updateQty(item.id, Math.min(99, item.qty + 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-r-lg"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-bold min-w-[80px] text-right">
                    ₺{(Number(item.price) * item.qty).toLocaleString('tr-TR')}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5 h-fit sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Sipariş Özeti</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span>Ürün Adedi:</span>
                <span className="font-semibold">{count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Ara Toplam:</span>
                <span className="font-semibold">₺{subtotal.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Kargo:</span>
                <span className="font-semibold text-green-600">Ücretsiz</span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Toplam:</span>
                  <span className="font-bold text-xl text-brand-orange">₺{total.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full rounded-lg bg-brand-orange text-white text-sm font-semibold py-3 hover:bg-orange-500 transition shadow-sm"
              >
                Satın Al
              </button>
              <button 
                onClick={clearCart} 
                className="w-full rounded-lg border border-neutral-300 text-sm font-semibold py-2 hover:bg-neutral-100 transition"
              >
                Sepeti Temizle
              </button>
            </div>
            
            <div className="mt-6 p-3 bg-neutral-50 rounded-lg">
              <div className="text-xs text-neutral-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Güvenli ödeme
              </div>
              <div className="text-xs text-neutral-600 flex items-center gap-2 mt-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
                Ücretsiz kargo
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={items}
        total={total}
      />
    </div>
  );
}
