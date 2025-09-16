import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const AuthContext = createContext(null);
const LS_ACCESS = 'auth:access';
const LS_REFRESH = 'auth:refresh';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function jsonFetch(url, options={}){
  const res = await fetch(url, { headers: { 'Content-Type':'application/json', ...(options.headers||{}) }, ...options });
  if(!res.ok){
    let detail;
    try { detail = (await res.json()).detail; } catch { /* noop */ }
    const err = new Error(detail || `HTTP ${res.status}`); err.status = res.status; throw err;
  }
  try { return await res.json(); } catch { return null; }
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(()=> localStorage.getItem(LS_ACCESS) || '');
  const refreshTokenRef = useRef(localStorage.getItem(LS_REFRESH) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveTokens = (access, refresh) => {
    if(access){ localStorage.setItem(LS_ACCESS, access); setAccessToken(access); }
    if(refresh){ localStorage.setItem(LS_REFRESH, refresh); refreshTokenRef.current = refresh; }
  };

  const clearTokens = () => {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    setAccessToken('');
    refreshTokenRef.current='';
  };

  const fetchMe = useCallback(async ()=>{
    if(!accessToken) return;
    try {
      const me = await jsonFetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
      setUser(me);
    } catch (e){
      if(e.status === 401 && refreshTokenRef.current){
        const refreshed = await refresh();
        if(refreshed){
          const me = await jsonFetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${refreshed}` } });
          setUser(me);
        }
      } else {
        setUser(null);
      }
    }
  }, [accessToken]);

  const login = useCallback(async (email, password)=>{
    setLoading(true); setError(null);
    try {
      const data = await jsonFetch(`${API_BASE}/auth/login`, { method:'POST', body: JSON.stringify({ email, password }) });
      saveTokens(data.access_token, data.refresh_token);
      await fetchMe();
      return true;
    } catch (e){ setError(e.message); return false; }
    finally { setLoading(false); }
  }, [fetchMe]);

  const refresh = useCallback(async ()=>{
    if(!refreshTokenRef.current) return null;
    try {
      const data = await jsonFetch(`${API_BASE}/auth/refresh`, { method:'POST', body: JSON.stringify({ refresh_token: refreshTokenRef.current }) });
      saveTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch { logout(); return null; }
  }, []);

  const logout = useCallback(async ()=>{
    try {
      if(refreshTokenRef.current && accessToken){
        await fetch(`${API_BASE}/auth/logout`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ refresh_token: refreshTokenRef.current }) });
      }
    } catch {/* ignore */}
    clearTokens();
    setUser(null);
  }, [accessToken]);

  useEffect(()=>{ fetchMe(); }, [fetchMe]);

  const value = {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    login,
    logout,
    refresh,
    fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if(!ctx) throw new Error('AuthContext not found');
  return ctx;
}
