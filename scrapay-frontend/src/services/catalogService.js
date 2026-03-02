import { apiRequest } from './apiClient.js';

export const catalogService = {
  getCategories() {
    return apiRequest('/catalog/scrap-categories');
  },

  getLatestMarketRates() {
    return apiRequest('/catalog/market-rates/latest');
  },
};
