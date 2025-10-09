# 🚀 API v2 + React Frontend Deployment Guide

## ✅ Tamamlanan İşlemler

### 1. API v2 Backend
- ✅ Modern MVC architecture (config, core, middleware, controllers)
- ✅ Statik JSON cache sistemi (home.json - 2 SQL sorgusunu elimine etti!)
- ✅ Rate limiting (60 req/min per IP)
- ✅ Request caching with TTL
- ✅ Admin cache refresh endpoint

### 2. React Frontend
- ✅ Admin paneline "Ana Sayfa Cache Yenile" butonu eklendi
- ✅ API çağrıları v2'ye migrate edildi:
  - `/api/home.php` → `/api/v2/home.php`
  - `/api/products.php` → `/api/v2/products.php`
- ✅ Categories ve tags hala v1 kullanıyor (v1 çalıştığı için sorun yok)

### 3. Cache Initialization
- ✅ `init_cache.php` scripti oluşturuldu
- ✅ CLI veya web üzerinden çalıştırılabilir

---

## 📋 Deployment Adımları

### 1️⃣ Dosyaları Sunucuya Yükle

```bash
# cPanel File Manager veya FTP ile yükle:
/home/u2415836/public_html/api/v2/
```

**Yüklenecek klasör yapısı:**
```
api/v2/
├── bootstrap.php
├── init_cache.php
├── home.php
├── products.php
├── admin.php
├── .htaccess
├── README.md
├── config/
│   ├── app.php
│   └── database.php
├── core/
│   ├── Database.php
│   ├── Cache.php
│   ├── Response.php
│   └── Validator.php
├── middleware/
│   ├── RateLimiter.php
│   └── Auth.php
├── controllers/
│   ├── HomeController.php
│   ├── ProductsController.php
│   └── AdminController.php
└── cache/
    └── .gitkeep
```

### 2️⃣ Cache Klasörüne Yazma İzni Ver

cPanel File Manager'da:
```
api/v2/cache/ klasörüne sağ tıkla
→ Change Permissions
→ 755 veya 775 seç
→ Save
```

Terminal erişimin varsa:
```bash
chmod 755 /home/u2415836/public_html/api/v2/cache
```

### 3️⃣ İlk Cache'i Oluştur

**Seçenek A: Web üzerinden (önerilen)**
```bash
curl "https://havalielaletlerisatis.com/api/v2/init_cache.php?token=change-this-secret-token-123"
```

**Seçenek B: SSH ile**
```bash
cd /home/u2415836/public_html/api/v2
php init_cache.php
```

**Seçenek C: cPanel Cron Job**
```
Command: /usr/bin/php /home/u2415836/public_html/api/v2/init_cache.php
Schedule: @reboot (veya her gün sabah 6:00)
```

### 4️⃣ React Build ve Deploy

**Local'de build al:**
```bash
cd react
npm run build
```

**Dist klasörünü sunucuya yükle:**
```
/home/u2415836/public_html/
```

Build edilen dosyalar root'a gitsin (index.html, assets/, _redirects, vb.)

### 5️⃣ Test Et

#### Home Page Testi
```bash
# Ana sayfa verilerini çek
curl https://havalielaletlerisatis.com/api/v2/home.php

# Yanıt:
{
  "popular": [...],
  "specialPrices": [...],
  "generated_at": "2025-10-01T12:34:56+00:00"
}

# Header'ları kontrol et
curl -I https://havalielaletlerisatis.com/api/v2/home.php
# Bakılacak:
# X-Cache-Status: fresh|stale
# Cache-Control: public, max-age=300
```

#### Products Testi
```bash
# Tüm ürünler
curl "https://havalielaletlerisatis.com/api/v2/products.php?page=1&per_page=24"

# Arama
curl "https://havalielaletlerisatis.com/api/v2/products.php?q=matkap"

# Kategori filtresi
curl "https://havalielaletlerisatis.com/api/v2/products.php?parent=Hava%20Tabancaları"

# Tekil ürün (SKU)
curl "https://havalielaletlerisatis.com/api/v2/products.php?sku=A10-H0303"
```

#### Admin Cache Refresh Testi
1. Admin paneline giriş yap: https://havalielaletlerisatis.com/admin
2. Sol sidebar'da "🔄 Ana Sayfa Cache Yenile" butonuna bas
3. "✅ Ana sayfa cache güncellendi!" mesajını gör

**Manuel test:**
```bash
# Login
curl -X POST "https://havalielaletlerisatis.com/api/admin_login.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpass"}' \
  -c cookies.txt

# Cache refresh
curl -X POST "https://havalielaletlerisatis.com/api/v2/admin.php?action=refresh_home" \
  -b cookies.txt
```

### 6️⃣ Rate Limit Testi
```bash
# 60+ istek gönder, 429 almalısın
for i in {1..65}; do
  curl -s -o /dev/null -w "%{http_code}\n" "https://havalielaletlerisatis.com/api/v2/products.php?page=1"
done

# İlk 60 → 200
# Sonraki 5 → 429 (Too Many Requests)
```

---

## 🔧 Sorun Giderme

### Cache Oluşmuyor
```bash
# Dosya var mı kontrol et
ls -la /home/u2415836/public_html/api/v2/cache/

# Yazma izni var mı
stat /home/u2415836/public_html/api/v2/cache/

# Manuel oluştur
php /home/u2415836/public_html/api/v2/init_cache.php
```

### 500 Internal Server Error
```bash
# PHP error log'larına bak
tail -f /home/u2415836/logs/error_log

# veya
tail -f /home/u2415836/public_html/api/v2/error_log
```

### CORS Hatası
Bootstrap.php'de CORS ayarları var:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
```

Cloudflare kullanıyorsan, "Always Use HTTPS" ve "Auto Minify" ayarlarını kontrol et.

### Database Connection Error
```bash
# config/database.php kontrol et
cat /home/u2415836/public_html/api/v2/config/database.php

# MySQL bağlantısını test et
mysql -h 94.73.148.122 -u u2415836_satis -p u2415836_satis
```

---

## 📊 Performans İzleme

### Cache Hit Rate
```bash
# 10 istek gönder, X-Cache-Hit header'ına bak
for i in {1..10}; do
  curl -I "https://havalielaletlerisatis.com/api/v2/products.php?page=1" | grep X-Cache-Hit
done
```

### Response Time
```bash
curl -w "@curl-format.txt" -o /dev/null -s "https://havalielaletlerisatis.com/api/v2/home.php"

# curl-format.txt içeriği:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

---

## 🎉 Başarı Kriterleri

✅ **home.json oluştu ve güncel** (son 1 saat içinde)  
✅ **Ana sayfa < 100ms yükleniyor** (cache'den)  
✅ **Rate limiting çalışıyor** (60 req sonra 429)  
✅ **Admin refresh butonu çalışıyor**  
✅ **SKU lookup çalışıyor**  
✅ **Arama ve filtreleme çalışıyor**  

---

## 🔄 Güncellemeler İçin

### home.json'u Manuel Yenile
```bash
# Admin panelden
Buton: "🔄 Ana Sayfa Cache Yenile"

# veya cURL ile
curl -X POST "https://havalielaletlerisatis.com/api/v2/admin.php?action=refresh_home" \
  --cookie "PHPSESSID=xxx"
```

### Tüm Cache'i Temizle
```bash
curl -X POST "https://havalielaletlerisatis.com/api/v2/admin.php?action=clear_cache" \
  --cookie "PHPSESSID=xxx"
```

### Cron Job İle Otomatik Yenileme (İsteğe Bağlı)
```bash
# Her gün sabah 6:00'da
0 6 * * * /usr/bin/php /home/u2415836/public_html/api/v2/init_cache.php
```

---

## 📝 Notlar

- **v1 API hala çalışıyor** - Kategori/tag endpoint'leri v1 kullanıyor, sorun yok
- **Admin endpoint'leri v1** - upload.php, product_delete.php v1'de, işlevsel
- **Cloudflare cache** - Cloudflare proxy kullanıyorsan 5dk cache var
- **Rate limit** - IP başına 60 istek/dakika, aşarsa 5 dakika ban
- **Session-based auth** - Admin endpoint'leri session kullanıyor

---

## 🎯 Sonraki Adımlar (İsteğe Bağlı)

1. **Categories/Tags API v2'ye taşı** (şimdilik v1 çalışıyor, acil değil)
2. **Upload/Delete endpoint'leri v2'ye taşı** (admin için)
3. **Monitoring kurulumu** - Uptime robot, error tracking
4. **CDN optimizasyonu** - Cloudflare ayarları fine-tune
5. **Database indexing** - Popular queries için index ekle

---

## 📞 Destek

Sorun yaşarsan:
1. Error log'lara bak
2. Browser console'u kontrol et
3. Network tab'da request/response'ları incele
4. Cache dosyası var mı kontrol et

**Başarılar! 🎉**
