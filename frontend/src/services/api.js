import axios from 'axios';
import { getSelectedApiUrl } from './connection';

let API_URL = '';
try { API_URL = getSelectedApiUrl(); } catch { API_URL = import.meta.env.VITE_API_URL || ''; }
if (import.meta.env.PROD && API_URL && !API_URL.startsWith('https://') && localStorage.getItem('apiTarget') !== 'local') {
  console.error('VITE_API_URL must be an HTTPS URL in production');
}
const api = axios.create({ baseURL: `${API_URL}/api/v1` });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    const refreshToken = localStorage.getItem('refreshToken');
    if (err.response?.status === 401 && refreshToken && !original?._retry && !original?.url?.endsWith('/auth/refresh') && !original?.url?.endsWith('/auth/login')) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        localStorage.removeItem('refreshToken');
      }
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
