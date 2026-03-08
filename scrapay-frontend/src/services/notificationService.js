import { apiRequest, tokenStore } from './apiClient.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WS_BASE_URL = API_BASE_URL.replace(/^http/i, 'ws').replace(/\/api\/?$/, '');

export const notificationService = {
  list() {
    return apiRequest('/notifications/');
  },

  markRead(id) {
    return apiRequest(`/notifications/${id}/read/`, {
      method: 'PATCH',
    });
  },

  connect(onMessage) {
    const token = tokenStore.getAccess();
    if (!token) return null;
    const socket = new WebSocket(`${WS_BASE_URL}/ws/events/?token=${encodeURIComponent(token)}`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch {
        // Ignore malformed messages from socket.
      }
    };
    return socket;
  },
};
