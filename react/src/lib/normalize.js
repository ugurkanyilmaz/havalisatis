// Normalizes potentially messy image URLs into absolute, browser-loadable URLs
// Rules:
// - Trim and drop quotes
// - Keep http/https as-is
// - If starts with //, prefix current protocol (default https)
// - If looks like a bare domain/path (e.g., keten.s3... or example.com/foo.jpg), prefix https://
// - Otherwise return as-is
export function normalizeImageUrl(input) {
  if (!input) return null;
  let s = String(input).trim().replace(/&quot;|"/g, '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) {
    const proto = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'https:';
    return proto + s;
  }
  // Bare domain (allow dots and slashes, but not starting with /)
  if (/^[^\s\/]+\.[^\s\/]+/.test(s)) return 'https://' + s;
  return s;
}

// Helper: deduplicate image list by normalized URL (origin+pathname)
export function dedupeImageList(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list || []) {
    const u = normalizeImageUrl(raw);
    if (!u) continue;
    let key = u;
    try {
      const url = new URL(u);
      key = (url.origin + url.pathname).toLowerCase();
    } catch {
      key = u.split('?')[0].split('#')[0].toLowerCase();
    }
    if (!seen.has(key)) { seen.add(key); out.push(u); }
  }
  return out;
}
