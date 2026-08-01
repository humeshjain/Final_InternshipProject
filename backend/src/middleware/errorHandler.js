import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  console.error("Server Global Error Handler:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";
  return sendError(res, message, statusCode);
}
