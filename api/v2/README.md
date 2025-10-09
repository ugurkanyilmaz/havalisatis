# API v2 - Modern & Optimized

## 🎯 Features

### Performance Optimizations
- ✅ **Static JSON Cache** for home page (eliminates 2 SQL queries!)
- ✅ **Request Caching** with configurable TTL
- ✅ **Rate Limiting** (60 req/min per IP)
- ✅ **Connection Pooling** with auto-reconnect
- ✅ **Atomic File Writes** for cache safety
- ✅ **GZIP Compression** automatic

### Clean Architecture
```
v2/
├── bootstrap.php          # Auto-loader & initialization
├── config/
│   ├── app.php           # Application config
│   └── database.php      # Database credentials
├── core/
│   ├── Database.php      # Singleton DB manager
│   ├── Cache.php         # File-based cache
│   ├── Response.php      # JSON response helper
│   └── Validator.php     # Input validation
├── middleware/
│   ├── RateLimiter.php   # API rate limiting
│   └── Auth.php          # Session authentication
├── controllers/
│   ├── HomeController.php       # Home data (static cache)
│   ├── ProductsController.php   # Products CRUD
│   └── AdminController.php      # Admin operations
└── cache/
    └── home.json         # Static home cache (auto-generated)
```

## 📡 API Endpoints

### Public Endpoints

#### GET /api/v2/home.php
Returns popular and special priced products from static cache.

**Response:**
```json
{
  "popular": [...],
  "specialPrices": [...],
  "generated_at": "2025-10-01T..."
}
```

**Headers:**
- `X-Cache-Status: fresh|stale`

---

#### GET /api/v2/categories.php
Returns distinct parent/child category pairs with **custom ordering**.

**Special Features:**
- ✅ Parent categories ordered by importance (Havalı El Aletleri first)
- ✅ "Havalı El Aletleri" child categories have **23 custom rules** for ordering
- ✅ Turkish character normalization in sorting

**Response:**
```json
[
  {
    "parent_category": "Havalı El Aletleri",
    "child_category": "Somun Sökücüler",
    "cnt": 45
  },
  ...
]
```

---

#### GET /api/v2/tags.php
Returns distinct tags with Turkish labels.

**Response:**
```json
[
  { "key": "popular", "label": "Popüler" },
  { "key": "special_price", "label": "Özel Fiyat" },
  ...
]
```

---

#### GET /api/v2/products.php
List products with filtering and pagination. **Turkish character normalization enabled!**

**Query Params:**
- `parent` - Parent category filter (Turkish-aware: "Şarjlı" matches "sarjli")
- `child` - Child category filter (Turkish-aware)
- `q` - Search query (searches in title, SKU, brand, tags, categories - Turkish-aware)
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 24, max: 100)

**Turkish Character Normalization:**
- ✅ Searches work with or without Turkish characters
- ✅ "şarjlı" = "sarjli" = "SARJLI" (all match)
- ✅ Applied to: ş→s, ı→i, ğ→g, ü→u, ö→o, ç→c

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "per_page": 24,
  "items": [...]
}
```

**Headers:**
- `X-Cache-Hit: true|false`
- `X-RateLimit-Limit: 60`
- `X-RateLimit-Remaining: 45`

---

#### GET /api/v2/products.php?sku=ABC123
Get single product by SKU.

**Response:**
```json
{
  "product": {...}
}
```

---

### Admin Endpoints (Requires Authentication)

#### POST /api/v2/admin.php?action=login
Login to admin panel.

**Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

#### POST /api/v2/admin.php?action=refresh_home
**Regenerate home.json cache** (requires auth)

This is the magic button! Refreshes popular and special priced products.

**Response:**
```json
{
  "success": true,
  "message": "Home cache regenerated successfully",
  "data": {
    "popular": [...],
    "specialPrices": [...],
    "generated_at": "2025-10-01T..."
  }
}
```

---

#### POST /api/v2/admin.php?action=clear_cache
Clear all cache files (requires auth).

---

#### POST /api/v2/admin.php?action=logout
Logout from admin panel.

---

#### GET /api/v2/admin.php?action=check
Check if logged in.

## 🚀 Frontend Integration

### Update API Calls

**Old (v1):**
```javascript
fetch('/api/home.php')  // 2 SQL queries every time!
```

**New (v2):**
```javascript
fetch('/api/v2/home.php')  // Instant! Static JSON
```

### Products API
```javascript
// List products
fetch('/api/v2/products.php?page=1&per_page=24')

// Search
fetch('/api/v2/products.php?q=matkap')

// Filter by category
fetch('/api/v2/products.php?parent=Hava Tabancaları')

// Single product
fetch('/api/v2/products.php?sku=ABC123')
```

### Admin - Refresh Home Cache Button
```javascript
async function refreshHomeCache() {
  const response = await fetch('/api/v2/admin.php?action=refresh_home', {
    method: 'POST',
    credentials: 'include'  // Include session cookie
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('Ana sayfa verileri güncellendi!');
  }
}
```

## ⚡ Performance Comparison

### Before (v1):
```
Home Page Load:
- 1x SQL: categories
- 1x SQL: tags  
- 1x SQL: popular products
- 1x SQL: special prices
Total: 4 SQL queries = ~200-500ms
```

### After (v2):
```
Home Page Load:
- 1x Read: home.json (static file)
Total: 0 SQL queries = ~10-20ms 🚀
```

**Result: 95% faster!**

## 🔧 Configuration

### Cache TTL (config/app.php)
```php
'cache' => [
    'ttl' => 300,        // 5 minutes (products)
    'search_ttl' => 60,  // 1 minute (search results)
],
```

### Rate Limiting
```php
'rate_limit' => [
    'max_requests' => 60,  // per minute
    'ban_duration' => 300, // 5 minutes
],
```

### Pagination
```php
'pagination' => [
    'default_per_page' => 24,
    'max_per_page' => 100,
],
```

## 🛠️ Maintenance

### Regenerate Home Cache
**Option 1: Admin Panel** (Recommended)
- Login to admin
- Click "Yenile" button

**Option 2: Direct API Call**
```bash
curl -X POST "https://havalielaletlerisatis.com/api/v2/admin.php?action=refresh_home" \
  --cookie "PHPSESSID=your_session_id"
```

**Option 3: Cron Job**
```bash
# Every hour
0 * * * * curl -s "https://havalielaletlerisatis.com/api/v2/admin.php?action=refresh_home&token=SECRET"
```

### Clear All Cache
```bash
curl -X POST "https://havalielaletlerisatis.com/api/v2/admin.php?action=clear_cache" \
  --cookie "PHPSESSID=your_session_id"
```

## 📊 Monitoring

### Cache Status
```bash
# Check home cache
curl -I "https://havalielaletlerisatis.com/api/v2/home.php"
# Look for: X-Cache-Status: fresh|stale

# Check products cache
curl -I "https://havalielaletlerisatis.com/api/v2/products.php?page=1"
# Look for: X-Cache-Hit: true|false
```

### Rate Limit
```bash
curl -I "https://havalielaletlerisatis.com/api/v2/products.php"
# Look for:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 45
```

## 🎉 Benefits

1. **95% Faster Home Page** - No SQL queries for popular/special products
2. **Better Concurrency** - Static files serve thousands of requests
3. **Lower DB Load** - MySQL only hit when cache miss
4. **Admin Control** - Refresh cache any time from admin panel
5. **Rate Limited** - API abuse protection
6. **Clean Code** - Easy to maintain and extend

## 🔄 Migration from v1

1. Keep v1 running
2. Deploy v2 alongside
3. Update frontend to use `/api/v2/` endpoints
4. Test thoroughly
5. Remove v1 when ready

Both versions can run simultaneously!

## Local SQLite testing (deprecated)

SQLite support in API v2 is deprecated. The preferred and supported setup for
production is MySQL. You may still use SQLite locally for quick experiments,
but helper scripts and the auto-created sqlite DB are kept only for legacy use.

1. (Deprecated) Create and seed the sqlite database (not recommended for production):

```bash
php api/v2/scripts/seed_sqlite.php
```

Note: For production, run the MySQL schema in `sql/create_products.sql` and
configure MySQL credentials in `api/v2/config/database.php` or via environment
variables. Use MySQL for production deployments.

2. Run local server (for local testing only):

```bash
php -S localhost:8000 -t .
```

3. Test endpoints (local):

- `http://localhost:8000/api/v2/products.php?q=şarjlı`
- `http://localhost:8000/api/v2/categories.php`
- `http://localhost:8000/api/v2/tags.php`
- `http://localhost:8000/api/v2/home.php`
