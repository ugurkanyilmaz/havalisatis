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
  const [form, setForm] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  useEffect(() => {
    // Check session on mount
    fetch('/api/admin_check.php', { credentials: 'include' })
      .then(async (r) => {
        // robust parsing: handle empty responses
        const text = await r.text();
        if (!text) return { logged_in: false };
        try { return JSON.parse(text); } catch { return { logged_in: false }; }
      })
      .then((j) => {
        if (j.logged_in) setUser(j.user);
      })
      .catch(() => {})
      .finally(() => setLoadingAuth(false));
  }, []);

  // Load products when user is authenticated
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
  const res = await fetch('/api/products.php?per_page=200');
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
    fetch('/api/admin_login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
      credentials: 'include'
    })
      .then(async (r) => {
        const text = await r.text();
        let j = null;
        try { j = text ? JSON.parse(text) : null; } catch (e) { j = { error: 'Invalid JSON response from server' }; }
        return { ok: r.ok, json: j };
      })
      .then(({ ok, json }) => {
        if (!ok) {
          setLoginError(json.error || 'Login failed');
          return;
        }
        setUser(json.user);
        setLoginForm({ username: '', password: '' });
      })
      .catch((err) => setLoginError(String(err)));
  }

  function doLogout() {
    fetch('/api/admin_logout.php', { credentials: 'include' })
      .then(() => setUser(null))
      .catch(() => setUser(null));
  }

  const filtered = products.filter(
    (p) =>
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="mb-4">
          <div className="text-sm">Giriş yapan: <strong>{user.username}</strong></div>
          <button onClick={doLogout} className="mt-2 px-2 py-1 bg-gray-200 rounded text-sm">Çıkış</button>
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
                  const r = await fetch(`/api/products.php?sku=${encodeURIComponent(p.sku)}`, { credentials: 'include' });
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
                const res = await fetch('/api/upload.php', { method: 'POST', body: fd, credentials: 'include' });
                const json = await res.json();
                if (!res.ok) { alert('Hata: ' + (json.error || JSON.stringify(json))); return; }
                alert('Yüklendi: inserted=' + json.inserted + ', updated=' + json.updated + ', errors=' + (json.errors?.length || 0));
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
                  const res = await fetch('/api/upload.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
                    const j = await res.json();
                  if (!res.ok) { alert('Kaydetme hatası: ' + (j.error || JSON.stringify(j))); return; }
                  alert('Kaydedildi. inserted=' + j.inserted + ', updated=' + j.updated);
                  // reload products
                  const r2 = await fetch('/api/products.php?per_page=200'); const j2 = await r2.json(); setProducts(Array.isArray(j2.items)? j2.items: []);
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
                {["main_img", "img1", "img2", "img3", "img4"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium">{field}</label>
                    <input
                      type="text"
                      value={form?.[field] || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
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
                        const res = await fetch('/api/product_delete.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku: form.sku }), credentials: 'include' });
                        const j = await res.json();
                        if (!res.ok) { alert('Silme hatası: ' + (j.error || JSON.stringify(j))); return; }
                        alert('Silindi');
                        // reload products and clear selection
                        const r2 = await fetch('/api/products.php?per_page=200'); const j2 = await r2.json(); setProducts(Array.isArray(j2.items)? j2.items: []);
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
