const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const ACCESS_KEY = 'scrapay_access_token';
const REFRESH_KEY = 'scrapay_refresh_token';

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const tryRefresh = async () => {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) return false;

  const payload = await response.json();
  tokenStore.set({ access: payload.access, refresh: payload.refresh || refresh });
  return true;
};

export const apiRequest = async (path, options = {}, retry = true) => {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStore.getAccess();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && retry && tokenStore.getRefresh()) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiRequest(path, options, false);
    tokenStore.clear();
  }

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const err = await response.json();
      detail = err.detail || JSON.stringify(err);
    } catch {
      // Keep fallback detail.
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
};
