import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout.jsx';
import Home from './home.jsx';
import Urunler from './urunler.jsx';
import UrunDetay from './urun-detay.jsx';
import Iletisim from './iletisim.jsx';


export const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{ path: '/', element: <Home /> },
			{ path: '/urunler', element: <Urunler /> },
			{ path: '/urunler/:sku', element: <UrunDetay /> },
			{ path: '/iletisim', element: <Iletisim /> },
		]
	},
	{ path: '*', element: <div style={{padding:40}}>Sayfa bulunamadı</div> }
]);

export default router;
