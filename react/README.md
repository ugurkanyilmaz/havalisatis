# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment variables

The homepage “Endüstriyel Seri” card uses the following optional environment variables to configure CTA links:

- `VITE_COMPANY_SITE_URL` — External site to open for “Web sitemizi görüntüle”
- `VITE_CATALOG_URL` — PDF or page to open for “Katalogu görüntüle”

Create a `.env` file in the `react` folder (same directory as `package.json`) and set values, for example:

```
VITE_COMPANY_SITE_URL=https://www.example.com
VITE_CATALOG_URL=https://cdn.example.com/catalog.pdf
```

If these variables are not set, the buttons will link to `#` and won’t navigate.
