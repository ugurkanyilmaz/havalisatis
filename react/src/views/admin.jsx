// src/views/AdminPanel.jsx
import React, { useEffect, useState } from "react";

const sampleProducts = [
  {
    parent_category: "Havalı El Aletleri",
    child_category: "Havalı Somun Sıkma Sökme",
    sku: "A10-H0303",
    title: "APAC A10-H0303 3/8 HAVALI SOMUN SIKMA SÖKME 105 Nm",
    tags: "popular",
    discount: 10,
    list_price: 100,
    star_rating: 4.2,
    product_description: "Bu profesyonel havalı somun sıkma-sökme makinesi...",
    feature1: "Hava Girişi: 1/4″",
    feature2: "Hava Hortum Çapı: 10 mm",
    feature3: "Hava Basıncı: 6,3 bar",
    feature4: "Ağırlık: 0,55 kg",
    feature5: "Devir: 10.000 d./dk.",
    feature6: "Soket Ölçüsü: 3/8″",
    feature7: "Tork: 105 Nm",
    feature8: null,
    brand: "APAC",
    main_img:
      "https://keten.s3.eu-north-1.amazonaws.com/product_images/A10-H0303.png",
    img1: null,
    img2: null,
    img3: null,
    img4: null,
    meta_title: "APAC A10-H0303 3/8 Havalı Somun Sıkma-Sökme | 105 Nm",
    meta_description:
      "APAC A10-H0303 havalı somun sıkma-sökme, 105 Nm tork ve 10.000 d/dk hızıyla profesyonel işler için ideal.",
    schema_description:
      "APAC A10-H0303 3/8 havalı somun sıkma-sökme, 105 Nm tork gücü ve 10.000 d/dk dönüş hızıyla profesyonel işler için geliştirilmiştir.",
  },
];

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = React.useRef(null);
  const [form, setForm] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  
  // Cache refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    // Check session on mount
    fetch('/api/v2/admin.php?action=check', { credentials: 'include' })
      .then(async (r) => {
        // robust parsing: handle empty responses
        const text = await r.text();
        if (!text) return { success: false };
        try { return JSON.parse(text); } catch { return { success: false }; }
      })
      .then((j) => {
        if (j.success && j.data?.user) setUser(j.data.user);
      })
      .catch(() => {})
      .finally(() => setLoadingAuth(false));
  }, []);

  // Load products when user is authenticated
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
  const res = await fetch('/api/v2/products.php?per_page=200');
        const json = await res.json();
        setProducts(Array.isArray(json.items) ? json.items : []);
      } catch (err) {
        setProducts([]);
      }
    };
    load();
  }, [user]);

  // sync selected -> form
  useEffect(() => {
    if (!selected) { setForm(null); return; }
    // clone selected into editable form state
    const f = { ...selected };
    // ensure features exist
    for (let i = 1; i <= 8; i++) if (!(('feature' + i) in f)) f['feature' + i] = '';
    setForm(f);
  }, [selected]);

  function doLogin(e) {
    e.preventDefault();
    setLoginError(null);
    fetch('/api/v2/admin.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
      credentials: 'include'
    })
      .then(async (r) => {
        const text = await r.text();
        let j = null;
        try { j = text ? JSON.parse(text) : null; } catch (e) { j = { success: false, message: 'Invalid JSON response from server' }; }
        return { ok: r.ok, json: j };
      })
      .then(({ ok, json }) => {
        if (!ok || !json.success) {
          setLoginError(json.message || 'Login failed');
          return;
        }
        setUser(json.data?.user);
        setLoginForm({ username: '', password: '' });
      })
      .catch((err) => setLoginError(String(err)));
  }

  function doLogout() {
    fetch('/api/v2/admin.php?action=logout', { method: 'POST', credentials: 'include' })
      .then(() => setUser(null))
      .catch(() => setUser(null));
  }

  async function refreshHomeCache() {
    setRefreshing(true);
    setRefreshMessage('');
    
    try {
      const response = await fetch('/api/v2/admin.php?action=refresh_home', {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRefreshMessage('✅ Ana sayfa cache güncellendi!');
        setTimeout(() => setRefreshMessage(''), 5000);
      } else {
        setRefreshMessage('❌ Hata: ' + (result.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      setRefreshMessage('❌ Bağlantı hatası: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Upload a single image file to the admin upload endpoint and return URL
  async function uploadImageFile(file) {
    if (!file) throw new Error('No file');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/v2/admin.php?action=upload_image', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Upload failed');
    }
    const j = await res.json();
    if (!j.success || !j.data?.url) throw new Error(j.message || 'Invalid response');
    return j.data.url;
  }

  /**
   * TagsManager component (inline in admin view)
   */
  function TagsManager() {
    const [tags, setTags] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [deleting, setDeleting] = React.useState(null);

    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/v2/tags.php');
        if (r.ok) {
          const j = await r.json();
          setTags(Array.isArray(j) ? j : []);
        } else {
          setTags([]);
        }
      } catch (e) {
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => { load(); }, []);

    const doDelete = async (tagKey) => {
      if (!confirm(`'${tagKey}' etiketini tüm ürünlerden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
      setDeleting(tagKey);
      try {
        const r = await fetch('/api/v2/admin.php?action=delete_tag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: tagKey }), credentials: 'include' });
        const j = await r.json();
        if (!r.ok || !j.success) {
          alert('Silme başarısız: ' + (j.message || JSON.stringify(j)));
        } else {
          alert(`Etiket silindi: ${j.data.deleted_from} ürün güncellendi`);
          // refresh tags and products list (clear and reload)
          load();
        }
      } catch (e) {
        alert('Silme hatası: ' + e.message);
      } finally { setDeleting(null); }
    };

    return (
      <div className="bg-white border rounded p-2">
        {loading ? (
          <div className="text-xs text-neutral-500">Yükleniyor...</div>
        ) : tags.length === 0 ? (
          <div className="text-xs text-neutral-500">Etiket bulunamadı</div>
        ) : (
          <div className="flex flex-col gap-2">
            {tags.map(t => (
              <div key={t.key} className="flex items-center justify-between text-sm">
                <div className="truncate mr-2">{t.label} <span className="text-xs text-gray-400">({t.key})</span></div>
                <div>
                  <button disabled={deleting===t.key} onClick={() => doDelete(t.key)} className="text-xs text-red-600 hover:underline">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If a search term is present, prefer server-side search (debounced).
  // Otherwise show the full loaded product list.
  const filtered = products;

  // Debounced server-side search effect
  useEffect(() => {
    if (!user) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // small debounce to avoid spamming the backend
    searchTimeoutRef.current = setTimeout(async () => {
      const q = (search || '').trim();
      if (q === '') {
        // reload full list (light-weight; server returns paginated list but we request many)
        try {
          setSearching(true);
          const res = await fetch('/api/v2/products.php?per_page=200', { credentials: 'include' });
          if (res.ok) {
            const j = await res.json();
            setProducts(Array.isArray(j.items) ? j.items : []);
          }
        } catch (e) {
          // ignore
        } finally {
          setSearching(false);
        }
        return;
      }

      try {
        setSearching(true);
        // server-side search: query by q, get up to 200 results for admin list
        const res = await fetch(`/api/v2/products.php?q=${encodeURIComponent(q)}&per_page=200`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          setProducts(Array.isArray(j.items) ? j.items : []);
        } else {
          // if server error, keep local list
        }
      } catch (err) {
        // network or parse error - ignore and keep current list
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search, user]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">Checking session…</div>
    );
  }

  if (!user) {
    // When not authenticated, render only the login form (no sidebar/admin controls)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Girişi</h2>
          {loginError && <div className="text-red-600 mb-2">{loginError}</div>}
          <form onSubmit={doLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Kullanıcı Adı</label>
              <input
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Şifre</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Giriş</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-1/3 lg:w-1/4 bg-white border-r p-4 flex flex-col">
        <div className="mb-4 space-y-3">
          <div className="text-sm">Giriş yapan: <strong>{user.username}</strong></div>
          <button onClick={doLogout} className="mt-2 px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition">Çıkış</button>
          
          {/* Cache Refresh Button */}
          <div className="pt-3 border-t border-gray-200">
            <button 
              onClick={refreshHomeCache} 
              disabled={refreshing}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yenileniyor...
                </>
              ) : (
                <>🔄 Ana Sayfa Cache Yenile</>
              )}
            </button>
            {refreshMessage && (
              <div className={`mt-2 text-xs p-2 rounded ${refreshMessage.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {refreshMessage}
              </div>
            )}
            {/* Export buttons (JSON / CSV) */}
            <div className="mt-3 flex gap-2">
              <button className="px-2 py-1 bg-green-600 text-white rounded text-sm" onClick={async () => {
                try {
                  const res = await fetch('/api/v2/admin.php?action=export_products&format=json', { credentials: 'include' });
                  if (!res.ok) { const t = await res.text(); alert('Export failed: ' + t); return; }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'products-export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                } catch (e) { alert('Export error: ' + e.message); }
              }}>JSON İndir</button>
              <button className="px-2 py-1 bg-green-700 text-white rounded text-sm" onClick={async () => {
                try {
                  const res = await fetch('/api/v2/admin.php?action=export_products&format=csv', { credentials: 'include' });
                  if (!res.ok) { const t = await res.text(); alert('Export failed: ' + t); return; }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'products-export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                } catch (e) { alert('Export error: ' + e.message); }
              }}>CSV İndir</button>
            </div>
            {/* Google Feed generator */}
            <div className="mt-3">
              <button
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition"
                onClick={async () => {
                  if (!confirm('Google feed oluşturulsun mu? Varolan feed üzerine yazılacaktır.')) return;
                  try {
                    const res = await fetch('/api/v2/admin.php?action=generate_feed', { method: 'POST', credentials: 'include' });
                    const j = await res.json();
                    if (!res.ok || !j.success) {
                      alert('Feed oluşturulamadı: ' + (j.message || JSON.stringify(j)));
                      return;
                    }
                    alert('Feed oluşturuldu: ' + (j.data?.path || '') + '\nÜrün sayısı: ' + (j.data?.count ?? 0));
                  } catch (err) {
                    alert('Feed oluşturma hatası: ' + err.message);
                  }
                }}
              >
                🟣 Google Feed Oluştur
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ürünler</h2>
          <button
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
            onClick={() => setSelected({})}
          >
            + Ekle
          </button>
        </div>
        {/* Tags management - fetch from public tags endpoint and allow admin to delete unused tags */}
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">Etiketler (Yönetim)</div>
          <TagsManager />
        </div>
        {/* Categories management */}
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">Kategoriler (Yönetim)</div>
          <CategoriesManager />
        </div>
        <input
          type="text"
          placeholder="Ara (SKU / Başlık)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm mb-4"
        />
        <ul className="space-y-2 overflow-y-auto">
          {filtered.map((p) => (
            <li
              key={p.sku}
              className={`p-2 border rounded cursor-pointer ${
                selected?.sku === p.sku ? "bg-blue-50 border-blue-400" : ""
              }`}
              onClick={async () => {
                // Fetch full product details by SKU so admin form receives all fields
                try {
                  const r = await fetch(`/api/v2/products.php?sku=${encodeURIComponent(p.sku)}`, { credentials: 'include' });
                  if (r.ok) {
                    const j = await r.json();
                    if (j && j.product) setSelected(j.product);
                    else setSelected(p);
                  } else {
                    // fallback to minimal object
                    setSelected(p);
                  }
                } catch (err) {
                  setSelected(p);
                }
              }}
            >
              <div className="font-medium line-clamp-1">{p.title}</div>
              <div className="text-xs text-gray-500">{p.sku}</div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Form */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Bulk upload area */}
        <div className="max-w-4xl mx-auto bg-white border rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Toplu Ürün Yükleme</h3>
          <p className="text-sm text-neutral-600 mb-3">JSON dosyası yükle (array of product objects). Yetkili giriş yapmadan bu istek reddedilir.</p>
          <div className="flex gap-2 items-center">
            <input type="file" id="bulkFile" accept="application/json" className="" />
            <button id="bulkUploadBtn" className="px-3 py-2 bg-brand-orange text-white rounded" onClick={async () => {
              const input = document.getElementById('bulkFile');
              if (!input || !input.files || input.files.length === 0) { alert('Lütfen bir JSON dosyası seçin'); return; }
              const file = input.files[0];
              const fd = new FormData(); fd.append('file', file);
              try {
                const res = await fetch('/api/v2/admin.php?action=bulk_upload', { method: 'POST', body: fd, credentials: 'include' });
                const json = await res.json();
                if (!json.success) { alert('Hata: ' + (json.message || JSON.stringify(json))); return; }
                alert('Yüklendi: inserted=' + json.data.inserted + ', updated=' + json.data.updated + ', errors=' + (json.data.errors?.length || 0));
              } catch (err) { alert('Upload failed: ' + err); }
            }}>Yükle</button>
          </div>
        </div>
        {selected ? (
          <div className="max-w-4xl mx-auto bg-white border rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selected.sku ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h2>
            <h2 className="text-xl font-semibold mb-4">
              {selected.sku ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h2>

            <form className="grid grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault();
                // Save handler
                if (!form) return; 
                try {
                  const payload = [form];
                  const res = await fetch('/api/v2/admin.php?action=bulk_upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
                    const j = await res.json();
                  if (!j.success) { alert('Kaydetme hatası: ' + (j.message || JSON.stringify(j))); return; }
                  alert('Kaydedildi. inserted=' + j.data.inserted + ', updated=' + j.data.updated);
                  // reload products
                  const r2 = await fetch('/api/v2/products.php?per_page=200'); const j2 = await r2.json(); setProducts(Array.isArray(j2.items)? j2.items: []);
                } catch (err) { alert('Kaydetme hatası: ' + err); }
              }}>
              {/* Kategoriler */}
              <div className="col-span-1">
                <label className="block text-sm font-medium">
                  Parent Category
                </label>
                <input
                  type="text"
                  value={form?.parent_category || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, parent_category: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium">
                  Child Category
                </label>
                <input
                  type="text"
                  value={form?.child_category || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, child_category: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* SKU, Title */}
              <div className="col-span-1">
                <label className="block text-sm font-medium">SKU</label>
                <input
                  type="text"
                  value={form?.sku || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium">Başlık</label>
                <input
                  type="text"
                  value={form?.title || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Tags */}
              <div className="col-span-2">
                <label className="block text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={form?.tags || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Prices & Rating */}
              <div>
                <label className="block text-sm font-medium">List Price</label>
                <input
                  type="number"
                  value={form?.list_price ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, list_price: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Discount %</label>
                <input
                  type="number"
                  value={form?.discount ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Star Rating</label>
                <input
                  type="number"
                  step="0.1"
                  value={form?.star_rating ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, star_rating: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Brand</label>
                <input
                  type="text"
                  value={form?.brand || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium">
                  Ürün Açıklaması
                </label>
                <textarea
                  rows="4"
                  value={form?.product_description || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, product_description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Features */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="col-span-1">
                  <label className="block text-sm font-medium">
                    Feature {i + 1}
                  </label>
                  <input
                    type="text"
                    value={form?.[`feature${i + 1}`] || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, [`feature${i + 1}`]: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}

              {/* Images */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {['main_img','img1','img2','img3','img4'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium">{field}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form?.[field] || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                      />
                      <div className="flex flex-col gap-1">
                        <input type="file" accept="image/*" id={`file_${field}`} className="text-xs" />
                        <button type="button" className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={async () => {
                          const input = document.getElementById(`file_${field}`);
                          if (!input || !input.files || input.files.length === 0) { alert('Lütfen bir dosya seçin'); return; }
                          const file = input.files[0];
                          try {
                            // send existing URL so backend can overwrite
                            const fd = new FormData(); fd.append('file', file);
                            const existing = form?.[field] || '';
                            if (existing) fd.append('existing', existing);
                            const res = await fetch('/api/v2/admin.php?action=upload_image', { method: 'POST', body: fd, credentials: 'include' });
                            if (!res.ok) { const t = await res.text(); throw new Error(t || 'Upload failed'); }
                            const j = await res.json();
                            if (!j.success || !j.data?.url) throw new Error(j.message || 'Invalid response');
                            const url = j.data.url;
                            setForm(prev => ({ ...prev, [field]: url }));
                            alert('Yüklendi: ' + url);
                          } catch (err) { alert('Upload failed: ' + err.message); }
                        }}>Yükle</button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Örn: https://... veya yükleyin</div>
                  </div>
                ))}
              </div>

              {/* Meta fields */}
              <div className="col-span-2">
                <label className="block text-sm font-medium">Meta Title</label>
                <input
                  type="text"
                  value={form?.meta_title || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Meta Keywords</label>
                <input
                  type="text"
                  value={form?.meta_keywords || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="örn: vidalar, somun, havalı alet"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">
                  Meta Description
                </label>
                <textarea
                  rows="2"
                  value={form?.meta_description || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">
                  Schema Description
                </label>
                <textarea
                  rows="3"
                  value={form?.schema_description || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, schema_description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-between pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-500 text-white rounded"
                    onClick={async () => {
                      if (!form?.sku) { alert('SKU yok'); return; }
                      if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
                      try {
                        const res = await fetch('/api/v2/products.php?action=delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku: form.sku }), credentials: 'include' });
                        const j = await res.json();
                        if (!j.success) { alert('Silme hatası: ' + (j.message || JSON.stringify(j))); return; }
                        alert('Silindi');
                        // reload products and clear selection
                        const r2 = await fetch('/api/v2/products.php?per_page=200'); const j2 = await r2.json(); setProducts(Array.isArray(j2.items)? j2.items: []);
                        setSelected(null); setForm(null);
                      } catch (err) { alert('Silme hatası: ' + err); }
                    }}
                  >
                    Sil
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-20">
            Ürün seçin veya yeni ekleyin
          </div>
        )}
      </main>
    </div>
  );
}

function CategoriesManager() {
  const [cats, setCats] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v2/categories.php');
      if (r.ok) {
        const j = await r.json();
        // backend returns array of { parent_category, child_category, cnt }
        setCats(Array.isArray(j) ? j : []);
      } else setCats([]);
    } catch (e) { setCats([]); }
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const doDelete = async (type, name) => {
    if (!confirm(`'${name}' kategorisini (${type}) tüm ürünlerden silmek istediğinize emin misiniz?`)) return;
    setDeleting(name);
    try {
      const r = await fetch('/api/v2/admin.php?action=delete_category', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, name }), credentials: 'include' });
      const j = await r.json();
      if (!r.ok || !j.success) {
        alert('Silme başarısız: ' + (j.message || JSON.stringify(j)));
      } else {
        alert(`Kategori silindi: ${j.data.deleted_from} ürün güncellendi`);
        load();
      }
    } catch (e) { alert('Silme hatası: ' + e.message); }
    finally { setDeleting(null); }
  };

  return (
    <div className="bg-white border rounded p-2">
      {loading ? (
        <div className="text-xs text-neutral-500">Yükleniyor...</div>
      ) : cats.length === 0 ? (
        <div className="text-xs text-neutral-500">Kategori bulunamadı</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-auto">
          {cats.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="truncate mr-2">
                <div className="font-medium">{c.parent_category || '(Boş)'}</div>
                <div className="text-xs text-gray-500">{c.child_category || '(Boş)'} — {c.cnt} ürün</div>
              </div>
              <div className="flex gap-2">
                <button disabled={deleting===c.parent_category} onClick={() => doDelete('parent', c.parent_category)} className="text-xs text-red-600 hover:underline">Sil Parent</button>
                <button disabled={deleting===c.child_category} onClick={() => doDelete('child', c.child_category)} className="text-xs text-red-600 hover:underline">Sil Child</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
