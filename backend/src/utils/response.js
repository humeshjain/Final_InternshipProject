export function sendSuccess(res, data = {}, message = "", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...data
  });
}

export function sendError(res, error = "An error occurred", statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message || "An unexpected error occurred"
  });
}
