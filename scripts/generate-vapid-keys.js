/**
 * Generate VAPID keys for Web Push Notifications
 * 
 * Run this script with: node scripts/generate-vapid-keys.js
 * 
 * Then add the output to your Vercel project environment variables:
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_EMAIL (your admin email, e.g., admin@yourdomain.com)
 */

// Using web-push library to generate VAPID keys
// If you don't have web-push installed, run: npm install web-push --save-dev

const crypto = require('crypto')

function generateVAPIDKeys() {
  // Generate VAPID keys using standard ECDSA P-256 curve (prime256v1)
  const ecdh = crypto.createECDH('prime256v1')
  ecdh.generateKeys()

  // Get the raw public key (65 bytes uncompressed: 0x04 + 32 bytes X + 32 bytes Y)
  const publicKeyBuffer = ecdh.getPublicKey()
  
  // Get the raw private key (32 bytes)
  const privateKeyBuffer = ecdh.getPrivateKey()

  // Convert to base64url format (required for VAPID)
  const publicKeyBase64 = publicKeyBuffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  
  const privateKeyBase64 = privateKeyBuffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  // Validate that public key is 65 bytes (uncompressed P-256)
  if (publicKeyBuffer.length !== 65) {
    throw new Error(`Invalid public key length: ${publicKeyBuffer.length} (expected 65)`)
  }

  // Validate that public key starts with 0x04 (uncompressed point indicator)
  if (publicKeyBuffer[0] !== 0x04) {
    throw new Error(`Invalid public key format: first byte is ${publicKeyBuffer[0]} (expected 0x04)`)
  }

  // Validate that private key is 32 bytes
  if (privateKeyBuffer.length !== 32) {
    throw new Error(`Invalid private key length: ${privateKeyBuffer.length} (expected 32)`)
  }

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
    publicKeyBytes: publicKeyBuffer.length,
    privateKeyBytes: privateKeyBuffer.length
  }
}

console.log('\n🔐 Generating VAPID Keys for Web Push Notifications...\n')

const keys = generateVAPIDKeys()

console.log('✅ VAPID Keys generated successfully!\n')
console.log('✓ Public key:', keys.publicKeyBytes, 'bytes (65 bytes uncompressed P-256)')
console.log('✓ Private key:', keys.privateKeyBytes, 'bytes (32 bytes)\n')
console.log('📋 Copy these EXACT values to your Vercel environment variables:\n')
console.log('═════════════════════════════════════════════════════════')
console.log('Variable: NEXT_PUBLIC_VAPID_PUBLIC_KEY')
console.log('Value:')
console.log(keys.publicKey)
console.log('Length:', keys.publicKey.length, 'characters (should be 87-88)')
console.log('═════════════════════════════════════════════════════════')
console.log('\nVariable: VAPID_PRIVATE_KEY')
console.log('Value:')
console.log(keys.privateKey)
console.log('Length:', keys.privateKey.length, 'characters (should be 43)')
console.log('═════════════════════════════════════════════════════════')
console.log('\nVariable: VAPID_EMAIL')
console.log('Value:')
console.log('mailto:admin@order-terminal.de')
console.log('(oder verwenden Sie Ihre eigene Admin-Email)')
console.log('═════════════════════════════════════════════════════════')
console.log('\n⚠️  WICHTIG:')
console.log('1. Kopieren Sie die KOMPLETTEN Keys (kein Whitespace am Anfang/Ende)')
console.log('2. Der PRIVATE KEY darf NIEMALS öffentlich geteilt werden')
console.log('3. Fügen Sie alle 3 Variables in Vercel ein: Settings → Environment Variables')
console.log('4. DEPLOYEN Sie neu (nicht nur Preview) - Env Vars brauchen Redeploy')
console.log('5. Testen Sie mit: /verify-push-setup\n')
console.log('📝 Diese Keys werden mit Node.js crypto Modul generiert und sind')
console.log('   im korrekten P-256 Format für Web Push Notifications.\n')
