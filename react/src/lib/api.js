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
export const fetchDiscountedProducts = (limit = 10, skip = 0) => {
  const params = new URLSearchParams();
  if (skip) params.set('skip', String(skip));
  if (limit) params.set('limit', String(limit));
  params.set('discounted_only', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/products/${qs}`);
};
export const createProduct = (token, data) => request('/products/', { method:'POST', body:data, token });
export const updateProduct = (token, id, data) => request(`/products/${id}`, { method:'PUT', body:data, token });
export const deleteProduct = (token, id) => request(`/products/${id}`, { method:'DELETE', token });
export const fetchProductBySku = (sku) => request(`/products/by-sku/${encodeURIComponent(sku)}`);

// Orders (admin)
export const listActiveOrders = (token) => request('/admin/orders/active', { token });
export const listCompletedOrders = (token) => request('/admin/orders/completed', { token });
export const completeOrder = (token, id) => request(`/admin/orders/${id}/complete`, { method:'POST', token });

export function calcDiscounted(price, discount_percent){
  if (!discount_percent && discount_percent !== 0) return price;
  return Math.round((price * (1 - discount_percent / 100)) * 100) / 100;
}

// Categories
export const fetchCategories = (parent_id = null) => {
  const params = new URLSearchParams();
  if (parent_id !== null && parent_id !== undefined) params.set('parent_id', parent_id);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/categories/${qs}`);
};

export const fetchCategoryById = (id) => {
  const params = new URLSearchParams();
  params.set('id', id);
  return request(`/categories/by-id?${params.toString()}`);
};

export const fetchCategoryByPath = (path) => {
  const params = new URLSearchParams();
  params.set('path', path);
  return request(`/categories/by-path?${params.toString()}`);
};

// Analytics
export const logPageView = (path) => request('/analytics/page-view', { method: 'POST', body: { path } });
export const logProductClick = (sku) => request('/analytics/product-click', { method: 'POST', body: { sku } });
export const logProductView = (sku) => request('/analytics/product-view', { method: 'POST', body: { sku } });
export const fetchPopularProducts = (limit = 8, metric = 'clicks') => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (metric) params.set('metric', metric);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/analytics/top-products${qs}`);
};
