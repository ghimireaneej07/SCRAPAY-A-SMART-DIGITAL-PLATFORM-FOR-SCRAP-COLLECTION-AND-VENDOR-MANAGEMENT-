import { apiRequest } from './apiClient.js';

export const adminService = {
  getVendors() {
    return apiRequest('/auth/admin/vendors');
  },

  setVendorVerification(vendorId, isVerified) {
    return apiRequest(`/auth/admin/vendors/${vendorId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ is_verified: isVerified }),
    });
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
