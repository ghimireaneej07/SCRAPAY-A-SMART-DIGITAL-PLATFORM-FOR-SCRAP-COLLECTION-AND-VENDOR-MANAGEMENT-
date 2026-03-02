import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const me = await authService.me();
        if (isMounted) setUser(me);
      } catch {
        authService.logout();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((payload) => {
    setUser(payload);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles) => {
      if (!user?.role) return false;
      if (!roles || roles.length === 0) return true;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
      hasRole,
    }),
    [hasRole, isBootstrapping, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
};
