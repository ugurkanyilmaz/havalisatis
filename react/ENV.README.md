# Frontend Environment Variables

Create a `.env` file based on `.env.example`.

Required for production build:
- `VITE_SITE_NAME` : Site görünen adı
- `VITE_SITE_URL` : Kanonik tam domain (https ile)
- `VITE_GA_ID` : Google Analytics 4 ölçüm kimliği (opsiyonel ama önerilir)

Optional:
- `VITE_DEFAULT_CURRENCY`
- `VITE_DEFAULT_LOCALE`
- `VITE_TWITTER_SITE`, `VITE_TWITTER_CREATOR`
- `VITE_COMPANY_SITE_URL`, `VITE_CATALOG_URL`

SEO meta ve structured data bu değerler üzerinden otomatik üretilir.
