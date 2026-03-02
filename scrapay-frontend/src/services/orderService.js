import { apiRequest } from './apiClient.js';

export const orderService = {
  getVendors() {
    return apiRequest('/orders/vendors/');
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

  vendorAction(orderId, action) {
    return apiRequest(`/orders/vendor/${orderId}/${action}/`, {
      method: 'PATCH',
    });
  },
};
