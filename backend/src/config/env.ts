import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local');
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://erp:erp_dev_password@localhost:5432/erp_pos',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};
