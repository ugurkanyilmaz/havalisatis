const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(path, { method='GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    let detail = 'İstek başarısız';
    try { const data = await res.json(); if (data.detail) detail = data.detail; } catch {}
    const err = new Error(detail); err.status = res.status; throw err;
  }
  try { return await res.json(); } catch { return null; }
}

// Products
export const fetchProducts = (token, { q, skip=0, limit=50, category_id, category_path }={}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (skip) params.set('skip', skip);
  if (limit) params.set('limit', limit);
  if (category_id) params.set('category_id', category_id);
  if (category_path) params.set('category_path', category_path);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/products/${qs}`, { token });
};

export const fetchProductBySku = (sku) => request(`/products/by-sku/${encodeURIComponent(sku)}`);

// Categories
export const fetchCategories = (parent_id = null) => {
  const params = new URLSearchParams();
  if (parent_id !== null && parent_id !== undefined) params.set('parent_id', parent_id);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/categories/${qs}`);
};

// Analytics
export const logProductView = (sku) => request('/analytics/product-view', { method: 'POST', body: { sku } });
export const logProductClick = (sku) => request('/analytics/product-click', { method: 'POST', body: { sku } });
export const fetchPopularProducts = (limit = 8, metric = 'views') => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (metric) params.set('metric', metric);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/analytics/top-products${qs}`);
};
