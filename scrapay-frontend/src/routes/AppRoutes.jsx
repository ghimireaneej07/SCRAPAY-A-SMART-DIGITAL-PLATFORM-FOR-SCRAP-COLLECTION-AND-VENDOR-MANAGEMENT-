import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx';
import { fallbackRoute, protectedRoutes, publicRoutes } from './routeConfig.jsx';

const AppRoutes = () => {
  const protectedByRoles = protectedRoutes.reduce((acc, route) => {
    const key = route.roles.join('|');
    if (!acc[key]) acc[key] = { roles: route.roles, routes: [] };
    acc[key].routes.push(route);
    return acc;
  }, {});

  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {Object.values(protectedByRoles).map((group) => (
        <Route key={group.roles.join('|')} element={<ProtectedRoute allowedRoles={group.roles} />}>
          {group.routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      ))}

      <Route path={fallbackRoute.path} element={fallbackRoute.element} />
    </Routes>
  );
};

export default AppRoutes;
