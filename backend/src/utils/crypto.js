import crypto from 'crypto';
import { config } from '../config/env.js';

export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + config.sessionExpiryMs;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signatureInput = `${header}.${body}`;
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
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
      .createHmac('sha256', config.jwtSecret)
      .update(signatureInput)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}
