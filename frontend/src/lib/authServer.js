import crypto from 'crypto';

export const EmployeeRole = Object.freeze({
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  ACCOUNTANT: "Accountant"
});

const JWT_SECRET = process.env.JWT_SECRET || 'bharatbiz-super-secure-jwt-secret-key-2026';
const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes session expiry

// In-memory tables for SaaS simulation
export const usersDb = {};
export const auditLogsDb = [];

// Helper: Hashing password using standard PBKDF2
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper: Generating salt
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// Custom Signed Token (JWT-like) Implementation
export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Set explicit expiration timestamp
  const exp = Date.now() + SESSION_EXPIRY_MS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signatureInput = `${header}.${body}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const signatureInput = `${header}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    
    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

// Seed Initial Multi-User Records (Default Password is "password123")
const demoSalt = 'default-salt-123';
const defaultPasswordHash = hashPassword('password123', demoSalt);

const defaultDemoUsers = [
  {
    id: "user-vishwa-owner",
    username: "vishwa_owner",
    name: "Vijay Agarwal",
    role: EmployeeRole.OWNER,
    businessId: "biz-1",
    email: "vishwa@vishwa.com",
    passwordSalt: demoSalt,
    passwordHash: hashPassword('vishwa123', demoSalt)
  },
  {
    id: "user-owner-1",
    username: "priya_owner",
    name: "Priya Agarwal",
    role: EmployeeRole.OWNER,
    businessId: "biz-1",
    email: "priya@vishwa.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  },
  {
    id: "user-admin-1",
    username: "vikram_admin",
    name: "Vikram Sharma",
    role: EmployeeRole.ADMIN,
    businessId: "biz-1",
    email: "vikram@vishwa.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  },
  {
    id: "user-staff-1",
    username: "raj_staff",
    name: "Raj Kumar",
    role: EmployeeRole.STAFF,
    businessId: "biz-1",
    email: "raj@vishwa.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  },
  {
    id: "user-accountant-1",
    username: "kavita_accountant",
    name: "Kavita Iyer",
    role: EmployeeRole.ACCOUNTANT,
    businessId: "biz-1",
    email: "kavita@vishwa.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  },
  // Tenant B Users
  {
    id: "user-owner-2",
    username: "bharat_owner",
    name: "Bharat Mehta",
    role: EmployeeRole.OWNER,
    businessId: "biz-2",
    email: "owner@bharat.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  },
  {
    id: "user-staff-2",
    username: "anil_staff",
    name: "Anil Patel",
    role: EmployeeRole.STAFF,
    businessId: "biz-2",
    email: "anil@bharat.com",
    passwordSalt: demoSalt,
    passwordHash: defaultPasswordHash
  }
];

defaultDemoUsers.forEach(u => {
  usersDb[u.username.toLowerCase()] = u;
});

// Helper: Add Audit Log
export function addAuditLog(user_id, username, role, organization_id, action, details) {
  const log = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    user_id,
    username,
    role,
    organization_id,
    action,
    details,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  auditLogsDb.unshift(log);
}

// Seed Initial Audit Logs
addAuditLog("system", "System", "System", "biz-1", "System Init", "Multi-tenant authentication engine started.");

// Authentication Middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access Denied: Missing session token." });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: "Session Expired: Please log in again." });
  }
  
  req.user = user;
  next();
}

// RBAC Middleware
export function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access Denied: Unauthorized request." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Permission Denied: Your role (${req.user.role}) is not authorized to perform this operation.` });
    }
    next();
  };
}
