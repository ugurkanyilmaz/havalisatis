import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../components/ketenlogoson.fw_.png';
import ProtectedImage from '../components/ProtectedImage.jsx';
import { SOCIAL_LINKS } from '../lib/socialLinks.js';
import { useEffect, useState, useRef } from 'react';
import { fetchProducts } from '../lib/api_calls.js';
// Backend API removed — search suggestions unavailable

const nav = [
  { to:'/', label:'Ana Sayfa' },
  { to:'/urunler', label:'Ürünlerimiz' },
  { to:'/teknik-servis', label:'Teknik Servis' },
  { to:'/iletisim', label:'İletişim' },
];

export default function Layout(){
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Helper: scroll to top smoothly, accounting for fixed header
  const scrollToTop = (opts = { behavior: 'smooth' }) => {
    try { window.scrollTo({ top: 0, ...opts }); } catch { window.scrollTo(0,0); }
  };
  
  // analytics removed: page view logging omitted

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const data = await fetchProducts({ q: searchQuery, per_page: 8 });
          // backend returns { items: [], total }
          setSearchResults((data && data.items) ? data.items : []);
        } catch (err) {
          setSearchResults([]);
        } finally {
          setShowDropdown(true);
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Disable right-click (context menu) on product images marked with `.no-download`
  useEffect(() => {
    const onContextMenu = (e) => {
      const target = e.target;
      // If the target is an image with the no-download marker, prevent context menu
      if (target && target.tagName === 'IMG' && (target.classList.contains('no-download') || target.closest?.('.no-download'))) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
  // Ürünler sayfasına yönlendir ve arama parametresi ekle
  // Use consistent base path without trailing slash
  const base = '/urunler'
  navigate(`${base}?q=${encodeURIComponent(trimmed)}`);
      // Ensure immediate scroll to top so user sees the top of product results
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0,0); }
      setSearchQuery(''); // Search bar'ı temizle
      setShowDropdown(false);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/urunler/${encodeURIComponent(product.sku)}`);
    setSearchQuery('');
    setShowDropdown(false);
  };
  return (
  <div className="min-h-[100svh] min-h-[100dvh] flex flex-col">
  <header className="sticky top-0 z-40 bg-black/30 backdrop-blur-lg border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Sol: Logo ve Navigasyon */}
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="flex items-center"
              aria-label="Keten Ana Sayfa"
              onClick={(e) => {
                // If already on the home route, prevent router navigation and smooth-scroll to top.
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToTop({ behavior: 'smooth' });
                }
                // Otherwise let NavLink navigate normally and the route's effect will handle scroll if needed.
              }}
            >
              <img src={logo} alt="Keten Logo" className="h-8 md:h-10 lg:h-12 w-auto select-none transition-all" />
              <span className="sr-only">KETEN</span>
            </NavLink>
            {/* Mobile inline nav removed — moved to hamburger menu. */}
            <nav className="hidden" />
             <nav className="hidden md:flex items-center gap-4 text-[14px] font-semibold">
              {nav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `relative group transition-all px-2 py-1 rounded ${isActive ? 'text-white bg-white/20 shadow-lg backdrop-blur-sm' : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'}`}
                  onClick={(e) => {
                    // Use programmatic navigation so we can guarantee scrolling to top on first click.
                    e.preventDefault();
                    // If already on the same route, just scroll to top
                    if (location.pathname === item.to) {
                      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0,0); }
                      setMobileMenuOpen(false);
                      return;
                    }
                    // Navigate and then scroll to top to ensure we land at top of new page
                    navigate(item.to);
                    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0,0); }
                    setMobileMenuOpen(false);
                  }}
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

          {/* Orta: Sosyal Medya İkonları */}
          <div className="flex-1 flex justify-center">
            <div className="hidden lg:flex items-center gap-3">
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all shadow-lg backdrop-blur-sm border border-emerald-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.42-10 9.87 0 1.74.47 3.43 1.37 4.92L2 22l5.4-1.76c1.43.78 3.05 1.19 4.67 1.19h.01c5.52 0 10-4.42 10-9.87 0-2.64-1.07-5.12-3.02-6.99A10.55 10.55 0 0 0 12.04 2Zm5.88 14.19c-.25.7-1.46 1.33-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.11-1-.32-1.72-.63-3.03-1.31-5-4.37-5.15-4.58-.15-.21-1.23-1.64-1.23-3.13 0-1.48.78-2.2 1.06-2.5.28-.3.61-.37.82-.37.2 0 .4.01.57.01.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.21-.15.33-.3.51-.15.17-.31.39-.44.52-.15.15-.31.32-.13.63.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.54.31.15.49.13.67-.08.18-.21.77-.88.97-1.18.2-.3.41-.24.68-.14.28.1 1.76.83 2.06.98.3.15.5.23.57.36.07.12.07.72-.18 1.42Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 hover:text-pink-300 transition-all shadow-lg backdrop-blur-sm border border-pink-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-.88a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all shadow-lg backdrop-blur-sm border border-red-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10.5 15.02V8.98L15.5 12l-5 3.02Z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition-all shadow-lg backdrop-blur-sm border border-blue-600/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13.5 9H16l.5-3h-3V4.5c0-.966.196-1.5 1.5-1.5H16V0h-2.4C10.9 0 9.5 1.343 9.5 3.8V6H7v3h2.5v12h4V9Z"/></svg>
              </a>
            </div>
          </div>

          {/* Sağ: Search Bar ve Teklif Al */}
          <div className="flex items-center gap-3">
            {/* Make search visible on mobile */}
            <div className="flex-1 lg:flex-1" style={{ minWidth: 0 }}>
              <div ref={dropdownRef} className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                    placeholder="Ürün ara..."
                    className="w-full lg:w-48 px-3 py-1.5 pl-8 bg-white/90 backdrop-blur-sm border border-white/50 rounded-lg text-sm placeholder-gray-500 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 shadow-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-brand-orange transition-colors"
                    aria-label="Ara"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-orange rounded-full animate-spin"></div>
                          Aranıyor...
                        </div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
                          {searchResults.length} ürün bulundu
                        </div>
                        {searchResults.map((product, index) => {
                          const img = product.main_img || product.img1 || product.img2 || product.img3 || product.img4 || null;
                          return (
                            <button
                              key={product.id || product.sku || index}
                              onClick={() => handleProductClick(product)}
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                                  {Number(product.discount) > 0 && (
                                    <div className="absolute left-0 top-0 z-30 bg-red-600 text-white px-1 py-0.5 text-[10px] font-semibold rounded-br">-{product.discount}%</div>
                                  )}
                                  {img ? (
                                    <ProtectedImage
                                      src={img}
                                      alt={product.title || product.sku}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-500 font-medium">{product.sku}</div>
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {product.title || product.sku}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {product.brand || 'Keten Pnömatik'}
                                  </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={handleSearch}
                            className="w-full text-center text-sm text-brand-orange hover:text-orange-600 font-medium py-2"
                          >
                            Tüm sonuçları gör ({searchQuery})
                          </button>
                        </div>
                      </>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        "{searchQuery}" için ürün bulunamadı
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Teklif Al: hide on mobile, available inside menu */}
            <NavLink to="/iletisim" className="hidden md:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-orange text-white shadow hover:bg-orange-500 transition">
              Teklif Al
            </NavLink>

            {/* Hamburger menu for mobile to show other header items */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              aria-label="Menüyü aç"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {/* Mobile full-screen menu panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white p-6 overflow-auto md:hidden">
          <div className="flex items-center justify-between mb-6">
            <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img src={logo} alt="Keten Logo" className="h-10 w-auto" />
            </NavLink>
            <button onClick={() => setMobileMenuOpen(false)} aria-label="Kapat" className="p-2 rounded-lg text-gray-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <nav className="flex flex-col gap-4">
            {nav.map(item => (
              <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `py-3 px-2 rounded-lg text-lg font-semibold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-800 hover:bg-gray-100'}`}>
                {item.label}
              </NavLink>
            ))}

            <NavLink to="/iletisim" onClick={() => setMobileMenuOpen(false)} className="mt-4 inline-flex items-center justify-center px-4 py-3 rounded-lg bg-brand-orange text-white font-semibold">
              Teklif Al
            </NavLink>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-3">
                <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">WhatsApp</a>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-pink-500/10 text-pink-600">Instagram</a>
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-red-500/10 text-red-600">YouTube</a>
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-500/10 text-blue-600">Facebook</a>
              </div>
            </div>
          </nav>
        </div>
      )}
  <main className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-0"><Outlet /></main>
    </div>
  );
}
