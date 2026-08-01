import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const userController = {
  getUsers(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }
      const users = authService.getUsersForBusiness(req.user.businessId);
      return sendSuccess(res, { users });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  addEmployee(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }
      const employee = authService.addEmployee(req.user, req.body);
      return sendSuccess(res, { employee, message: `Employee ${employee.name} (@${employee.username}) created successfully with workspace access!` }, 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  deleteUser(req, res, next) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }
      const message = authService.deleteUser(req.user, req.params.username);
      return sendSuccess(res, { message });
    } catch (err) {
      const status = err.message.includes("Permission Denied") || err.message.includes("Forbidden") ? 403 : 400;
      return sendError(res, err.message, status);
    }
  }
};
