// API Client for Bullish Stealth Startup Finder
import axios from 'axios';

// Use Vite env var (not CRA's process.env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor — add access token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401, then retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Flask-JWT-Extended expects the refresh token as a Bearer token
          // in the Authorization header — NOT in the request body
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  // Backend requires first_name and last_name fields
  register: (email, password, firstName, lastName) =>
    api.post('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    }),

  // Send refresh token so it gets blocklisted on logout too
  logout: (refreshToken) =>
    api.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {}),

  // Returns { user: {...} }
  getCurrentUser: () =>
    api.get('/auth/me'),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  invite: (email) =>
    api.post('/auth/invite', { email }),

  acceptInvite: (token, firstName, lastName, password) =>
    api.post('/auth/accept-invite', {
      token,
      first_name: firstName,
      last_name: lastName,
      password,
    }),
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const admin = {
  listUsers: (params = {}) =>
    api.get('/admin/users', { params }),

  updateUser: (id, data) =>
    api.patch(`/admin/users/${id}`, data),

  forceResetPassword: (id, password) =>
    api.post(`/admin/users/${id}/force-reset`, { password }),

  getSpend: () =>
    api.get('/admin/spend'),
};

// ─── Enrichment (Bullish AI analysis via Claude) ──────────────────────────────
export const enrich = {
  signal: (itemId) =>
    api.post(`/enrich/signal/${itemId}`),

  batch: ({ itemIds, unenrichedOnly, rescoreAll, limit, offset } = {}) =>
    api.post('/enrich/batch', {
      ...(itemIds        ? { item_ids: itemIds }      : {}),
      ...(unenrichedOnly ? { unenriched_only: true }  : {}),
      ...(rescoreAll     ? { rescore_all: true }       : {}),
      ...(limit          ? { limit }                  : {}),
      ...(offset         ? { offset }                 : {}),
    }, { timeout: 300000 }),
};

// ─── Scans (real data from live sources) ──────────────────────────────────────
export const scans = {
  trademark: (daysBack = 30, maxResults = 200) =>
    api.post('/scans/trademark', { days_back: daysBack, max_results: maxResults }),

  delaware: (daysBack = 7, maxResults = 150) =>
    api.post('/scans/delaware', { days_back: daysBack, max_results: maxResults }, { timeout: 120000 }),

  producthunt: (daysBack = 14, maxResults = 100) =>
    api.post('/scans/producthunt', { days_back: daysBack, max_results: maxResults }),
};

// ─── Scheduled Scans ──────────────────────────────────────────────────────────
export const scheduledScans = {
  list:    ()         => api.get('/scheduled-scans/'),
  create:  (data)     => api.post('/scheduled-scans/', data),
  update:  (id, data) => api.patch(`/scheduled-scans/${id}`, data),
  delete:  (id)       => api.delete(`/scheduled-scans/${id}`),
  runNow:  (id)       => api.post(`/scheduled-scans/${id}/run`, {}, { timeout: 300000 }),
};

// ─── Items (underlying storage for signals + watchlist) ───────────────────────
export const items = {
  getAll: (params = {}) =>
    api.get('/items', { params }),

  create: (title, description) =>
    api.post('/items', { title, description }),

  update: (id, data) =>
    api.put(`/items/${id}`, data),

  delete: (id) =>
    api.delete(`/items/${id}`),
};

// ─── Chat (Ask Bullish AI) ────────────────────────────────────────────────────
export const chat = {
  ask: (messages) =>
    api.post('/chat/ask', { messages }, { timeout: 60000 }),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = {
  get: () => api.get('/settings'),
  update: (data) => api.patch('/settings', data),
  testSlack: (webhookUrl) => api.post('/settings/test-slack', { webhook_url: webhookUrl }),
};

export default api;
export { api };
