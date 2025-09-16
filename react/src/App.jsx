import { RouterProvider } from 'react-router-dom';
import router from './views/router.jsx';

function App() {
  return <RouterProvider router={router} />;
}

export default App;