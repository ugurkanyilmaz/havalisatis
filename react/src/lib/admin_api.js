export async function adminLogin(body = {}, baseUrl = '/api/v2/admin.php?action=login') {
  const res = await fetch(baseUrl, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function adminLogout(baseUrl = '/api/v2/admin.php?action=logout') {
  const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export async function adminCheck(baseUrl = '/api/v2/admin.php?action=check') {
  const res = await fetch(baseUrl, { credentials: 'include' });
  if (!res.ok) throw new Error('Check failed');
  return res.json();
}

export async function adminRefreshHome(baseUrl = '/api/v2/admin.php?action=refresh_home') {
  const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function adminClearCache(baseUrl = '/api/v2/admin.php?action=clear_cache') {
  const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Clear cache failed');
  return res.json();
}

export default { adminLogin, adminLogout, adminCheck, adminRefreshHome, adminClearCache };
