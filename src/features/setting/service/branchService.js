// Branch Service - Integrasi API branch
import api from '../../../shared/api.js';

export const branchService = {
  // Get all branches
  getBranches: () => api.get('/api/settings/branches'),
  
  // Get current user's branches
  getUserBranches: (userId) => api.get(`/api/settings/users/${userId}/branches`),
};
