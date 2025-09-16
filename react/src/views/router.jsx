import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout.jsx';
import Home from './home.jsx';
import Login from './login.jsx';
import Register from './register.jsx';
import Urunler from './urunler.jsx';
import UrunDetay from './urun-detay.jsx';
import Iletisim from './iletisim.jsx';
import TeknikServis from './teknik-servis.jsx';
import Admin from './admin.jsx';
import AdminUrunler from './admin-urunler.jsx';
import AdminSiparisler from './admin-siparisler.jsx';
import AdminTeknikServis from './admin-teknik-servis.jsx';
import AdminWebIstatistikleri from './admin-web-istatistikleri.jsx';
import Sepet from './sepet.jsx';
import Kategoriler from './kategoriler.jsx';

export const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{ path: '/', element: <Home /> },
			{ path: '/urunler', element: <Urunler /> },
			{ path: '/urunler/:sku', element: <UrunDetay /> },
			{ path: '/kategoriler', element: <Kategoriler /> },
			{ path: '/iletisim', element: <Iletisim /> },
			{ path: '/teknik-servis', element: <TeknikServis /> },
			{ path: '/sepet', element: <Sepet /> },
			{ path: '/admin', element: <Admin /> },
			{ path: '/admin/urunler', element: <AdminUrunler /> },
			{ path: '/admin/siparisler', element: <AdminSiparisler /> },
			{ path: '/admin/teknik-servis', element: <AdminTeknikServis /> },
			{ path: '/admin/web-istatistikleri', element: <AdminWebIstatistikleri /> },
		]
	},
	{ path: '/login', element: <Login /> },
	{ path: '/register', element: <Register /> },
	{ path: '*', element: <div style={{padding:40}}>Sayfa bulunamadı</div> }
]);

export default router;
