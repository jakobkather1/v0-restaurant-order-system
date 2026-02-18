import bcrypt from 'bcryptjs';

// Generate bcrypt hash for "maria"
const password = 'maria';
const hash = await bcrypt.hash(password, 10);

console.log('Generated bcrypt hash for password "maria":');
console.log(hash);
console.log('\nUse this SQL to update the database:');
console.log(`UPDATE super_admin_users SET password_hash = '${hash}' WHERE username = 'jakobkather';`);
