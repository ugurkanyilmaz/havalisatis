# Database Migration Guide

Bu uygulama Alembic kullanarak veritabanı migration'larını yönetir. Bu guide migration sistem kurulumu ve kullanımını açıklar.

## Migration Sistemi

### Kurulum Durumu
✅ Alembic yapılandırılmış  
✅ Tüm modeller migration'lara dahil  
✅ Docker otomatik migration desteği  
✅ İlk migration dosyası oluşturulmuş  

### Veritabanı Tabloları

Migration sistemi aşağıdaki tabloları oluşturur:

- **users** - Kullanıcı bilgileri
- **categories** - Ürün kategorileri (hiyerarşik)
- **products** - Ürün bilgileri
- **product_images** - Ürün resimleri
- **product_seo** - Ürün SEO verileri  
- **product_analytics** - Ürün analitik verileri
- **orders** - Siparişler
- **order_items** - Sipariş kalemleri
- **appointments** - Teknik servis randevuları
- **refresh_tokens** - Kullanıcı oturum token'ları
- **analytics_events** - Sistem analitik olayları

### Kullanım

#### Docker ile Otomatik Migration
Uygulama Docker'da başlatıldığında migration'lar otomatik çalışır:

```bash
docker-compose up --build
```

#### Manuel Migration İşlemleri

**Mevcut migration'ları çalıştır:**
```bash
alembic upgrade head
```

**Yeni migration oluştur:**
```bash
alembic revision --autogenerate -m "Migration açıklaması"
```

**Migration geçmişini gör:**
```bash
alembic history
```

**Belirli bir migration'a geri dön:**
```bash
alembic downgrade revision_id
```

#### Database Management Script

Veritabanı yönetimi için özel script kullanabilirsiniz:

```bash
# Veritabanı durumunu kontrol et
python scripts/db_manager.py check

# Migration'ları çalıştır
python scripts/db_manager.py migrate

# Yeni migration oluştur
python scripts/db_manager.py create "Migration mesajı"

# Migration geçmişini gör
python scripts/db_manager.py history

# Tam veritabanı kurulumu
python scripts/db_manager.py init
```

### Veritabanı Konfigürasyonu

#### SQLite (Geliştirme)
```bash
DATABASE_URL=sqlite:///./ecommerce.db
```

#### PostgreSQL (Production)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_db
```

#### MySQL (Production)
```bash
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/ecommerce_db
```

### Production Kurulumu

1. `.env.example` dosyasını `.env` olarak kopyalayın
2. Veritabanı bağlantı bilgilerini güncelleyin
3. `SECRET_KEY` değerini güvenli bir değerle değiştirin
4. Production veritabanında migration'ları çalıştırın:

```bash
alembic upgrade head
```

### Sorun Giderme

**Migration hataları:**
- `alembic.ini` dosyasının mevcut olduğundan emin olun
- Model import'larının doğru olduğunu kontrol edin
- Veritabanı bağlantısının çalıştığını test edin

**Tablo eksik hataları:**
```bash
python scripts/db_manager.py check
```

**Migration çakışmaları:**
```bash
alembic history
alembic heads
```

### Geliştirme Workflow'u

1. Model değişikliklerini yapın
2. Yeni migration oluşturun:
   ```bash
   alembic revision --autogenerate -m "Model değişiklik açıklaması"
   ```
3. Migration dosyasını kontrol edin ve gerekirse düzenleyin
4. Migration'ı test edin:
   ```bash
   alembic upgrade head
   ```
5. Değişiklikleri commit edin

### Güvenlik

- Production ortamında `SECRET_KEY` değerini mutlaka değiştirin
- Veritabanı şifrelerini `.env` dosyasında saklayın
- `.env` dosyasını `.gitignore`'a ekleyin
- Migration dosyalarını version control'e dahil edin

### Performans

- Büyük veri setlerinde migration süresini optimize edin
- İndekslerin doğru oluşturulduğunu kontrol edin
- Foreign key kısıtlamalarının performansını izleyin
