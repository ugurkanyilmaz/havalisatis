# API v2 Migration Complete - Feature Comparison

## ✅ Completed Migration from v1 to v2

### Public Endpoints

| Feature | v1 Endpoint | v2 Endpoint | Status |
|---------|-------------|-------------|--------|
| Home page data | `/api/home.php` | `/api/v2/home.php` | ✅ Migrated + Static cache |
| Products list/search | `/api/products.php` | `/api/v2/products.php` | ✅ Migrated + Turkish normalization |
| Product detail by SKU | `/api/products.php?sku=X` | `/api/v2/products.php?sku=X` | ✅ Migrated + Cache |
| Categories list | `/api/categories.php` | `/api/v2/categories.php` | ✅ Migrated + Custom ordering |
| Tags list | `/api/tags.php` | `/api/v2/tags.php` | ✅ Migrated + Turkish labels |
| Health check | `/api/health.php` | `/api/v2/health.php` | ✅ Migrated |

### Admin Endpoints

| Feature | v1 Endpoint | v2 Endpoint | Status |
|---------|-------------|-------------|--------|
| Admin login | `/api/admin_login.php` | `/api/v2/admin.php?action=login` | ✅ Migrated |
| Admin logout | `/api/admin_logout.php` | `/api/v2/admin.php?action=logout` | ✅ Migrated |
| Admin check session | `/api/admin_check.php` | `/api/v2/admin.php?action=check` | ✅ Migrated |
| Clear cache | `/api/clear_cache.php` | `/api/v2/admin.php?action=clear_cache` | ✅ Migrated |
| Refresh home cache | `/api/refresh_home_cache.php` | `/api/v2/admin.php?action=refresh_home` | ✅ Migrated |
| Initialize DB/users | `/api/admin_init.php` | `/api/v2/admin.php?action=init` | ✅ Migrated |
| Bulk upload products | `/api/upload.php`, `/api/upload_bulk.php` | `/api/v2/admin.php?action=bulk_upload` | ✅ Migrated |
| Update product | `/api/update_product.php` | `/api/v2/products.php?action=update` | ✅ Migrated |
| Delete product | `/api/product_delete.php` | `/api/v2/products.php?action=delete` | ✅ Migrated |
| List all products | `/api/list.php` | `/api/v2/products.php?action=list` | ✅ Migrated |
| Get single product (admin) | `/api/list.php?sku=X` | `/api/v2/products.php?action=list&sku=X` | ✅ Migrated |

## 🚀 New Features in v2

1. **MVC Architecture**: Clean separation with Controllers, Middleware, Core classes
2. **Unified Admin Endpoint**: All admin actions through `/api/v2/admin.php?action=...`
3. **Rate Limiting**: Built-in rate limiter for public endpoints
4. **Response Format**: Consistent `{success, message, data}` format
5. **Turkish Character Normalization**: SQL-side normalization for better search
6. **Static Home Cache**: Pre-rendered home.json for instant loading
7. **SQLite Support**: Auto-detection for local testing
8. **Auth Middleware**: Clean session-based authentication
9. **Cache System**: File-based caching with TTL support
10. **Validator Class**: Input validation and sanitization

## 📋 API v2 Endpoints Summary

### Public API

```
GET  /api/v2/home.php
GET  /api/v2/products.php?parent=X&child=Y&q=search&page=1&per_page=24
GET  /api/v2/products.php?sku=ABC123
GET  /api/v2/categories.php
GET  /api/v2/tags.php
GET  /api/v2/health.php
```

### Admin API (requires authentication)

```
POST /api/v2/admin.php?action=login
POST /api/v2/admin.php?action=logout
GET  /api/v2/admin.php?action=check
POST /api/v2/admin.php?action=refresh_home
POST /api/v2/admin.php?action=clear_cache
POST /api/v2/admin.php?action=bulk_upload
POST /api/v2/admin.php?action=init

GET  /api/v2/products.php?action=list[&sku=X]
POST /api/v2/products.php?action=update
POST /api/v2/products.php?action=delete
```

## 🗑️ Ready to Delete

All v1 endpoints can now be safely deleted. The `api/.htaccess` file already:
- Rewrites `/api/*.php` → `/api/v2/*.php`
- Denies direct access to `/api/v1/` directory

## 🧪 Testing v2

### Test Health Check
```powershell
Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/health.php'
```

### Test Bulk Upload (requires login first)
```powershell
# 1. Login
$body = @{username='admin'; password='admin123'} | ConvertTo-Json
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/admin.php?action=login' -Method POST -ContentType 'application/json' -Body $body -WebSession $session

# 2. Upload JSON
$json = Get-Content "C:\path\to\products.json" -Raw
Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/admin.php?action=bulk_upload' -Method POST -ContentType 'application/json; charset=utf-8' -Body $json -WebSession $session
```

### Test Product Update
```powershell
$product = @{
    sku = 'A10-H0303'
    title = 'Updated Title'
    list_price = 5000
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/products.php?action=update' -Method POST -ContentType 'application/json' -Body $product -WebSession $session
```

### Test Product Delete
```powershell
$body = @{sku='A10-H0303'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/products.php?action=delete' -Method POST -ContentType 'application/json' -Body $body -WebSession $session
```

### Test List All Products
```powershell
Invoke-RestMethod -Uri 'http://localhost:8001/api/v2/products.php?action=list' -WebSession $session
```

## ✅ All v1 Features Successfully Migrated to v2!
