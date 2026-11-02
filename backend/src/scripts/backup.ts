import { execSync } from 'child_process';
import fs from 'fs';

const file = process.argv[2] || `backup-${Date.now()}.sql`;
console.log('Creating backup:', file);
execSync(`docker exec erp-pos-db pg_dump -U erp -d erp_pos > "${file}"`, { stdio: 'inherit' });
console.log('Backup created:', file, fs.statSync(file).size, 'bytes');
