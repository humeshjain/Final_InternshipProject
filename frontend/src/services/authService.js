import { authApi } from '../api/authApi.js';

export const authService = {
  register: authApi.register,
  login: authApi.login,
  logout: authApi.logout,
  logAudit: authApi.logAudit
};
