import { userRepository } from '../repositories/userRepository.js';
import { auditService } from './auditService.js';
import { hashPassword, generateSalt, generateToken } from '../utils/crypto.js';
import { EmployeeRole } from '../constants/roles.js';

export const authService = {
  register({ username, password, name, email, phone, role, businessName }) {
    const userKey = username.toLowerCase().trim();
    if (userRepository.findByUsername(userKey)) {
      throw new Error("Username is already registered.");
    }

    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    const businessId = "biz-" + Date.now();
    // Registering a workspace always assigns the Owner role with full access
    const assignedRole = EmployeeRole.OWNER;

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

    userRepository.saveUser(newUser);

    auditService.logAction(
      newUser.id,
      newUser.username,
      newUser.role,
      newUser.businessId,
      "User Registration",
      `Registered business account for ${name} (${businessName || 'SME'}).`
    );

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

    return { token, user: sessionPayload };
  },

  login({ username, password }) {
    const user = userRepository.findByUsername(username);
    if (!user) {
      throw new Error("Invalid username or password.");
    }

    const currentHash = hashPassword(password, user.passwordSalt);
    if (currentHash !== user.passwordHash) {
      throw new Error("Invalid username or password.");
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

    auditService.logAction(
      user.id,
      user.username,
      user.role,
      user.businessId,
      "Login Success",
      "User logged in successfully from multi-tenant client portal."
    );

    return { token, user: sessionPayload };
  },

  logout(user) {
    if (user) {
      auditService.logAction(
        user.id,
        user.username,
        user.role,
        user.businessId,
        "Logout",
        "User logged out successfully, session invalidated."
      );
    }
    return true;
  },

  getProfile(user) {
    const refreshedToken = generateToken(user);
    return { user, token: refreshedToken };
  },

  getUsersForBusiness(businessId) {
    return userRepository.getUsersByBusiness(businessId).map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email,
      phone: u.phone
    }));
  },

  addEmployee(requestingUser, { username, password, name, role, email, phone, salary }) {
    if (!username || !password || !name) {
      throw new Error("Username, password, and name are required.");
    }

    const userKey = username.toLowerCase().trim();
    if (userRepository.findByUsername(userKey)) {
      throw new Error(`Username @${userKey} is already registered.`);
    }

    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);
    const assignedRole = role || EmployeeRole.STAFF;

    const newEmpUser = {
      id: "user-" + Date.now(),
      username: username.trim(),
      name: name.trim(),
      role: assignedRole,
      businessId: requestingUser.businessId,
      email: email ? email.trim() : `${userKey}@${requestingUser.businessId}.com`,
      phone: phone ? phone.trim() : "",
      salary: Number(salary) || 0,
      passwordSalt: salt,
      passwordHash: hashedPassword
    };

    userRepository.saveUser(newEmpUser);

    auditService.logAction(
      requestingUser.id,
      requestingUser.username,
      requestingUser.role,
      requestingUser.businessId,
      "Employee Account Created",
      `Added employee profile for ${name} (@${username.trim()}) with role '${assignedRole}' in workspace ${requestingUser.businessId}.`
    );

    return {
      id: newEmpUser.id,
      username: newEmpUser.username,
      name: newEmpUser.name,
      role: newEmpUser.role,
      businessId: newEmpUser.businessId,
      email: newEmpUser.email,
      phone: newEmpUser.phone,
      salary: newEmpUser.salary
    };
  },

  deleteUser(requestingUser, usernameToDelete) {
    if (requestingUser.role !== EmployeeRole.OWNER) {
      throw new Error("Permission Denied: Only Owner accounts can delete login profiles.");
    }

    const targetKey = usernameToDelete.toLowerCase().trim();
    const currentKey = requestingUser.username.toLowerCase().trim();

    if (targetKey === currentKey) {
      throw new Error("Operation Refused: You cannot delete your own logged-in account.");
    }

    const targetUser = userRepository.findByUsername(targetKey);
    if (!targetUser) {
      throw new Error("User profile not found.");
    }

    if (targetUser.businessId !== requestingUser.businessId) {
      throw new Error("Forbidden: You cannot delete users from another business tenant.");
    }

    userRepository.deleteByUsername(targetKey);

    auditService.logAction(
      requestingUser.id,
      requestingUser.username,
      requestingUser.role,
      requestingUser.businessId,
      "User Account Deleted",
      `Deleted login user profile: ${targetUser.username} (${targetUser.role}).`
    );

    return `User account '${targetUser.username}' successfully deleted.`;
  }
};
