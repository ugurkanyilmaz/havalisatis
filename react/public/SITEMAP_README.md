How to regenerate sitemap.xml and robots.txt

1) Update product data
- `react/src/assets/api_first.json` contains product SKUs and metadata.

2) Regenerate
- From project root run (PowerShell):

```powershell
python .\scripts\generate_sitemap.py https://havalielaletlerisatis.com
```

This writes `react/public/sitemap.xml`, `react/dist/sitemap.xml` and updates `react/public/robots.txt`.

3) Verify locally
- Open `react/public/sitemap.xml` to inspect URLs.
- Ensure `react/public/robots.txt` contains `Sitemap: https://havalielaletlerisatis.com/sitemap.xml`.

4) Deploy
- Upload `react/dist/sitemap.xml` and `react/dist/index.html` (and `public/*`) to your host so `https://havalielaletlerisatis.com/sitemap.xml` is accessible.

5) Test live
- Visit `https://havalielaletlerisatis.com/robots.txt` and `https://havalielaletlerisatis.com/sitemap.xml` in a browser.
- Use Google Search Console to submit your sitemap for indexing.

Notes:
- The script limits to 1000 products to avoid excessively large sitemaps; adjust `max_items` in `scripts/generate_sitemap.py` if needed.
- If your product pages use a different URL structure, update the script accordingly.
