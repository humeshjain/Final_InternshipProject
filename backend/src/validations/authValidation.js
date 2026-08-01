export function validateRegistration(req, res, next) {
  const { username, password, name, email, phone } = req.body;
  if (!username || !password || !name || !email || !phone) {
    return res.status(400).json({ success: false, error: "All fields are required (username, password, name, email, phone)." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address (e.g., store@example.com)." });
  }

  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ success: false, error: "Please enter a valid mobile number with 10 to 15 digits (e.g., +919876543210)." });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required." });
  }
  next();
}

export function validateAuditLog(req, res, next) {
  const { action, details } = req.body;
  if (!action || !details) {
    return res.status(400).json({ success: false, error: "Action and details are required parameters." });
  }
  next();
}
