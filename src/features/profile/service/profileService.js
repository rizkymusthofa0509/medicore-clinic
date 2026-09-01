// Profile Service - Integrasi API profile user yang sedang login
import api from '../../../shared/api.js';

export const profileService = {
  getMe: () => api.get('/api/me'),
  updateProfile: (data) => api.put('/api/me', data),
  changePassword: (data) => api.post('/api/me/change-password', data),
};
