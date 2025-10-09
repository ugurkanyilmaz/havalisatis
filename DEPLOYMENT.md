# 🚀 Prodda Yükleme Rehberi

## 📦 Hangi Dosyalar Nereye?

```
Sunucuda yerleşim:
/home/u2415836_keten/public_html/
├── api/
│   ├── cache_helper.php          ✅ YENİ
│   ├── clear_cache.php           ✅ YENİ  
│   ├── health.php                ✅ YENİ
│   ├── db.php                    🔄 GÜNCELLENDİ
│   ├── products.php              🔄 GÜNCELLENDİ
│   ├── cron/                     ✅ YENİ KLASÖR
│   │   ├── .htaccess             ✅ Güvenlik
│   │   ├── keep_alive.php        ✅ Ana cron script
│   │   ├── README.md             📖 Kurulum rehberi
│   │   └── logs/                 📁 Otomatik oluşur
│   └── cache/                    📁 Var olan
│       └── home.json             (Korunur)
├── react/
│   └── src/
│       └── lib/
│           └── api_calls.js      🔄 GÜNCELLENDİ
└── .htaccess                     🔄 GÜNCELLENDİ
```

## ⚙️ Adım Adım Kurulum

### 1️⃣ Dosyaları Yükle

#### FTP/cPanel File Manager ile:

1. **Yeni dosyalar yükle:**
   - `api/cache_helper.php`
   - `api/clear_cache.php`
   - `api/health.php`
   - Tüm `api/cron/` klasörünü (`.htaccess` dahil!)

2. **Güncellenmiş dosyaları değiştir:**
   - `api/db.php`
   - `api/products.php`
   - `.htaccess` (root'ta)
   - `react/src/lib/api_calls.js`

3. **Kontrol et:**
   ```bash
   # .htaccess dosyalarının hidden olduğunu unutma!
   # cPanel File Manager'da "Show Hidden Files" aktif olmalı
   ```

### 2️⃣ İzinleri Ayarla

```bash
# SSH ile (veya cPanel File Manager'dan)
chmod 755 api/cron
chmod 644 api/cron/.htaccess
chmod 755 api/cron/keep_alive.php
chmod 755 api/cache
```

### 3️⃣ Test Et

#### a) Health Check:
```bash
curl https://havalielaletlerisatis.com/api/health.php
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T...",
  "checks": {
    "database": {"status": "ok"}
  }
}
```

#### b) Cache Test:
```bash
# İlk istek (DB'den)
curl "https://havalielaletlerisatis.com/api/products.php?page=1"

# İkinci istek (cache'den - çok hızlı)
curl "https://havalielaletlerisatis.com/api/products.php?page=1"
```

#### c) Cron Script Test:
```bash
# Manuel çalıştır (SSH)
php /home/u2415836_keten/public_html/api/cron/keep_alive.php
```

Çıktı:
```
Keep-alive completed: Health: 200, Home: 200, Products: 200, Category: 200
```

#### d) Güvenlik Testi:
```bash
# Bu 403 dönmeli (doğru!)
curl https://havalielaletlerisatis.com/api/cron/keep_alive.php
```

### 4️⃣ Cron Job Ekle

**cPanel → Advanced → Cron Jobs:**

```
Common Settings: Custom
Minute: */5
Hour: *
Day: *
Month: *
Weekday: *

Command:
/usr/bin/php /home/u2415836_keten/public_html/api/cron/keep_alive.php
```

**ÖNEMLİ:** Path'i kontrol et!
```bash
# SSH'dan kontrol et:
pwd
# Çıktı: /home/u2415836_keten/public_html
```

### 5️⃣ Frontend Build & Deploy

```bash
# Local'de:
cd react
npm run build

# Build klasörünü sunucuya yükle (dist/ veya build/)
```

## ✅ Kontrol Listesi

Kurulum tamamlandıktan sonra kontrol et:

- [ ] `https://siteadi.com/api/health.php` çalışıyor (200 OK)
- [ ] `https://siteadi.com/api/products.php?page=1` ürün listesi döndürüyor
- [ ] `https://siteadi.com/api/cron/keep_alive.php` → 403 Forbidden (doğru!)
- [ ] `api/cron/logs/keepalive.log` dosyası oluştu
- [ ] cPanel'de cron job görünüyor
- [ ] 5 dakika sonra log dosyasına yeni satır eklendi
- [ ] Frontend açılıyor ve ürünler yükleniyor

## 🔧 Sorun Giderme

### "500 Internal Server Error"

1. **PHP version kontrolü:**
   ```bash
   php -v
   # En az PHP 7.4 gerekli, 8.0+ önerilir
   ```

2. **Syntax error kontrolü:**
   ```bash
   php -l api/products.php
   ```

3. **Error log:**
   ```bash
   tail -f api/logs/api_errors.log
   ```

### Cron Çalışmıyor

1. **Path kontrolü:**
   ```bash
   which php
   # Çıktı: /usr/bin/php veya /usr/local/bin/php
   ```

2. **Manuel test:**
   ```bash
   php /tam/path/api/cron/keep_alive.php
   ```

3. **cPanel cron email:**
   - cPanel → Cron Jobs → Email ayarlarını kontrol et

### Cache Çalışmıyor

```bash
# Cache klasör izinleri
ls -la api/cache/
# Çıktı: drwxr-xr-x (755 olmalı)

# Cache temizle
php api/clear_cache.php?token=admin123
```

## 📊 Monitoring

### Log Dosyaları:
```bash
# API errors
tail -f api/logs/api_errors.log

# Keep-alive
tail -f api/cron/logs/keepalive.log

# Web server errors
tail -f ~/logs/error_log  # cPanel'de genelde burası
```

### Performance Test:
```bash
# Response time ölçümü
time curl https://havalielaletlerisatis.com/api/products.php?page=1

# İlk istek: ~500ms (DB'den)
# İkinci istek: ~50ms (cache'den) ← %90 daha hızlı!
```

## 🎉 Başarı!

Her şey çalışıyorsa:
- ✅ Site hızlı yükleniyor
- ✅ Cold start sorunu yok
- ✅ Mobil'den erişim sorunsuz
- ✅ Log dosyaları düzenli güncelleniyor

## 🆘 Destek Gerekirse

1. `api/logs/api_errors.log` kontrol et
2. `api/cron/logs/keepalive.log` kontrol et  
3. cPanel → Metrics → Errors bak
4. MySQL bağlantı sayısı: cPanel → MySQL Databases → "Current Connections"
