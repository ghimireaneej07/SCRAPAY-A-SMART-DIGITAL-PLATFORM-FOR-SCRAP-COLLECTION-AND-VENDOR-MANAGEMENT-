import { apiRequest } from './apiClient.js';

export const orderService = {
  getMyOrders() {
    return apiRequest('/orders/my/');
  },

  getMyOrderById(orderId) {
    return apiRequest(`/orders/my/${orderId}/`);
  },

  cancelMyOrder(orderId) {
    return apiRequest(`/orders/my/${orderId}/cancel/`, {
      method: 'PATCH',
    });
  },

  submitFeedback(orderId, payload) {
    return apiRequest(`/orders/my/${orderId}/feedback/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getVendors(filters = {}) {
    const params = new URLSearchParams();
    if (filters.lat != null) params.set('lat', String(filters.lat));
    if (filters.lon != null) params.set('lon', String(filters.lon));
    if (filters.radius_km != null) params.set('radius_km', String(filters.radius_km));
    const query = params.toString();
    return apiRequest(`/orders/vendors/${query ? `?${query}` : ''}`);
  },

  createOrder(payload) {
    return apiRequest('/orders/my/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getVendorOrders(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/orders/vendor/${query}`);
  },

  getVendorOrderById(orderId) {
    return apiRequest(`/orders/vendor/${orderId}/`);
  },

  vendorAction(orderId, action) {
    return apiRequest(`/orders/vendor/${orderId}/${action}/`, {
      method: 'PATCH',
    });
  },

  acceptOrder(orderId) {
    return this.vendorAction(orderId, 'accept');
  },

  rejectOrder(orderId) {
    return this.vendorAction(orderId, 'reject');
  },

  startOrder(orderId) {
    return this.vendorAction(orderId, 'start');
  },

  completeOrder(orderId) {
    return this.vendorAction(orderId, 'complete');
  },
};
