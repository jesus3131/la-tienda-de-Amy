import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local');
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : ''),
  SUPABASE_CA: process.env.SUPABASE_CA,
};

if (env.NODE_ENV === 'production') {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !env[key as keyof typeof env]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  if (env.FRONTEND_ORIGIN) {
    let frontendOrigin: URL;
    try {
      frontendOrigin = new URL(env.FRONTEND_ORIGIN);
    } catch {
      throw new Error('FRONTEND_ORIGIN must be a valid HTTPS URL in production');
    }
    if (frontendOrigin.protocol !== 'https:' || frontendOrigin.username || frontendOrigin.password) {
      throw new Error('FRONTEND_ORIGIN must use HTTPS in production');
    }
  }
}
