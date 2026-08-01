import { authService } from '../services/authService.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authController = {
  register(req, res, next) {
    try {
      const result = authService.register(req.body);
      return sendSuccess(res, result, "Registered successfully.", 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  login(req, res, next) {
    try {
      const result = authService.login(req.body);
      return sendSuccess(res, result, "Logged in successfully.");
    } catch (err) {
      return sendError(res, err.message, 401);
    }
  },

  logout(req, res, next) {
    try {
      authService.logout(req.user);
      return sendSuccess(res, { message: "Logged out successfully." });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getProfile(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized access.", 401);
      }
      const result = authService.getProfile(req.user);
      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  getAuditLogs(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }
      const logs = auditService.getLogsForTenant(req.user.businessId);
      return sendSuccess(res, { logs });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  createAuditLog(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }
      const { action, details } = req.body;
      auditService.logAction(
        req.user.id,
        req.user.username,
        req.user.role,
        req.user.businessId,
        action,
        details
      );
      return sendSuccess(res);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
};
