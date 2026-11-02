import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local');
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const configuredOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  PORT: Number(process.env.PORT || 4000),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  NODE_ROLE: process.env.NODE_ROLE || 'central',
  NODE_ID: process.env.NODE_ID || 'central',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : ''),
  FRONTEND_ORIGINS: configuredOrigins,
  SUPABASE_CA: process.env.SUPABASE_CA,
};

const allowedOrigins = [env.FRONTEND_ORIGIN, ...env.FRONTEND_ORIGINS].filter(
  (origin, index, origins) => origin && origins.indexOf(origin) === index,
);

if (env.NODE_ENV === 'production') {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !env[key as keyof typeof env]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  for (const origin of allowedOrigins) {
    let frontendOrigin: URL;
    try {
      frontendOrigin = new URL(origin);
    } catch {
      throw new Error('FRONTEND_ORIGIN must be a valid HTTPS URL in production');
    }
    if (frontendOrigin.protocol !== 'https:' || frontendOrigin.username || frontendOrigin.password) {
      throw new Error('FRONTEND_ORIGIN must use HTTPS in production');
    }
  }
}

export function isAllowedFrontendOrigin(origin: string | undefined): boolean {
  return Boolean(origin && allowedOrigins.includes(origin));
}
