// Request queue to prevent too many concurrent requests
const requestQueue = new Map();
const maxConcurrentRequests = 6; // Max 6 parallel requests
let activeRequests = 0;

// Queued fetch - prevents overwhelming the server
async function queuedFetch(url, options = {}) {
	// Check if same request is already in flight
	const cacheKey = url + JSON.stringify(options);
	if (requestQueue.has(cacheKey)) {
		return requestQueue.get(cacheKey);
	}

	// Wait if too many concurrent requests
	while (activeRequests >= maxConcurrentRequests) {
		await new Promise(resolve => setTimeout(resolve, 50));
	}

	activeRequests++;
	
	const promise = fetch(url, options)
		.finally(() => {
			activeRequests--;
			requestQueue.delete(cacheKey);
		});
	
	requestQueue.set(cacheKey, promise);
	return promise;
}

// Retry helper with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
	let lastError;
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const res = await queuedFetch(url, {
				...options,
				signal: AbortSignal.timeout(15000) // 15 second timeout
			});

			// Clone the response so multiple callers may consume the body
			// stream independently. queuedFetch may return the same Response
			// instance to multiple awaiting callers; calling res.json() more
			// than once on the same Response will fail with "body stream
			// already read". Returning a clone here gives each caller a
			// fresh readable stream.
			const resClone = res.clone();
			
			// If 429 (rate limit), wait and retry
			if (resClone.status === 429 && attempt < maxRetries) {
				const retryAfter = res.headers.get('Retry-After') || 30;
				console.warn(`Rate limited, waiting ${retryAfter}s... (attempt ${attempt}/${maxRetries})`);
				await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
				continue;
			}
			
			// If 503 (service unavailable) or 504 (timeout), retry
			if ((resClone.status === 503 || resClone.status === 504) && attempt < maxRetries) {
				const retryAfter = attempt * 2;
				console.warn(`API returned ${res.status}, retrying in ${retryAfter}s... (attempt ${attempt}/${maxRetries})`);
				await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
				continue;
			}
            
			return resClone;
		} catch (error) {
			lastError = error;
			
			// Don't retry on abort/timeout after max attempts
			if (attempt >= maxRetries) {
				break;
			}
			
			// Exponential backoff: 1s, 2s, 4s
			const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
			console.warn(`API request failed, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`, error.message);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	
	throw lastError || new Error('Max retries reached');
}

// API helper functions for product/category endpoints
import { normalizeImageUrl } from './normalize.js';

// Normalize backend v2 product shape to what the UI expects
function normalizeProduct(p) {
	if (!p || typeof p !== 'object') return p;
	const out = { ...p };

	// Map v2 fields to legacy/UI fields
	if (!out.description && out.product_description) out.description = out.product_description;
	if (!out.seo) {
		const seo = {};
		if (out.meta_title) seo.meta_title = out.meta_title;
		if (out.meta_description) seo.meta_description = out.meta_description;
		if (out.meta_keywords) seo.meta_keywords = out.meta_keywords;
		if (out.schema_description) seo.schema_description = out.schema_description;
		if (Object.keys(seo).length) out.seo = seo;
	}
	// Compose a simple category string if needed
	if (!out.category) {
		const pc = out.parent_category || '';
		const cc = out.child_category || '';
		const cat = [pc, cc].filter(Boolean).join(' / ');
		if (cat) out.category = cat;
	}

	// Coerce numeric fields to numbers when present
	if (out.list_price !== undefined && out.list_price !== null && out.list_price !== '') {
		const n = Number(out.list_price);
		if (!Number.isNaN(n)) out.list_price = n;
	}
	if (out.discount !== undefined && out.discount !== null && out.discount !== '') {
		const n = Number(out.discount);
		if (!Number.isNaN(n)) out.discount = n;
	}
	if (out.star_rating !== undefined && out.star_rating !== null && out.star_rating !== '') {
		const n = Number(out.star_rating);
		if (!Number.isNaN(n)) out.star_rating = n;
	}

	// Normalize image fields
	for (const k of ['main_img','img1','img2','img3','img4','img']) {
		if (out[k] !== undefined && out[k] !== null) {
			out[k] = normalizeImageUrl(out[k]);
		}
	}

	return out;
}
export async function fetchCategories(baseUrl = '/api/v2/categories.php') {
	const res = await fetchWithRetry(baseUrl);
	if (!res.ok) throw new Error('Failed to fetch categories');
	return res.json();
}

/**
 * Fetch tags. Returns an array of objects: { key: 'lowercased-key', label: 'Display Label' }
 */
export async function fetchTags(baseUrl = '/api/v2/tags.php') {
	const res = await fetchWithRetry(baseUrl);
	if (!res.ok) throw new Error('Failed to fetch tags');
	return res.json();
}

export async function fetchProducts({ parent, child, q, page = 1, per_page = 24 }, baseUrl = '/api/v2/products.php') {
	const params = new URLSearchParams();
	if (parent) params.set('parent', parent);
	if (child) params.set('child', child);
	if (q) params.set('q', q);
	params.set('page', page);
	params.set('per_page', per_page);

	const res = await fetchWithRetry(`${baseUrl}?${params.toString()}`);
	if (!res.ok) throw new Error('Failed to fetch products');
	const data = await res.json();
	// Normalize items if present
	if (data && Array.isArray(data.items)) {
		data.items = data.items.map(normalizeProduct);
	}
	return data;
}

export default { fetchCategories, fetchProducts };

export async function fetchHome(baseUrl = '/api/v2/home.php') {
	try {
		const res = await fetchWithRetry(baseUrl);
		if (!res.ok) throw new Error('Failed to fetch home lists');
		const data = await res.json();
		// Accept either raw {popular, specialPrices} or wrapped {success, data:{...}}
		if (data && data.success === true && data.data) {
			return data.data;
		}
		return data;
	} catch (err) {
		// Fallback: try static cache file if directly exposed by server
		try {
			const fallbackUrl = '/api/v2/cache/home.json';
			const r2 = await fetchWithRetry(fallbackUrl);
			if (r2.ok) {
				return await r2.json();
			}
		} catch (_) { /* ignore */ }
		throw err;
	}
}

// fetchRandomSlots removed (endpoint archived). If you need similar functionality,
// prefer server-side precomputed cache or a lightweight endpoint that returns
// prefiltered items to avoid expensive full-table scans.

// Fetch all products across pages (respects backend max per_page). Useful when we need the full list.
export async function fetchAllProducts({ parent, child, q } = {}, baseUrl = '/api/v2/products.php') {
	const MAX_PER_PAGE = 100; // v2 backend max per_page
	let page = 1;
	let total = 0;
	const items = [];
	// Hard safety caps
	const MAX_PAGES = 50;  // up to 5k items
	const MAX_ITEMS = 5000;

	while (page <= MAX_PAGES && items.length < MAX_ITEMS) {
		const res = await fetchProducts({ parent, child, q, page, per_page: MAX_PER_PAGE }, baseUrl);
		const chunk = Array.isArray(res.items) ? res.items : [];
		total = Number(res.total || total || 0);
		if (!chunk.length) break;
		// append avoiding duplicates by sku/id
		const existing = new Set(items.map(it => it.sku || it.id));
		for (const it of chunk) {
			const key = it.sku || it.id;
			if (!existing.has(key)) { items.push(it); existing.add(key); }
		}
		if (items.length >= total) break;
		page += 1;
	}

	return { total: total || items.length, items };
}

export async function fetchProductBySku(sku, baseUrl = '/api/v2/products.php') {
	if (!sku) throw new Error('SKU required');
	
	// Try direct SKU lookup first
	const skuParams = new URLSearchParams();
	skuParams.set('sku', sku);
	
	try {
		const res = await fetchWithRetry(`${baseUrl}?${skuParams.toString()}`);
		if (res.ok) {
			const data = await res.json();
			// backend sku lookup returns { product }
			if (data.product) {
				return { product: normalizeProduct(data.product), raw: data };
			}
		}
	} catch (err) {
		console.warn('SKU lookup failed, trying search fallback...', err.message);
	}
	
	// Fallback: use q= search
	const searchParams = new URLSearchParams();
	searchParams.set('q', sku);
	searchParams.set('per_page', 1);
	
	const res = await fetchWithRetry(`${baseUrl}?${searchParams.toString()}`);
	if (!res.ok) throw new Error('Failed to fetch product');
	
	const data = await res.json();
	// q= returns { items }
	const items = (data.items || []).map(normalizeProduct);
	const found = items.find(it => (it.sku || '').toString() === sku.toString()) || items[0] || null;
	if (!found) return { product: null, raw: data };

	// Fallback result lacks full fields (no description/features). Try to fetch full detail by SKU.
	try {
		const detailRes = await fetchWithRetry(`${baseUrl}?sku=${encodeURIComponent(found.sku || sku)}`);
		if (detailRes.ok) {
			const detailData = await detailRes.json();
			if (detailData && detailData.product) {
				// Merge found and detailed, prefer detailed fields
				const merged = normalizeProduct({ ...found, ...detailData.product });
				return { product: merged, raw: data };
			}
		}
	} catch (_) { /* ignore and return found */ }

	return { product: found, raw: data };
}
