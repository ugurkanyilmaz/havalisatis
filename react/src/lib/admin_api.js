export async function adminInit(body = {}, baseUrl = '/api/admin_init.php') {
  const res = await fetch(baseUrl, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to init admin');
  return res.json();
}

export async function adminLogin(body = {}, baseUrl = '/api/admin_login.php') {
  const res = await fetch(baseUrl, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function adminLogout(baseUrl = '/api/admin_logout.php') {
  const res = await fetch(baseUrl, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export async function adminCheck(baseUrl = '/api/admin_check.php') {
  const res = await fetch(baseUrl, { credentials: 'include' });
  if (!res.ok) throw new Error('Check failed');
  return res.json();
}

export default { adminInit, adminLogin, adminLogout, adminCheck };
