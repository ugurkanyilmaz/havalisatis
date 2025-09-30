Why these files?

If your app is a single-page application (SPA) using client-side routing, direct links to routes (for example `/iletisim`) can return 404 from the server unless the server rewrites unknown paths to `index.html` so the client app can handle routing.

Files added:
- `_redirects` (Netlify) — tells Netlify to serve `index.html` for any path.
- `.htaccess` (Apache) — config snippet to rewrite unknown paths to `index.html`.

Next steps:
1. Deploy the contents of `react/dist` or copy files from `react/public` into the site root depending on your hosting process.
2. If your host is not Apache/Netlify, check its docs for SPA fallback/rewrite settings and apply an equivalent rule.
3. If you can’t modify server configuration, consider using `HashRouter` in the React app as a fallback.
