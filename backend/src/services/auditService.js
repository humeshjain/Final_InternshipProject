import { auditRepository } from '../repositories/userRepository.js';

export const auditService = {
  logAction(userId, username, role, businessId, action, details) {
    return auditRepository.addLog(userId, username, role, businessId, action, details);
  },
  getLogsForTenant(businessId) {
    return auditRepository.getLogsByTenant(businessId);
  }
};
