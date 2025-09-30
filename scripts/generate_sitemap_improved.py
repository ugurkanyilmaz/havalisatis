#!/usr/bin/env python3
"""
Improved sitemap generator.
- Reads `react/src/assets/api_first.json` (same as old script)
- Groups products by `parent_category` (falls back to 'uncategorized')
- Generates per-category sitemaps (max 50000 urls per sitemap as per sitemap spec)
- Generates a sitemap index at `react/public/sitemap-index.xml` pointing to each category sitemap
- Writes both `react/public/` and `react/dist/` copies
- Keeps static root pages in a `pages` sitemap and includes that in the index

Usage: python generate_sitemap_improved.py https://example.com
"""
import json
import math
import os
import sys
from pathlib import Path
from urllib.parse import quote

MAX_URLS_PER_SITEMAP = 50000


def normalize_sku(s: str) -> str:
    if s is None:
        return ''
    s2 = str(s).strip()
    for ch in ['\u2010','\u2011','\u2012','\u2013','\u2014','\u2015','\u2212']:
        s2 = s2.replace(ch, '-')
    s2 = ' '.join(s2.split())
    while '--' in s2:
        s2 = s2.replace('--', '-')
    return s2


def slugify_for_url(s: str) -> str:
    # URL-encode and keep it safe for path segments
    return quote(s, safe='')


def write_file(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)


def build_pages_sitemap(domain: str, static_routes):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path,chg,pri in static_routes:
        lines.append('  <url>')
        lines.append(f'    <loc>{domain}{path}</loc>')
        lines.append(f'    <changefreq>{chg}</changefreq>')
        lines.append(f'    <priority>{pri}</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return '\n'.join(lines)


def build_urls_for_products(domain: str, products):
    # products: list of items with 'sku'
    lines = []
    for item in products:
        sku = item.get('sku')
        if not sku:
            continue
        ns = normalize_sku(sku)
        enc = slugify_for_url(ns)
        lines.append(f'    <url>\n      <loc>{domain}/urunler/{enc}</loc>\n      <changefreq>weekly</changefreq>\n      <priority>0.6</priority>\n    </url>')
    return lines


def build_sitemap_from_url_lines(url_lines):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    lines.extend(url_lines)
    lines.append('</urlset>')
    return '\n'.join(lines)


def build_sitemap_index(domain: str, sitemap_files):
    # sitemap_files: list of relative paths (e.g. sitemap-pages.xml, sitemap-category-A.xml)
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for sf in sitemap_files:
        lines.append('  <sitemap>')
        lines.append(f'    <loc>{domain}/{sf}</loc>')
        lines.append('  </sitemap>')
    lines.append('</sitemapindex>')
    return '\n'.join(lines)


def build_combined_sitemap(domain: str, static_routes, groups):
    # Build a single sitemap.xml containing static pages first, then product URLs grouped by category
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    # static pages
    for path, chg, pri in static_routes:
        lines.append('  <url>')
        lines.append(f'    <loc>{domain}{path}</loc>')
        lines.append(f'    <changefreq>{chg}</changefreq>')
        lines.append(f'    <priority>{pri}</priority>')
        lines.append('  </url>')

    # products grouped by category (as XML comments for readability)
    for category, items in sorted(groups.items()):
        cat_label = category if category else 'uncategorized'
        lines.append(f'  <!-- Category: {cat_label} ({len(items)} items) -->')
        for item in items:
            sku = item.get('sku')
            if not sku:
                continue
            ns = normalize_sku(sku)
            enc = slugify_for_url(ns)
            lines.append('  <url>')
            lines.append(f'    <loc>{domain}/urunler/{enc}</loc>')
            lines.append('    <changefreq>weekly</changefreq>')
            lines.append('    <priority>0.6</priority>')
            lines.append('  </url>')

    lines.append('</urlset>')
    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print('Usage: python generate_sitemap_improved.py https://your-domain.com')
        sys.exit(2)
    domain = sys.argv[1].rstrip('/')
    repo_root = Path(__file__).resolve().parents[1]
    src_json = repo_root / 'react' / 'src' / 'assets' / 'api_first.json'
    out_public_dir = repo_root / 'react' / 'public'
    out_dist_dir = repo_root / 'react' / 'dist'

    if not src_json.exists():
        print('api_first.json not found at', src_json)
        sys.exit(1)

    data = json.load(open(src_json, 'r', encoding='utf-8'))

    # group by parent_category
    groups = {}
    for item in data:
        parent = item.get('parent_category') or 'uncategorized'
        parent = parent.strip() if isinstance(parent, str) else 'uncategorized'
        groups.setdefault(parent, []).append(item)

    static_routes = [('/', 'daily', '1.0'), ('/urunler', 'daily', '0.8'), ('/iletisim','monthly','0.5'), ('/teknik-servis','monthly','0.5')]

    sitemap_files = []

    # pages sitemap
    pages_sitemap_name = 'sitemap-pages.xml'
    pages_content = build_pages_sitemap(domain, static_routes)
    write_file(out_public_dir / pages_sitemap_name, pages_content)
    write_file(out_dist_dir / pages_sitemap_name, pages_content)
    sitemap_files.append(pages_sitemap_name)

    # per-category sitemaps
    for category, items in sorted(groups.items()):
        # create a safe filename for category
        cat_safe = quote(category.replace(' ', '-'), safe='')
        urls_lines = build_urls_for_products(domain, items)
        # split into chunks if necessary
        if len(urls_lines) == 0:
            continue
        chunks = [urls_lines[i:i+MAX_URLS_PER_SITEMAP] for i in range(0, len(urls_lines), MAX_URLS_PER_SITEMAP)]
        for idx, chunk in enumerate(chunks, start=1):
            if len(chunks) == 1:
                filename = f'sitemap-category-{cat_safe}.xml'
            else:
                filename = f'sitemap-category-{cat_safe}-{idx}.xml'
            content = build_sitemap_from_url_lines(chunk)
            write_file(out_public_dir / filename, content)
            write_file(out_dist_dir / filename, content)
            sitemap_files.append(filename)

    # sitemap index
    index_content = build_sitemap_index(domain, sitemap_files)
    write_file(out_public_dir / 'sitemap-index.xml', index_content)
    write_file(out_dist_dir / 'sitemap-index.xml', index_content)

    # combined sitemap.xml (static pages + all products grouped by category)
    combined_content = build_combined_sitemap(domain, static_routes, groups)
    write_file(out_public_dir / 'sitemap.xml', combined_content)
    write_file(out_dist_dir / 'sitemap.xml', combined_content)

    # update robots.txt to point to index
    robots_content = f"User-agent: *\nAllow: /\nSitemap: {domain}/sitemap-index.xml\nSitemap: {domain}/sitemap.xml\n"
    write_file(out_public_dir / 'robots.txt', robots_content)

    print('Wrote', len(sitemap_files), 'sitemaps and sitemap-index.xml to:')
    print(out_public_dir)
    print(out_dist_dir)


if __name__ == '__main__':
    main()
