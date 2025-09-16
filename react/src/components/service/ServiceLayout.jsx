import { Link, Outlet, useLocation } from 'react-router-dom';
import './service.css';

export default function ServiceLayout(){
  const { pathname } = useLocation();
  return (
    <div className="service-shell">
      <div className="service-nav">
        <h1 className="svc-title">Teknik Servis</h1>
        <nav className="svc-tabs">
          <Link to="/servis/randevu" className={pathname.includes('/servis/randevu') ? 'active' : ''}>Randevu Al</Link>
          <Link to="/servis/kayitlar" className={pathname.includes('/servis/kayitlar') ? 'active' : ''}>Servis Kayıtları</Link>
          <Link to="/" className="home-link-mini">← Ana Sayfa</Link>
        </nav>
      </div>
      <div className="service-outlet">
        <Outlet />
      </div>
    </div>
  );
}
