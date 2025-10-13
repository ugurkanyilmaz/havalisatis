/* -------------------- Environment & Helpers -------------------- */
// Vite env erişimi (import.meta.env) üzerinden; undefined ise güvenli default.
const VENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
export const ENV_SITE_NAME = VENV.VITE_SITE_NAME || 'Havalı Endüstri';
// Site URL: prefer explicit env; if missing, default to live domain (never localhost) to avoid leaking dev URLs
const runtimeOrigin = (typeof window !== 'undefined') ? window.location.origin : '';
const isLocalhost = runtimeOrigin.includes('localhost') || runtimeOrigin.startsWith('http://127.0.0.1') || runtimeOrigin.startsWith('http://0.0.0.0');
const PROD_FALLBACK = 'https://havalielaletlerisatis.com';
export const ENV_SITE_URL = (VENV.VITE_SITE_URL && String(VENV.VITE_SITE_URL).replace(/\/$/, ''))
  || (!isLocalhost && runtimeOrigin ? runtimeOrigin.replace(/\/$/, '') : PROD_FALLBACK);
export const ENV_DEFAULT_CURRENCY = VENV.VITE_DEFAULT_CURRENCY || 'TRY';
export const ENV_DEFAULT_LOCALE = VENV.VITE_DEFAULT_LOCALE || 'tr-TR';
export const ENV_TWITTER_SITE = VENV.VITE_TWITTER_SITE || '@site';
export const ENV_TWITTER_CREATOR = VENV.VITE_TWITTER_CREATOR || '@creator';
export const ENV_DEFAULT_ROBOTS = VENV.VITE_DEFAULT_ROBOTS || 'index,follow';
// Read GA ID from env. If it's empty or still the placeholder 'CHANGE_ME', treat as not configured (null)
const rawGa = VENV.VITE_GA_ID ? String(VENV.VITE_GA_ID).trim() : '';
export const ENV_GA_ID = (rawGa && rawGa.toUpperCase() !== 'CHANGE_ME') ? rawGa : null;

// Utility: truncate
function truncate(str, max){
  if(!str) return '';
  const s = String(str).trim();
  if(s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// Compose title with site name
function composeTitle(base, site, limit=60){
  const t = base && site ? `${base} | ${site}` : (base || site || '');
  return truncate(t, limit);
}

// Current URL helper
function getCurrentUrl(){
  if (typeof window === 'undefined') return ENV_SITE_URL;
  return window.location.href;
}

function canonicalFromEnv(url){
  try {
    if(!url) return null;
    // Don't produce canonical with localhost base; require a non-local ENV_SITE_URL
    const base = ENV_SITE_URL || '';
    if (!base || base.includes('localhost') || base.startsWith('http://127.0.0.1') || base.startsWith('http://0.0.0.0')) {
      return null;
    }
    const u = new URL(url);
    return base + u.pathname + u.search;
  } catch { return null; }
}

// Make a URL absolute using ENV_SITE_URL when needed (for og:image, JSON-LD images, etc.)
function toAbsoluteUrl(u){
  if(!u) return u;
  const s = String(u).trim();
  if(!s) return s;
  if(/^https?:\/\//i.test(s)) return s; // already absolute
  if(s.startsWith('//')) return (ENV_SITE_URL.startsWith('https') ? 'https:' : 'http:') + s;
  if(s.startsWith('/')) return ENV_SITE_URL.replace(/\/$/, '') + s;
  return s;
}

function getProductImages(p){
  if(!p) return [];
  const list = [p.main_img, p.img1, p.img2, p.img3, p.img4]
    .map(u => (u && String(u).trim()) || null)
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const img of list){
    const key = img.split('?')[0];
    if(!seen.has(key)){ seen.add(key); out.push(img); }
  }
  return out;
}

function parseFeatures(p){
  if(!p) return [];
  const keys = Array.from({length: 12}, (_,i)=>`feature${i+1}`);
  return keys.map(k => p[k]).filter(Boolean).map(raw => {
    const txt = String(raw);
    const [name, ...rest] = txt.split(':');
    return { name: name.trim(), value: rest.join(':').trim() };
  });
}

function availabilityText(schema){
  if(schema && schema.includes('OutOfStock')) return 'Stokta Yok';
  return 'Stokta';
}

// Build meta keywords from product fields and technical features
function buildKeywords(product, features){
  try {
    const p = product || {};
    const set = new Set();
    const add = (v) => { if(!v) return; const s = String(v).trim(); if(s && s.length > 1) set.add(s); };
    // Base fields
    add(p?.title);
    add(p?.seo?.meta_title);
    add(p?.sku);
    add(p?.brand);
    add(p?.category);
    // Features: name, value, and combined
    (features || []).forEach(f => {
      add(f.name);
      add(f.value);
      add(`${f.name} ${f.value}`);
    });
    // Limit number of tokens to avoid bloat
    const list = Array.from(set).slice(0, 30);
    const joined = list.join(', ');
    return truncate(joined, 250);
  } catch { return ''; }
}

/* -------------------- Builders -------------------- */
export function buildProductHead(product, options = {}) {
  const {
    siteName = ENV_SITE_NAME,
    brandFallback = 'Havalı',
    currency = ENV_DEFAULT_CURRENCY,
    locale = ENV_DEFAULT_LOCALE,
    twitterSite = ENV_TWITTER_SITE,
    twitterCreator = ENV_TWITTER_CREATOR,
    robots = ENV_DEFAULT_ROBOTS,
  analyticsId = ENV_GA_ID // Google Analytics 4 ölçüm kimliği (env üzerinden)
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
  const imgAlt = p?.title || p?.sku || siteName;
  const updatedTime = p?.updated_at ? new Date(p.updated_at).toISOString() : undefined;
  const availability = typeof p?.stock === 'number' && p.stock <= 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
  const availabilityHuman = availabilityText(availability);
  const features = parseFeatures(p);
  // Prefer explicit meta_keywords from SEO payload; fallback to auto-built keywords
  const keywords = (p?.seo && p.seo.meta_keywords) ? String(p.seo.meta_keywords).trim() : buildKeywords(p, features);
  const localeNormalized = (locale || 'tr-TR').replace('_','-');
  const ogImage = toAbsoluteUrl(primaryImage || (images.length ? images[0] : undefined));
  const twitterCard = ogImage ? 'summary_large_image' : 'summary';

  // Price computation: mirror UI logic (list_price + discount)
  const listPrice = (p && p.list_price) ? Number(p.list_price) : null;
  const discountPct = (p && p.discount) ? Number(p.discount) : 0;
  // Use discounted price (if discount exists), otherwise list price
  const discountedPrice = listPrice && discountPct > 0 ? Math.round((listPrice * (100 - discountPct)) / 100) : null;
  // Only expose a price when there is an actual discount (user requested)
  const priceToUse = (typeof discountedPrice === 'number' && !Number.isNaN(discountedPrice)) ? discountedPrice : null;
  // Force currency label for metadata to TL when price present; use TRY in JSON-LD per request
  const priceCurrencyForMeta = priceToUse !== null ? 'TL' : currency;
  const priceCurrencyForJsonLd = priceToUse !== null ? 'TRY' : currency;

  // Product Schema
  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': canonical ? `${canonical}#product` : undefined,
    name: p?.title || p?.sku || baseTitle,
    image: images.length ? images.map(toAbsoluteUrl) : undefined,
    description: schemaDescription || undefined,
    sku: p?.sku || undefined,
    url: canonical || undefined,
    category: p?.category || undefined,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    additionalProperty: features.length
      ? features.map((f) => ({ '@type': 'PropertyValue', name: f.name, value: f.value }))
      : undefined,
    offers: {
      '@type': 'Offer',
      url: canonical || url || undefined,
      priceCurrency: priceToUse !== null ? priceCurrencyForJsonLd : currency,
      price: priceToUse !== null ? String(priceToUse) : undefined,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  // Breadcrumb Schema
  const jsonLdBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: ENV_SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Ürünlerimiz', item: ENV_SITE_URL + '/urunler' },
      { '@type': 'ListItem', position: 3, name: p?.title || p?.sku || 'Ürün', item: canonical || (ENV_SITE_URL + (new URL(url).pathname)) },
    ],
  };

  // Organization Schema
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ENV_SITE_URL + '#organization',
    name: siteName,
    url: ENV_SITE_URL,
  // Use the actual site logo location
  logo: ENV_SITE_URL + '/weblogo.jpg',
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: '+90-532-000-0000',
      contactType: 'sales',
      availableLanguage: ['tr']
    }]
  };

  // Website Schema
  const jsonLdWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ENV_SITE_URL + '#website',
    url: ENV_SITE_URL,
    name: siteName,
    publisher: { '@id': ENV_SITE_URL + '#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: ENV_SITE_URL + '/?s={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return {
    title,
    meta: [
      { httpEquiv: 'content-language', content: localeNormalized.split('-')[0] },
      { name: 'description', content: metaDescription || `${siteName} - Profesyonel aletler ve endüstriyel çözümler` },
      keywords ? { name: 'keywords', content: keywords } : null,
      { name: 'author', content: siteName },
      { name: 'robots', content: robots },
      { name: 'googlebot', content: 'max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'theme-color', content: '#ffffff' },
      // Open Graph
      { property: 'og:locale', content: localeNormalized },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'product' },
      canonical ? { property: 'og:url', content: canonical } : null,
      title ? { property: 'og:title', content: title } : null,
      metaDescription ? { property: 'og:description', content: metaDescription } : null,
      ogImage ? { property: 'og:image', content: ogImage } : null,
      ogImage ? { property: 'og:image:alt', content: imgAlt } : null,
      // Twitter
      { name: 'twitter:card', content: twitterCard },
      twitterSite ? { name: 'twitter:site', content: twitterSite } : null,
      twitterCreator ? { name: 'twitter:creator', content: twitterCreator } : null,
      title ? { name: 'twitter:title', content: title } : null,
      metaDescription ? { name: 'twitter:description', content: metaDescription } : null,
      ogImage ? { name: 'twitter:image', content: ogImage } : null,
      ogImage ? { name: 'twitter:image:alt', content: imgAlt } : null,
      // Product micro meta (non critical but helpful)
      brandName ? { name: 'product:brand', content: brandName } : null,
      p?.sku ? { name: 'product:sku', content: p.sku } : null,
  availabilityHuman ? { name: 'product:availability', content: availabilityHuman } : null,
  // Price metas (if available)
  priceToUse !== null ? { name: 'product:price:amount', content: String(priceToUse) } : null,
  priceToUse !== null ? { name: 'product:price:currency', content: priceCurrencyForMeta } : null,
  priceToUse !== null ? { property: 'og:price:amount', content: String(priceToUse) } : null,
  priceToUse !== null ? { property: 'og:price:currency', content: priceCurrencyForMeta } : null,
      updatedTime ? { name: 'article:modified_time', content: updatedTime } : null,
    ].filter(Boolean),
    link: [
      canonical ? { rel: 'canonical', href: canonical } : null,
    ].filter(Boolean),
    jsonLd: [jsonLdProduct, jsonLdBreadcrumbs, jsonLdOrg, jsonLdWebsite],
    analytics: analyticsId ? `
      <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analyticsId}', { anonymize_ip: true });
      </script>` : null
  };
}

/* -------------------- DOM Appliers -------------------- */
const MANAGED_ATTR = 'data-head-managed';
const MANAGED_VALUE = 'keten';

function removeManaged() {
  if (typeof document === 'undefined') return;
  const sel = `head [${MANAGED_ATTR}="${MANAGED_VALUE}"]`;
  document.querySelectorAll(sel).forEach(el => el.remove());
}

export function clearHead() {
  removeManaged();
}

export function setProductHead(product, options = {}) {
  if (typeof document === 'undefined') return;
  const cfg = buildProductHead(product, options) || {};
  // Title
  if (cfg.title) document.title = cfg.title;
  // Clear previous managed elements
  removeManaged();

  const head = document.head;

  // Meta tags
  (cfg.meta || []).forEach(m => {
    if (!m || !m.content) return;
    // Duplicate check (by name/property + content)
    const keyAttr = m.name ? 'name' : (m.property ? 'property' : null);
    if (keyAttr) {
      const selector = `meta[${keyAttr}="${(m.name||m.property).replace(/"/g,'')}"]`;
      const existing = head.querySelector(selector);
      if (existing) existing.remove();
    }
    const meta = document.createElement('meta');
    if (m.name) meta.setAttribute('name', m.name);
    if (m.property) meta.setAttribute('property', m.property);
    if (m.httpEquiv) meta.setAttribute('http-equiv', m.httpEquiv);
    meta.setAttribute('content', m.content);
    meta.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    head.appendChild(meta);
  });

  // Links (e.g., canonical)
  (cfg.link || []).forEach(l => {
    if (!l || !l.rel || !l.href) return;
    const link = document.createElement('link');
    link.setAttribute('rel', l.rel);
    link.setAttribute('href', l.href);
    link.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    head.appendChild(link);
  });

  // JSON-LD scripts
  (cfg.jsonLd || []).filter(Boolean).forEach(obj => {
    try {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(obj);
      script.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
      head.appendChild(script);
    } catch {
      /* ignore */
    }
  });

  // Analytics snippet (basic GA4) - insert only once
  if (cfg.analytics && !document.getElementById('ga4-snippet')) {
    const frag = document.createElement('div');
    frag.innerHTML = cfg.analytics.trim();
    Array.from(frag.children).forEach(child => {
      if (child.tagName === 'SCRIPT') {
        // Re-create script to ensure execution
        const s = document.createElement('script');
        for (const attr of child.getAttributeNames()) {
          s.setAttribute(attr, child.getAttribute(attr));
        }
        s.text = child.text;
        s.id = child.src ? '' : 'ga4-snippet';
        s.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
        head.appendChild(s);
      }
    });
  }

  return cfg;
}

/* -------------------- Generic / Home Head -------------------- */
export function setHomeHead(options = {}) {
  if (typeof document === 'undefined') return;
  const {
    title = ENV_SITE_NAME,
    description = `${ENV_SITE_NAME} – Profesyonel ve endüstriyel pnömatik el aletleri, dayanıklılık ve ergonomi odaklı çözümler.`,
    image,
    locale = ENV_DEFAULT_LOCALE,
    robots = ENV_DEFAULT_ROBOTS,
  } = options;
  removeManaged();
  const head = document.head;
  const fullTitle = title === ENV_SITE_NAME ? title : `${title} | ${ENV_SITE_NAME}`;
  document.title = fullTitle;
  const loc = (locale || 'tr-TR').replace('_','-');
  const url = (typeof window !== 'undefined') ? window.location.href : ENV_SITE_URL;
  const canonical = url ? canonicalFromEnv(url) : null;
  const metas = [
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { name: 'googlebot', content: 'max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
    { property: 'og:locale', content: loc },
    { property: 'og:site_name', content: ENV_SITE_NAME },
    { property: 'og:type', content: 'website' },
    canonical ? { property: 'og:url', content: canonical } : null,
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    image ? { property: 'og:image', content: image } : null,
    image ? { property: 'og:image:alt', content: ENV_SITE_NAME } : null,
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    image ? { name: 'twitter:image', content: image } : null,
  ].filter(Boolean);
  metas.forEach(m => {
    if(!m.content) return;
    const el = document.createElement('meta');
    if (m.name) el.setAttribute('name', m.name);
    if (m.property) el.setAttribute('property', m.property);
    el.setAttribute('content', m.content);
    el.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    head.appendChild(el);
  });
  if (canonical){
    const link = document.createElement('link');
    link.setAttribute('rel','canonical');
    link.setAttribute('href', canonical);
    link.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    head.appendChild(link);
  }
  // Add minimal Organization schema only once on home
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ENV_SITE_NAME,
    url: ENV_SITE_URL,
    logo: ENV_SITE_URL + '/weblogo.jpg'
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(orgSchema);
  script.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
  head.appendChild(script);
}

