import { EmployeeRole } from '../constants/roles.js';
import { hashPassword } from '../utils/crypto.js';

export const usersDb = {};
export const auditLogsDb = [];

// Seed default users
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

export const userRepository = {
  findByUsername(username) {
    if (!username) return null;
    return usersDb[username.toLowerCase().trim()] || null;
  },
  saveUser(user) {
    const key = user.username.toLowerCase().trim();
    usersDb[key] = user;
    return user;
  },
  deleteByUsername(username) {
    const key = username.toLowerCase().trim();
    if (usersDb[key]) {
      delete usersDb[key];
      return true;
    }
    return false;
  },
  getUsersByBusiness(businessId) {
    return Object.values(usersDb).filter(u => u.businessId === businessId);
  }
};

export const auditRepository = {
  addLog(user_id, username, role, organization_id, action, details) {
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
    return log;
  },
  getLogsByTenant(businessId) {
    return auditLogsDb.filter(log => log.organization_id === businessId || log.user_id === "system");
  }
};

// Seed initial audit log
auditRepository.addLog("system", "System", "System", "biz-1", "System Init", "Multi-tenant authentication engine started.");
