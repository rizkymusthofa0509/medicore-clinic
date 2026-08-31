import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medicore_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medicore_token');
      localStorage.removeItem('medicore_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Ping BE untuk cek koneksi
export const pingServer = async () => {
  try {
    const response = await api.get('/api/ping');
    return { online: true, data: response.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

// Auth API
export const login = (email, password) => api.post('/api/login', { email, password });
export const logout = () => api.post('/api/logout');
export const getMe = () => api.get('/api/me');
