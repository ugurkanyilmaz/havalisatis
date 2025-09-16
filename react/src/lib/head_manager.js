// Head manager for product detail pages
// Computes title/meta/OG/Twitter/JSON-LD and safely injects into <head>

// ------- Env defaults (Vite) -------
let ENV = {};
try {
  // import.meta is available in Vite ESM builds
  // eslint-disable-next-line no-undef
  ENV = import.meta.env || {};
} catch (_) {
  ENV = {};
}
const ENV_SITE_NAME = ENV.VITE_SITE_NAME ?? 'Havalı Satış';
const ENV_SITE_URL = ENV.VITE_SITE_URL ?? '';
const ENV_DEFAULT_LOCALE = ENV.VITE_DEFAULT_LOCALE ?? 'tr_TR';
const ENV_DEFAULT_CURRENCY = ENV.VITE_DEFAULT_CURRENCY ?? 'TRY';
const ENV_DEFAULT_ROBOTS = ENV.VITE_DEFAULT_ROBOTS ?? 'index, follow';
const ENV_TWITTER_SITE = ENV.VITE_TWITTER_SITE ?? undefined;
const ENV_TWITTER_CREATOR = ENV.VITE_TWITTER_CREATOR ?? undefined;

/* -------------------- Helpers -------------------- */
function getProductImages(p) {
  const list = [p?.main_img, p?.img1, p?.img2, p?.img3, p?.img4]
    .map((u) => (u && String(u).trim()) || null)
    .filter(Boolean);
  const normalize = (s) => {
    try {
      const url = new URL(s);
      return (url.origin + url.pathname).toLowerCase();
    } catch {
      return s.split('?')[0].split('#')[0].toLowerCase();
    }
  };
  const seen = new Set();
  const uniq = [];
  for (const u of list) {
    const key = normalize(u);
    if (!seen.has(key)) { seen.add(key); uniq.push(u); }
  }
  return uniq;
}

function collapseWhitespace(s) {
  return String(s || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function truncate(s, max = 160) {
  const text = collapseWhitespace(s);
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

function getCurrentUrl() {
  try {
    return window.location.href;
  } catch {
    return '';
  }
}

function buildCanonical(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Remove fragments and tracking params
    u.hash = '';
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach((q) => u.searchParams.delete(q));
    return u.toString();
  } catch {
    return url;
  }
}

function canonicalFromEnv(currentUrl) {
  // Prefer building canonical from configured SITE_URL + current path
  const base = String(ENV_SITE_URL || '').trim();
  if (!base) return buildCanonical(currentUrl || '');
  try {
    const hasWindow = typeof window !== 'undefined' && window.location;
    const path = hasWindow ? window.location.pathname : (new URL(currentUrl)).pathname;
    const canonical = base.replace(/\/$/, '') + path;
    return buildCanonical(canonical);
  } catch {
    return buildCanonical(base);
  }
}

function composeTitle(base, siteName, maxTotal = 60) {
  const suffix = siteName ? ` | ${siteName}` : '';
  const allowedBase = Math.max(10, maxTotal - suffix.length);
  const safeBase = truncate(base || '', allowedBase);
  return (safeBase || siteName || '') + suffix;
}

function formatPrice(price, currency = 'TRY', locale = 'tr-TR') {
  try {
    const n = Number(price);
    if (!isFinite(n)) return undefined;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
  } catch {
    return undefined;
  }
}

function availabilityText(avail) {
  if (avail === 'https://schema.org/OutOfStock') return 'Stokta yok';
  return 'Stokta';
}

function parseFeatures(product) {
  const keys = Array.from({ length: 8 }, (_, i) => `feature${i + 1}`);
  const items = [];
  for (const k of keys) {
    const raw = product?.[k];
    if (!raw) continue;
    const str = String(raw).trim();
    if (!str) continue;
    const parts = str.split(':');
    const name = parts.shift()?.trim();
    const value = parts.join(':').trim();
    if (name) items.push({ name, value });
  }
  return items;
}

/* -------------------- Builders -------------------- */
export function buildProductHead(product, options = {}) {
  const {
    siteName = ENV_SITE_NAME,
    brandFallback = 'Havalı',
    currency = ENV_DEFAULT_CURRENCY,
    locale = ENV_DEFAULT_LOCALE,
    twitterSite = ENV_TWITTER_SITE, // e.g. '@havalisa...' (ASCII)
    twitterCreator = ENV_TWITTER_CREATOR, // e.g. '@brand_owner'
    robots = ENV_DEFAULT_ROBOTS,
  } = options;

  const p = product || {};
  const images = getProductImages(p);
  const primaryImage = images[0] || null;
  const baseTitle = p?.seo?.meta_title || p?.title || p?.sku || siteName;
  const title = composeTitle(baseTitle, siteName, 60);
  const description = p?.seo?.meta_description || p?.description || '';
  const metaDescription = truncate(description, 170);
  const schemaDescription = truncate(p?.seo?.schema_description || description || '', 220);
  const url = getCurrentUrl();
  const canonical = canonicalFromEnv(url);
  const brandName = p?.brand || '';
  const keywords = p?.seo?.keywords || collapseWhitespace(`${brandName || brandFallback} ${p?.sku || ''} havalı aletler endüstriyel`).trim();
  const imgAlt = p?.title || p?.sku || siteName;
  const updatedTime = p?.updated_at ? new Date(p.updated_at).toISOString() : undefined;
  const availability = typeof p?.stock === 'number' && p.stock <= 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
  const availabilityHuman = availabilityText(availability);
  const formattedPrice = formatPrice(p?.price, currency, locale.replace('_','-'));
  const features = parseFeatures(p);
  const featureKeywords = features.slice(0, 3).map((f) => collapseWhitespace(f.name)).filter(Boolean).join(', ');
  const mergedKeywords = collapseWhitespace([keywords, featureKeywords].filter(Boolean).join(', '));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': canonical ? `${canonical}#product` : undefined,
    name: p?.title || p?.sku || baseTitle,
    image: images.length ? images : undefined,
    description: schemaDescription || undefined,
    sku: p?.sku || undefined,
    url: canonical || undefined,
    category: p?.category || undefined,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    additionalProperty: features.length ? features.map((f) => ({ '@type': 'PropertyValue', name: f.name, value: f.value })) : undefined,
    offers: {
      '@type': 'Offer',
      url: canonical || url || undefined,
      priceCurrency: currency,
      price: p?.price != null ? String(p.price) : undefined,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  // Add a minimal breadcrumb list (Home > Ürünler > Product)
  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: (ENV_SITE_URL || (canonical ? new URL(canonical).origin : undefined)) || undefined },
      { '@type': 'ListItem', position: 2, name: 'Ürünler', item: (ENV_SITE_URL ? ENV_SITE_URL.replace(/\/$/, '') + '/urunler' : (canonical ? new URL(canonical).origin + '/urunler' : undefined)) },
      { '@type': 'ListItem', position: 3, name: p?.title || p?.sku || 'Ürün', item: canonical || undefined },
    ],
  };

  return {
    title,
    meta: [
      { name: 'description', content: metaDescription || `${siteName} - Profesyonel aletler ve endüstriyel çözümler` },
      { name: 'keywords', content: mergedKeywords },
      { name: 'author', content: siteName },
      { name: 'robots', content: robots },
      { name: 'googlebot', content: 'max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      // App/browser hints
      { name: 'theme-color', content: '#ffffff' },
      // OpenGraph
      { property: 'og:type', content: 'product' },
      { property: 'og:title', content: p?.seo?.og_title || baseTitle || siteName },
      { property: 'og:description', content: metaDescription || `${siteName} - Profesyonel aletler ve endüstriyel çözümler` },
      { property: 'og:site_name', content: siteName },
      { property: 'og:url', content: canonical || url || undefined },
      { property: 'og:locale', content: locale },
      updatedTime ? { property: 'og:updated_time', content: updatedTime } : null,
      // Images (include multiple)
      ...images.slice(0, 3).map((src) => ({ property: 'og:image', content: src })),
      primaryImage ? { property: 'og:image:alt', content: imgAlt } : null,
      // Product OG specifics
      p?.brand ? { property: 'product:brand', content: p.brand } : null,
      p?.category ? { property: 'product:category', content: p.category } : null,
      p?.sku ? { property: 'product:retailer_part_no', content: p.sku } : null,
      p?.price != null ? { property: 'product:price:amount', content: String(p.price) } : null,
      { property: 'product:price:currency', content: currency },
      { property: 'product:availability', content: availability },
      { property: 'product:condition', content: 'new' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      twitterSite ? { name: 'twitter:site', content: twitterSite } : null,
      twitterCreator ? { name: 'twitter:creator', content: twitterCreator } : null,
      { name: 'twitter:title', content: p?.seo?.og_title || baseTitle || siteName },
      { name: 'twitter:description', content: metaDescription || `${siteName} - Profesyonel aletler ve endüstriyel çözümler` },
      primaryImage ? { name: 'twitter:image', content: primaryImage } : null,
      primaryImage ? { name: 'twitter:image:alt', content: imgAlt } : null,
      // Twitter data badges
      formattedPrice ? { name: 'twitter:label1', content: 'Fiyat' } : null,
      formattedPrice ? { name: 'twitter:data1', content: formattedPrice } : null,
      availabilityHuman ? { name: 'twitter:label2', content: 'Durum' } : null,
      availabilityHuman ? { name: 'twitter:data2', content: availabilityHuman } : null,
      features[0]?.name ? { name: 'twitter:label3', content: features[0].name } : null,
      features[0]?.value ? { name: 'twitter:data3', content: features[0].value } : null,
      features[1]?.name ? { name: 'twitter:label4', content: features[1].name } : null,
      features[1]?.value ? { name: 'twitter:data4', content: features[1].value } : null,
    ].filter(Boolean),
    link: [
      canonical ? { rel: 'canonical', href: canonical } : null,
    ].filter(Boolean),
    jsonLd: [jsonLd, breadcrumbsLd],
  };
}

/* -------------------- DOM Applier -------------------- */
function ensureDocument() {
  return typeof document !== 'undefined' && document.head;
}

function removeManagedTags(key) {
  if (!ensureDocument()) return;
  const sel = `[data-hs="${key}"]`;
  document.head.querySelectorAll(sel).forEach((el) => el.remove());
}

function createTag(tagName, attrs, key, textContent) {
  const el = document.createElement(tagName);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v != null && v !== '') el.setAttribute(k, String(v));
  }
  el.setAttribute('data-hs', key);
  if (textContent != null) el.textContent = textContent;
  return el;
}

export function applyHead(headConfig, options = {}) {
  const { managerKey = 'product-head' } = options;
  if (!ensureDocument() || !headConfig) return;

  // Clear previous managed nodes
  removeManagedTags(managerKey);

  // Title
  if (headConfig.title) {
    document.title = headConfig.title;
  }

  // Meta
  for (const m of headConfig.meta || []) {
    const attrs = {};
    if (m.name) attrs.name = m.name;
    if (m.property) attrs.property = m.property;
    if (m.content != null && m.content !== '') attrs.content = m.content;
    if (Object.keys(attrs).length) {
      const el = createTag('meta', attrs, managerKey);
      document.head.appendChild(el);
    }
  }

  // Link
  for (const l of headConfig.link || []) {
    const attrs = { ...l };
    const el = createTag('link', attrs, managerKey);
    document.head.appendChild(el);
  }

  // JSON-LD
  for (const obj of headConfig.jsonLd || []) {
    const el = createTag('script', { type: 'application/ld+json' }, managerKey, JSON.stringify(obj));
    document.head.appendChild(el);
  }
}

export function clearHead(options = {}) {
  const { managerKey = 'product-head' } = options;
  removeManagedTags(managerKey);
}

export function setProductHead(product, options = {}) {
  const head = buildProductHead(product, options);
  applyHead(head, options);
  return head;
}

export default {
  buildProductHead,
  applyHead,
  clearHead,
  setProductHead,
};
