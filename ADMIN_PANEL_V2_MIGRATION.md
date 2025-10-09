# ✅ Admin Panel v2 Migration Complete

## Güncellemeler

### Admin.jsx'te Güncellenen Endpoint'ler:

1. **Toplu Ürün Yükleme (Bulk Upload)**
   - Eski: `POST /api/upload.php`
   - Yeni: `POST /api/v2/admin.php?action=bulk_upload`
   - Format: FormData (dosya) veya JSON array

2. **Tek Ürün Kaydetme**
   - Eski: `POST /api/upload.php` (array içinde tek ürün)
   - Yeni: `POST /api/v2/admin.php?action=bulk_upload` (array içinde tek ürün)
   - Format: JSON array `[{sku: ..., title: ..., ...}]`

3. **Ürün Silme**
   - Eski: `POST /api/product_delete.php`
   - Yeni: `POST /api/v2/products.php?action=delete`
   - Format: JSON `{sku: "ABC123"}`

4. **Ürün Listesi Yükleme**
   - Eski: `GET /api/products.php?per_page=200`
   - Yeni: `GET /api/v2/products.php?per_page=200`

5. **Tek Ürün Detayı**
   - Eski: `GET /api/products.php?sku=ABC123`
   - Yeni: `GET /api/v2/products.php?sku=ABC123`

### Response Format Değişiklikleri:

#### v1 Format:
```json
{
  "inserted": 5,
  "updated": 3,
  "errors": []
}
```

#### v2 Format:
```json
{
  "success": true,
  "message": "Bulk upload completed: 5 inserted, 3 updated",
  "data": {
    "inserted": 5,
    "updated": 3,
    "errors": [],
    "total": 8
  }
}
```

### Hata Response'ları:

#### v1 Format:
```json
{
  "error": "Unauthorized"
}
```

#### v2 Format:
```json
{
  "success": false,
  "message": "Unauthorized. Admin login required."
}
```

## Test Adımları

### 1. Vite Dev Server'ı Yeniden Başlat
```powershell
# React terminalde Ctrl+C
npm run dev
```

### 2. Admin Panele Giriş
- http://localhost:5173/admin
- Kullanıcı: `admin`
- Şifre: `admin123`

### 3. Test Senaryoları

#### ✅ Toplu Yükleme Testi
1. Admin panelde "Toplu Yükleme" bölümüne git
2. JSON dosya seç
3. "Yükle" butonuna tıkla
4. Success mesajında `inserted`, `updated`, `errors` sayılarını kontrol et

#### ✅ Tek Ürün Ekleme/Düzenleme
1. Sol tarafta bir ürün seç VEYA "Yeni Ürün Ekle"
2. Formu doldur
3. "Kaydet" butonuna tıkla
4. Success mesajını kontrol et
5. Ürün listesinin otomatik yenilendiğini gör

#### ✅ Ürün Silme
1. Bir ürün seç
2. "Sil" butonuna tıkla
3. Onay ver
4. Success mesajını kontrol et
5. Ürünün listeden gittiğini gör

## Önemli Notlar

- ✅ Tüm admin işlemleri authentication gerektiriyor
- ✅ Session cookie'ler `credentials: 'include'` ile gönderiliyor
- ✅ Vite proxy `/api` isteklerini `http://localhost:8001`'e yönlendiriyor
- ✅ `.htaccess` dosyası `/api/*.php` isteklerini `/api/v2/*.php`'ye rewrite ediyor
- ✅ v2 response'ları consistent `{success, message, data}` formatında

## Sonraki Adımlar

1. ✅ Vite dev server restart
2. 🧪 Admin panel tüm özellikleri test et
3. 📦 React production build: `npm run build`
4. 🚀 Sunucuya deploy

## v1'i Silmeye Hazır!

Tüm endpoint'ler v2'ye migrate edildi. `api/v1/` klasörü artık hiçbir yerden kullanılmıyor ve silinebilir.
