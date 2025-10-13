# Havalı Satış (havalisatis)

Small storefront and admin panel for selling pneumatic tools. This repository contains a PHP backend (API v2) and a React frontend (single-page app). The project is intentionally simple and self-hostable.

## Repository layout

- `api/` - PHP API (v2) and admin endpoints
  - `controllers/` - controller classes (ProductsController, AdminController, ...)
  - `uploads/` - uploaded assets served by `api/v2/uploads` (created at runtime)
  - `admin.php` - admin router
- `react/` - React SPA (Vite) for public site + admin UI
- `sql/` - database schema scripts (create_products.sql, create_users.sql)
- misc scripts: `keep_alive.sh`, `diagnostic.php`, `excel_tojson.py`

## New/Important features (recent changes)

- Admin export: admin panel includes JSON/CSV export buttons for all products (visible in the admin sidebar).
- Image uploads: admin UI supports uploading product images (backend stores them under `api/v2/uploads/` and returns a public URL). Admin can provide `existing` to overwrite files.
- meta_keywords: products now have a `meta_keywords` field. The admin UI exposes a `Meta Keywords` input. The frontend `head_manager` will use `seo.meta_keywords` when present to render `<meta name="keywords" ...>` on product pages.
- Iade Politikası page: a Turkish return policy page is available at `/iade-politikasi`.

## Quick setup (development)

Requirements

- PHP 7.4+ with PDO (MySQL)
- Node.js (16+) and npm
- MySQL / MariaDB

1) Backend

- Create a database and import schema (or run the SQL scripts in `sql/`):

```sql
-- create tables
SOURCE sql/create_products.sql;
SOURCE sql/create_users.sql;
```

- If you already have a `products` table, add the `meta_keywords` column:

```sql
ALTER TABLE products ADD COLUMN meta_keywords TEXT NULL;
```

- Serve PHP (example using built-in server for quick dev):

```powershell
# from repo root
php -S 0.0.0.0:8000 -t api/v2
```

2) Frontend

```powershell
cd react
npm install
npm run dev   # or npm run build for production
```

Open the site at `http://localhost:5173` (vite default) or the port Vite uses.

## Admin

- Admin endpoints are exposed under `api/v2/admin.php?action=...`.
- The React admin UI is integrated into the same SPA (route: `/admin`). Admin login uses session cookies.
- File uploads: the admin upload endpoint is `api/v2/admin.php?action=upload_image` and returns JSON `{ success:true, data:{url: 'https://.../api/v2/uploads/xxx.jpg'} }`.
- Export: from the admin sidebar you can download all products as JSON or CSV.

## Iade (Return) Policy page

- The project contains a basic return policy at `/iade-politikasi`. Edit `react/src/views/iade-politikasi.jsx` to change the text or contact info.

## Notes / Next steps

- If you deploy to a production environment, configure a proper uploads directory (outside webroot or with secure access as needed) and set correct file permissions.
- Consider versioning or migration scripts for DB changes (e.g., `meta_keywords`). A simple migration file can be added to `sql/migrations/`.
- You may want to protect admin endpoints behind HTTPS and stronger auth in production.

## Contact

If you want me to add a migration file, wire a footer link to the iade page, or run a local build and smoke test, tell me and I'll do it.