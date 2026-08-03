import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { userController } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateRegistration, validateLogin, validateAuditLog } from '../validations/authValidation.js';

export const authRouter = Router();

// Authentication
authRouter.post('/register', validateRegistration, authController.register);
authRouter.post('/login', validateLogin, authController.login);
authRouter.post('/logout', authenticateToken, authController.logout);
authRouter.get('/me', authenticateToken, authController.getProfile);

// Audit Logs
authRouter.get('/audit-logs', authenticateToken, authController.getAuditLogs);
authRouter.post('/audit-log', authenticateToken, validateAuditLog, authController.createAuditLog);

// User Management
authRouter.get('/users', authenticateToken, userController.getUsers);
authRouter.post('/add-employee', authenticateToken, userController.addEmployee);
authRouter.put('/users/:username', authenticateToken, userController.updateUser);
authRouter.delete('/users/:username', authenticateToken, userController.deleteUser);
