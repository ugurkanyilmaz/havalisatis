# HavalıSatış

Lightweight PHP API + React SPA for a small e-commerce/catalog site.

## Overview

This repository contains two main parts:

- `api/` — PHP backend (single-file endpoints) that serves product data and provides a minimal admin interface for uploads and management. It can run with SQLite (local dev) or MySQL (production).
- `react/` — React single-page application (Vite) that consumes the API and provides the storefront UI.

The project was crafted for easy local development and simple deployment to a PHP-enabled host.

## Repository structure (important files)

- `api/` — PHP API and admin scripts
  - `config.php` — active config (DO NOT commit credentials)
  - `products.db` — SQLite database (optional for local dev)
  - `init_db.php`, `upload.php`, `products.php`, etc. — API endpoints and admin helpers
- `react/` — frontend (Vite + React)
  - `src/` — React source
  - `public/` — static assets
  - `package.json` — frontend dependencies and scripts
- `sql/` — SQL schema scripts
- `api_first.json`, `api_first.xlsx` — sample import files

## Prerequisites

- PHP 7.4+ (for `api/`) with SQLite extension if using SQLite
- MySQL server if you prefer production mode
- Node.js 16+ and npm/yarn for the frontend

## Configuration

The API reads configuration from `api/config.php`. To keep secrets out of git, `api/config.php` is ignored by `.gitignore`.

Recommended workflow:

1. Create `api/config.php` from `api/config.php.example` (if present) or copy the sample below and set your credentials.
2. For local dev you can use SQLite by setting the `driver` to `sqlite` and pointing `sqlite_path` to `api/products.db`.

Example minimal `api/config.php` (DO NOT commit your real credentials):

```php
<?php
return [
    // 'driver' => 'mysql',
    // 'host' => 'example.com',
    // 'port' => 3306,
    // 'database' => 'my_db',
    // 'username' => 'user',
    // 'password' => 'secret',
    // 'charset' => 'utf8mb4',

    // Local SQLite dev fallback:
    'driver' => 'sqlite',
    'sqlite_path' => __DIR__ . '/products.db',
];
```

If you accidentally committed `api/config.php` with secrets, see the "Remove secrets" section below.

## Setup & Run

Backend (PHP):

1. Place `api/` on a PHP-enabled host or run locally with the built-in PHP server:

```powershell
# from repository root
php -S localhost:8000 -t api
```

2. Visit `http://localhost:8000/products.php` (or other endpoints) to test.

Frontend (React):

1. Install dependencies:

```powershell
cd react
npm install
```

2. Start dev server:

```powershell
npm run dev
```

The SPA expects the API to be reachable (configure proxy or use absolute API URLs in `react/src/lib/api_calls.js`).

## Database

- For SQLite, the file `api/products.db` is included for convenience. Use `sql/create_products.sql` to initialize a MySQL database if you're switching to MySQL.

## Security notes

- Never commit `api/config.php` with real credentials. It's already added to `.gitignore`.
- If credentials were committed, remove them from history using git filter-repo or the BFG Repo Cleaner.

## Development tips

- The frontend is a Vite app — update API base URLs in `react/src/lib/api_calls.js` and `react/cookies.txt` if necessary.
- Admin endpoints in `api/` are simple PHP scripts; if you move the site behind authentication, update those scripts accordingly.

## Remove secrets from git history (if needed)

If `api/config.php` was accidentally committed with secrets, follow these general steps (this rewrites history):

1. Install BFG or use git filter-repo.
2. Run the appropriate command to remove the file from history, then force-push the cleaned branch.

Example (BFG):

```powershell
# remove file from all history
bfg --delete-files api/config.php
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Note: coordinate with teammates — history rewrite is destructive.

## Contributing

Open an issue or create a PR. Keep secrets out of code; use environment variables for CI.

## License

This repo doesn't specify a license. Add a `LICENSE` file if you want to open-source it.
