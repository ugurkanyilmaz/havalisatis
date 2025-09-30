// API helper functions for product/category endpoints
export async function fetchCategories(baseUrl = '/php/categories.php') {
	const res = await fetch(baseUrl);
	if (!res.ok) throw new Error('Failed to fetch categories');
	return res.json();
}

/**
 * Fetch tags. Returns an array of objects: { key: 'lowercased-key', label: 'Display Label' }
 */
export async function fetchTags(baseUrl = '/php/tags.php') {
	const res = await fetch(baseUrl);
	if (!res.ok) throw new Error('Failed to fetch tags');
	return res.json();
}

export async function fetchProducts({ parent, child, q, page = 1, per_page = 24 }, baseUrl = '/php/products.php') {
	const params = new URLSearchParams();
	if (parent) params.set('parent', parent);
	if (child) params.set('child', child);
	if (q) params.set('q', q);
	params.set('page', page);
	params.set('per_page', per_page);

	const res = await fetch(`${baseUrl}?${params.toString()}`);
	if (!res.ok) throw new Error('Failed to fetch products');
	return res.json();
}

export default { fetchCategories, fetchProducts };

export async function fetchHome(baseUrl = '/php/home.php') {
	const res = await fetch(baseUrl);
	if (!res.ok) throw new Error('Failed to fetch home lists');
	return res.json();
}

export async function fetchProductBySku(sku, baseUrl = '/php/products.php') {
	if (!sku) throw new Error('SKU required');
	const params = new URLSearchParams();
	// prefer direct sku lookup (backend returns full product), fall back to q= search
	params.set('sku', sku);
	let res = await fetch(`${baseUrl}?${params.toString()}`);
	if (!res.ok) {
		// try fallback q= search
		params.delete('sku');
		params.set('q', sku);
		params.set('per_page', 1);
		res = await fetch(`${baseUrl}?${params.toString()}`);
	}
	if (!res.ok) throw new Error('Failed to fetch product');
	const data = await res.json();
	// backend sku lookup returns { product }, while q= returns { items }
	if (data.product) return { product: data.product, raw: data };
	const items = data.items || [];
	const found = items.find(it => (it.sku || '').toString() === sku.toString()) || items[0] || null;
	return { product: found, raw: data };
}
