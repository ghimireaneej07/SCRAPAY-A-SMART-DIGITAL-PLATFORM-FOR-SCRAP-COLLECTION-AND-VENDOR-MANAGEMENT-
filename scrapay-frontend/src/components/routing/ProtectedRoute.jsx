import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, hasRole, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="p-6 text-center text-sm text-orange-200">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
