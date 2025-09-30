import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout.jsx';
import Home from './home.jsx';
import Urunler from './urunler.jsx';
import UrunDetay from './urun-detay.jsx';
import Iletisim from './iletisim.jsx';
import TeknikServis from './teknik-servis.jsx';
import AdminPage from './admin.jsx';


export const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{ path: '/', element: <Home /> },
			{ path: '/urunler', element: <Urunler /> },
			// Allow trailing-slash variant so direct-typed '/urunler/' works on hosts that keep the slash
			{ path: '/urunler/', element: <Urunler /> },
			{ path: '/urunler/:sku', element: <UrunDetay /> },
			{ path: '/iletisim', element: <Iletisim /> },
			{ path: '/teknik-servis', element: <TeknikServis /> },
			{ path: '/admin', element: <AdminPage /> },
		]
	},
	{ path: '*', element: <div style={{padding:40}}>Sayfa bulunamadı</div> }
]);

export default router;
