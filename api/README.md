PHP backend (SQLite) for product import/list

Files added:
- `db.php` - small PDO SQLite helper
- `init_db.php` - creates `products` table in `products.db`
- `import_sample.php` - inserts the sample product (upserts on SKU)
- `list.php` - returns JSON list of products or single product by `?sku=` query

Quick start (Windows PowerShell):

1. Ensure PHP is installed and on PATH. Check with `php -v`.
2. Initialize the database:

   php .\php\init_db.php

3. Import the provided sample product:

   php .\php\import_sample.php

4. Serve the `php` folder (for testing) from the command line:

   php -S localhost:8000 -t .\php

5. Open in browser or curl the list endpoint:

   http://localhost:8000/list.php
   http://localhost:8000/list.php?sku=A10-H0303

Bulk import (JSON array):

You can POST a JSON array of product objects to `upload.php`.

Example using curl (PowerShell):

```powershell
curl -X POST -H "Content-Type: application/json" -d (Get-Content .\\api_first.json -Raw) http://localhost:8000/upload.php
```

Or upload a file with multipart/form-data:

```powershell
curl -X POST -F "file=@.\api_first.json" http://localhost:8000/upload.php
```

The endpoint returns a JSON summary: inserted, updated, errors.

Notes:
- This is a minimal, file-based backend intended for local testing and CSV/JSON import workflows.
- For production, migrate to MySQL/Postgres and add proper validation and auth.
