import crypto from 'crypto';

// Generiere einen kryptographisch sicheren 32-Byte (256-bit) Secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('CONSENT_SECRET=' + secret);
console.log('\n--- Kopiere diesen Key in deine .env.local oder Vercel Environment Variables ---');
console.log(`CONSENT_SECRET=${secret}`);
