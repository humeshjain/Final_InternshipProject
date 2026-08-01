import { verifyToken } from '../utils/crypto.js';
import { sendError } from '../utils/response.js';
import { ErrorMessages } from '../constants/errorMessages.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return sendError(res, ErrorMessages.MISSING_TOKEN, 401);
  }
  
  const user = verifyToken(token);
  if (!user) {
    return sendError(res, ErrorMessages.SESSION_EXPIRED, 403);
  }
  
  req.user = user;
  next();
}

export function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, ErrorMessages.UNAUTHORIZED, 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Permission Denied: Your role (${req.user.role}) is not authorized to perform this operation.`, 403);
    }
    next();
  };
}
