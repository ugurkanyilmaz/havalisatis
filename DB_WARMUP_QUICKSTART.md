# 🔥 DB Warmup - Hızlı Başlangıç Kılavuzu

## Sorun Ne?
Natrohost gibi paylaşımlı hostinglerde MySQL bağlantısı idle kalınca kapanıyor. İlk ziyaretçi geldiğinde site **5-10 saniye** yavaş açılıyor (cold start).

## Çözüm Ne?
Her 5 dakikada bir MySQL'i ping'leyip cache'i yenileyerek bağlantıyı **sıcak tutuyoruz**.

---

## ⚡ Hızlı Kurulum (3 Adım)

### 1️⃣ Dosyaları Yükle
Bu dosyaları sunucuya yükle:
```
api/v2/core/Database.php          ← Güncellendi (auto-reconnect)
api/v2/.user.ini                  ← YENİ (opcache aktif)
api/v2/init_cache.php             ← Güncellendi (warmup)
api/v2/scripts/db_warmup.php      ← Alternatif warmup
```

### 2️⃣ cPanel Cron Ekle
**cPanel > Cron Jobs > Add New Cron Job**

**Komut:**
```bash
*/5 * * * * /usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1" > /dev/null 2>&1
```

**Zamanlama:**
- Minute: `*/5`
- Hour: `*`
- Day: `*`
- Month: `*`
- Weekday: `*`

**Veya basitçe:** "Common Settings" → "Every 5 Minutes" seç

### 3️⃣ Test Et (5 dakika sonra)
Browser'da aç:
```
https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1
```

**Başarılı çıktı:**
```json
{
  "success": true,
  "message": "Warm-up complete",
  "duration_ms": 2134,
  "product_count": 150,
  "timestamp": "2025-10-03T14:25:03+03:00"
}
```

---

## ✅ Çalışıyor mu Kontrol Et

### Test 1: Manuel Warmup
```bash
curl "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1"
```
✅ JSON response dönmeli

### Test 2: Site Hızı
- Tarayıcıyı kapat
- 10 dakika bekle
- Siteyi tekrar aç
- **Beklenen:** <1 saniye yükleme (önceden 5-10 saniye)

### Test 3: Health Check
```bash
curl https://www.havalielaletlerisatis.com/api/v2/health.php
```
✅ `"database": "connected"` görmeli

---

## 🔧 Sorun Giderme

### Hata 1: "Add ?warmup=1 to URL"
**Sebep:** URL'de parametre eksik  
**Çözüm:** `?warmup=1` parametresini ekle

### Hata 2: Cron çalışmıyor
**Test:**
```bash
# Manuel dene:
/usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1"

# curl yoksa wget dene:
/usr/bin/wget -q -O /dev/null "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1"
```

### Hata 3: SSL hatası
**Çözüm (geçici test için):**
```bash
/usr/bin/curl -k -s "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1" > /dev/null 2>&1
```

### Hata 4: Database connection failed
**Kontrol:**
- `config/database.php` dosyasındaki credentials doğru mu?
- MySQL servisi çalışıyor mu? (cPanel > MySQL Databases)

---

## 📊 Beklenen Performans

| Metrik | Önce | Sonra |
|--------|------|-------|
| İlk yükleme | 5-10 saniye | <1 saniye |
| Cache hit | 2-5 saniye | 50-100ms |
| MySQL ping | Her istekte | 5 dakikada 1 |
| Opcache | Kapalı | %50-70 hız artışı |

---

## 🎯 Alternatif Scriptler

### Seçenek 1: init_cache.php (ÖNERİLEN)
✅ Cache yeniliyor  
✅ DB warmup  
✅ Product count check  
```bash
*/5 * * * * /usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1" > /dev/null 2>&1
```

### Seçenek 2: db_warmup.php (Minimal)
✅ Sadece DB ping  
✅ Daha hafif  
```bash
*/5 * * * * /usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/scripts/db_warmup.php?DB_WARMUP=1" > /dev/null 2>&1
```

### Seçenek 3: İkisi birden (Maksimum güvenlik)
```bash
*/5 * * * * /usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1" > /dev/null && /usr/bin/curl -s "https://www.havalielaletlerisatis.com/api/v2/scripts/db_warmup.php?DB_WARMUP=1" > /dev/null 2>&1
```

---

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için:
- **PRODUCTION_CHECKLIST.md** - Komple deployment kılavuzu
- **COLD_START_FIX.md** - Eski çözüm açıklamaları
- **CONCURRENCY_FIX.md** - Eşzamanlılık sorunları

---

## 🆘 Hala Sorun mu Var?

1. **Cron log kontrol et:**
   - cPanel > Cron Jobs > Cron Email (varsa)
   
2. **Manuel test yap:**
   ```bash
   curl -v "https://www.havalielaletlerisatis.com/api/v2/init_cache.php?warmup=1"
   ```
   
3. **Health check:**
   ```bash
   curl https://www.havalielaletlerisatis.com/api/v2/health.php
   ```

4. **Detaylı troubleshooting:**
   - `PRODUCTION_CHECKLIST.md` dosyasını oku
   - Troubleshooting bölümüne bak

---

## ✨ Özet

✅ **3 adımda kurulum** (dosya yükle + cron ekle + test et)  
✅ **cURL ile kolay cron** (PHP CLI sorunları yok)  
✅ **HTTP ile warmup** (güvenli, her hostingde çalışır)  
✅ **%80-90 hız artışı** (cold start ortadan kalkar)  
✅ **Opcache aktif** (%50-70 ekstra hız)  

**Artık site her zaman hazır! 🚀**

---

**Son Güncelleme:** 2025-10-03  
**Versiyon:** 2.1-curl  
**Platform:** Natrohost / cPanel
