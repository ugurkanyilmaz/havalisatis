import { Outlet, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../components/ketenlogoson.fw_.png';
import { SOCIAL_LINKS } from '../lib/socialLinks.js';

const nav = [
  { to:'/', label:'Ana Sayfa' },
  { to:'/urunler', label:'Ürünler' },
  { to:'/iletisim', label:'İletişim' },
  { to:'/teknik-servis', label:'Teknik Servis' },
  // Admin linki kaldırıldı
];

export default function Layout(){
  const { count } = useCart?.() || { count: 0 };
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.full_name || user?.email;
  return (
  <div className="min-h-[100svh] min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/60 border-b border-neutral-200/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center" aria-label="Keten Ana Sayfa">
              <img src={logo} alt="Keten Logo" className="h-10 md:h-12 lg:h-14 w-auto select-none transition-all" draggable={false} />
              <span className="sr-only">KETEN</span>
            </NavLink>
             <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium">
              {nav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `relative group transition font-medium ${isActive ? 'text-brand-orange' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        className={`absolute left-0 -bottom-1 h-[2px] rounded-full bg-gradient-to-r from-brand-orange to-orange-400 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden lg:flex items-center gap-3 pr-2 border-r border-neutral-300/60">
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="group p-1.5 rounded-md hover:bg-emerald-500/15 transition text-neutral-300 hover:text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.42-10 9.87 0 1.74.47 3.43 1.37 4.92L2 22l5.4-1.76c1.43.78 3.05 1.19 4.67 1.19h.01c5.52 0 10-4.42 10-9.87 0-2.64-1.07-5.12-3.02-6.99A10.55 10.55 0 0 0 12.04 2Zm5.88 14.19c-.25.7-1.46 1.33-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.11-1-.32-1.72-.63-3.03-1.31-5-4.37-5.15-4.58-.15-.21-1.23-1.64-1.23-3.13 0-1.48.78-2.2 1.06-2.5.28-.3.61-.37.82-.37.2 0 .4.01.57.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.21-.15.33-.3.51-.15.17-.31.39-.44.52-.15.15-.31.32-.13.63.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.54.31.15.49.13.67-.08.18-.21.77-.88.97-1.18.2-.3.41-.24.68-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.07.12.07.72-.18 1.42Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="group p-1.5 rounded-md hover:bg-pink-500/15 transition text-neutral-300 hover:text-pink-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-.88a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="group p-1.5 rounded-md hover:bg-red-500/15 transition text-neutral-300 hover:text-red-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10.5 15.02V8.98L15.5 12l-5 3.02Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="group p-1.5 rounded-md hover:bg-blue-600/15 transition text-neutral-300 hover:text-blue-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13.5 9H16l.5-3h-3V4.5c0-.966.196-1.5 1.5-1.5H16V0h-2.4C10.9 0 9.5 1.343 9.5 3.8V6H7v3h2.5v12h4V9Z"/></svg>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <NavLink to="/sepet" className="relative inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 transition">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
                Sepet
                <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-brand-orange text-white text-[10px]">{count}</span>
              </NavLink>
              {!isAuthenticated && <NavLink to="/login" className="text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 transition">Giriş</NavLink>}
              {!isAuthenticated && <NavLink to="/register" className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-orange text-white shadow hover:bg-orange-500 transition">Kayıt</NavLink>}
              {isAuthenticated && (
                <div className="relative group">
                  <button className="text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-100 transition inline-flex items-center gap-2">
                    <span className="inline-block max-w-[140px] truncate text-left">{displayName}</span>
                    <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <div className="absolute right-0 mt-1 w-44 rounded-lg border border-neutral-200 bg-white shadow-lg py-1 text-xs font-medium hidden group-hover:block z-50">
                    <span className="block px-3 py-2 text-neutral-500 truncate border-b border-neutral-100">{displayName}</span>
                    <button onClick={logout} className="w-full text-left px-3 py-2 hover:bg-neutral-100">Çıkış Yap</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
  <div className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-0"><Outlet /></div>
    </div>
  );
}
