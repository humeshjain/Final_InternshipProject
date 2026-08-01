import { Router } from 'express';
import { 
  usersDb, 
  auditLogsDb, 
  hashPassword, 
  generateSalt, 
  generateToken, 
  addAuditLog, 
  authenticateToken, 
  EmployeeRole
} from './authServer.js';

export const authRouter = Router();

// 1. User Registration Route
authRouter.post('/register', (req, res) => {
  const { username, password, name, email, phone, role, businessName } = req.body;
  
  if (!username || !password || !name || !email || !phone) {
    return res.status(400).json({ error: "All fields are required (username, password, name, email, phone)." });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address (e.g., store@example.com)." });
  }

  // Validate mobile/phone format (10 to 15 digits, optional leading plus)
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: "Please enter a valid mobile number with 10 to 15 digits (e.g., +919876543210)." });
  }
  
  const userKey = username.toLowerCase().trim();
  if (usersDb[userKey]) {
    return res.status(400).json({ error: "Username is already registered." });
  }
  
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  
  // Assign or generate unique Business ID / Organization ID
  const businessId = "biz-" + Date.now();
  const assignedRole = role || EmployeeRole.OWNER;
  
  const newUser = {
    id: "user-" + Date.now(),
    username: username.trim(),
    name: name.trim(),
    role: assignedRole,
    businessId,
    email: email.trim(),
    phone: phone.trim(),
    passwordSalt: salt,
    passwordHash: hashedPassword
  };
  
  usersDb[userKey] = newUser;
  
  // Audit log
  addAuditLog(newUser.id, newUser.username, newUser.role, newUser.businessId, "User Registration", `Registered business account for ${name} (${businessName || 'SME'}).`);
  
  const sessionPayload = {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    businessId: newUser.businessId,
    email: newUser.email,
    phone: newUser.phone,
    createdAt: new Date().toISOString()
  };
  
  const token = generateToken(sessionPayload);
  
  res.status(201).json({
    success: true,
    token,
    user: sessionPayload
  });
});

// 2. User Login Route
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  
  const userKey = username.toLowerCase().trim();
  const user = usersDb[userKey];
  
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  
  const currentHash = hashPassword(password, user.passwordSalt);
  if (currentHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  
  const sessionPayload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    email: user.email,
    createdAt: new Date().toISOString()
  };
  
  const token = generateToken(sessionPayload);
  
  // Audit Log
  addAuditLog(user.id, user.username, user.role, user.businessId, "Login Success", `User logged in successfully from multi-tenant client portal.`);
  
  res.json({
    success: true,
    token,
    user: sessionPayload
  });
});

// 3. User Logout Route
authRouter.post('/logout', authenticateToken, (req, res) => {
  if (req.user) {
    addAuditLog(req.user.id, req.user.username, req.user.role, req.user.businessId, "Logout", "User logged out successfully, session invalidated.");
  }
  res.json({ success: true, message: "Logged out successfully." });
});

// 4. Get Current Auth Profile Route
authRouter.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized access." });
  }
  
  // Generate refreshed token to extend session if desired
  const token = generateToken(req.user);
  
  res.json({
    success: true,
    user: req.user,
    token
  });
});

// 5. Retrieve isolated audit logs
authRouter.get('/audit-logs', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Filter logs to only display those matching the current active business tenant (organization_id)
  const filteredLogs = auditLogsDb.filter(log => log.organization_id === req.user?.businessId || log.user_id === "system");
  
  res.json({
    success: true,
    logs: filteredLogs
  });
});

// 6. Action-based audit logging (custom trigger)
authRouter.post('/audit-log', authenticateToken, (req, res) => {
  const { action, details } = req.body;
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (!action || !details) {
    return res.status(400).json({ error: "Action and details are required parameters." });
  }
  
  addAuditLog(req.user.id, req.user.username, req.user.role, req.user.businessId, action, details);
  res.json({ success: true });
});

// 7. Get All Users for the current Business
authRouter.get('/users', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const businessId = req.user.businessId;
  const userList = Object.values(usersDb)
    .filter(u => u.businessId === businessId)
    .map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone
    }));
    
  res.json({
    success: true,
    users: userList
  });
});

// 7.5. Add Employee account linked to owner's active business workspace
authRouter.post('/add-employee', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  const { username, password, name, role, phone, email, salary } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password, and full name are required." });
  }

  const userKey = username.toLowerCase().trim();
  if (usersDb[userKey]) {
    return res.status(400).json({ error: `Username @${userKey} is already registered.` });
  }

  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  const assignedRole = role || EmployeeRole.STAFF;

  const newEmpUser = {
    id: "user-" + Date.now(),
    username: username.trim(),
    name: name.trim(),
    role: assignedRole,
    businessId: req.user.businessId,
    email: email ? email.trim() : `${userKey}@${req.user.businessId}.com`,
    phone: phone ? phone.trim() : "",
    salary: Number(salary) || 0,
    passwordSalt: salt,
    passwordHash: hashedPassword
  };

  usersDb[userKey] = newEmpUser;

  addAuditLog(
    req.user.id, 
    req.user.username, 
    req.user.role, 
    req.user.businessId, 
    "Employee Account Created", 
    `Added employee ${name} (@${username.trim()}) with role '${assignedRole}' to business workspace ${req.user.businessId}.`
  );

  res.status(201).json({
    success: true,
    message: `Employee ${name} (@${username.trim()}) created successfully! They can now log in using business workspace credentials.`,
    user: {
      id: newEmpUser.id,
      username: newEmpUser.username,
      name: newEmpUser.name,
      role: newEmpUser.role,
      businessId: newEmpUser.businessId,
      email: newEmpUser.email,
      phone: newEmpUser.phone,
      salary: newEmpUser.salary
    }
  });
});

// 8. Delete User account (restricted to Owner, and cannot delete own self)
authRouter.delete('/users/:username', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user.role !== 'Owner') {
    return res.status(403).json({ error: "Permission Denied: Only Owner accounts can delete login profiles." });
  }
  
  const usernameToDelete = req.params.username.toLowerCase().trim();
  const currentUserKey = req.user.username.toLowerCase().trim();
  
  if (usernameToDelete === currentUserKey) {
    return res.status(400).json({ error: "Operation Refused: You cannot delete your own logged-in account." });
  }
  
  const user = usersDb[usernameToDelete];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  
  if (user.businessId !== req.user.businessId) {
    return res.status(403).json({ error: "Forbidden: You cannot delete users from another business tenant." });
  }
  
  delete usersDb[usernameToDelete];
  
  addAuditLog(req.user.id, req.user.username, req.user.role, req.user.businessId, "User Account Deleted", `Deleted login user profile: ${user.username} (${user.role}).`);
  
  res.json({
    success: true,
    message: `User account '${user.username}' successfully deleted.`
  });
});
