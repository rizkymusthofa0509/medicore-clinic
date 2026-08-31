// Setting Service - Integrasi API setting
import api from '../../../shared/api.js';

export const settingService = {
  // Branches
  getBranches: () => api.get('/api/settings/branches'),
  createBranch: (data) => api.post('/api/settings/branches', data),
  updateBranch: (id, data) => api.put(`/api/settings/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/api/settings/branches/${id}`),

  // Users
  getUsers: () => api.get('/api/settings/users'),
  createUser: (data) => api.post('/api/settings/users', data),
  updateUser: (id, data) => api.put(`/api/settings/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/settings/users/${id}`),

  // User Branches
  getUserBranches: (userId) => api.get(`/api/settings/users/${userId}/branches`),
  syncUserBranches: (userId, data) => api.post(`/api/settings/users/${userId}/branches`, data),
};
