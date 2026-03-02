import { apiRequest, tokenStore } from './apiClient.js';

export const authService = {
  async login(credentials) {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
    tokenStore.set({ access: payload.access, refresh: payload.refresh });
    return payload;
  },

  async registerUser(form) {
    return apiRequest('/auth/register/user', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  },

  async registerVendor(form) {
    return apiRequest('/auth/register/vendor', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  },

  async me() {
    return apiRequest('/auth/me');
  },

  logout() {
    tokenStore.clear();
  },
};
