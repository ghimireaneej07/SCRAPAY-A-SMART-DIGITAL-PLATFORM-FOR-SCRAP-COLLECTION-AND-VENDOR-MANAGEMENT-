import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { notificationService } from '../services/notificationService.js';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  useEffect(() => {
    let socket = null;
    let mounted = true;

    const bootstrap = async () => {
      if (!isAuthenticated) {
        if (mounted) {
          setNotifications([]);
          setSocketConnected(false);
        }
        return;
      }

      try {
        const existing = await notificationService.list();
        if (mounted) setNotifications(existing);
      } catch {
        if (mounted) setNotifications([]);
      }

      socket = notificationService.connect((payload) => {
        if (!mounted) return;
        setNotifications((prev) => [
          {
            id: `ws-${Date.now()}`,
            event_type: payload.type || 'generic',
            payload,
            is_read: false,
            created_at: new Date().toISOString(),
            order: payload.order_id || null,
          },
          ...prev,
        ]);
      });

      if (socket) {
        socket.onopen = () => mounted && setSocketConnected(true);
        socket.onclose = () => mounted && setSocketConnected(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
      if (socket) socket.close();
    };
  }, [isAuthenticated]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    if (String(id).startsWith('ws-')) return;
    try {
      await notificationService.markRead(id);
    } catch {
      // Keep optimistic state.
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      socketConnected,
      markRead,
    }),
    [markRead, notifications, socketConnected, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used inside NotificationProvider');
  }
  return context;
};
