import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'bharatbiz-super-secure-jwt-secret-key-2026',
  grokApiKey: process.env.GROK_API_KEY || process.env.VITE_GROK_API_KEY || process.env.XAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  sessionExpiryMs: 15 * 60 * 1000 // 15 minutes
};
