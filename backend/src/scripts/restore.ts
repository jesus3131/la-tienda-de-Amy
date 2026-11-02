import { execSync } from 'child_process';

const file = process.argv[2];
if (!file) { console.error('Usage: npm run restore -- <file.sql>'); process.exit(1); }
console.log('Restoring from:', file);
execSync(`docker exec -i erp-pos-db psql -U erp -d erp_pos < "${file}"`, { stdio: 'inherit' });
console.log('Restore completed');
