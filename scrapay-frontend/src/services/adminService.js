import { apiRequest } from './apiClient.js';

export const adminService = {
  getAccounts(role) {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return apiRequest(`/auth/admin/accounts${query}`);
  },

  setAccountStatus(userId, isActive) {
    return apiRequest(`/auth/admin/accounts/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  getVendors() {
    return apiRequest('/auth/admin/vendors');
  },

  setVendorVerification(vendorId, isVerified) {
    return apiRequest(`/auth/admin/vendors/${vendorId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ is_verified: isVerified }),
    });
  },

  getAnalytics() {
    return apiRequest('/auth/admin/analytics');
  },

  getOrders(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/auth/admin/orders${query}`);
  },

  getMarketRates() {
    return apiRequest('/catalog/admin/market-rates/');
  },

  createMarketRate(payload) {
    return apiRequest('/catalog/admin/market-rates/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
