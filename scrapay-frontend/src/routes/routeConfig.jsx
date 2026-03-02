import About from '../pages/About';
import AdminPanel from '../pages/AdminPanel';
import CompletedOrders from '../pages/CompletedOrders';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import OrderPage from '../pages/OrderPage';
import SelectVendor from '../pages/SelectVendor';
import SellScrap from '../pages/SellScrap';
import Unauthorized from '../pages/Unauthorized';
import UserDashboard from '../pages/UserDashboard';
import UserRegister from '../pages/UserRegister';
import VendorDashboard from '../pages/VendorDashboard';
import VendorOrderDetails from '../pages/VendorOrderDetails';
import VendorRegister from '../pages/VendorRegister';

export const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
  { path: '/login', element: <Login /> },
  { path: '/register/user', element: <UserRegister /> },
  { path: '/register/vendor', element: <VendorRegister /> },
  { path: '/unauthorized', element: <Unauthorized /> },
];

export const protectedRoutes = [
  { path: '/user/dashboard', element: <UserDashboard />, roles: ['user'] },
  { path: '/vendor-selection', element: <SelectVendor />, roles: ['user'] },
  { path: '/sell-scrap', element: <SellScrap />, roles: ['user'] },
  { path: '/order/:id', element: <OrderPage />, roles: ['user'] },
  { path: '/vendor/dashboard', element: <VendorDashboard />, roles: ['vendor'] },
  { path: '/vendor/order-details', element: <VendorOrderDetails />, roles: ['vendor'] },
  { path: '/vendor/completed-orders', element: <CompletedOrders />, roles: ['vendor'] },
  { path: '/admin', element: <AdminPanel />, roles: ['admin'] },
];

export const fallbackRoute = { path: '*', element: <NotFound /> };
