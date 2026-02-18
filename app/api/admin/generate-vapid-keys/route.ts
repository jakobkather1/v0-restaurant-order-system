import { NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

/**
 * Generate valid VAPID keys for Web Push Notifications
 * Uses Node.js crypto to create P-256 elliptic curve keys
 */
export async function GET() {
  try {
    console.log("[v0] Generating VAPID keys...")
    
    // Generate P-256 (prime256v1) elliptic curve key pair
    const ecdh = crypto.createECDH('prime256v1')
    ecdh.generateKeys()

    // Get raw keys
    const publicKeyBuffer = ecdh.getPublicKey()  // 65 bytes (uncompressed)
    const privateKeyBuffer = ecdh.getPrivateKey() // 32 bytes

    // Validate
    if (publicKeyBuffer.length !== 65) {
      throw new Error(`Invalid public key length: ${publicKeyBuffer.length} (expected 65)`)
    }

    if (publicKeyBuffer[0] !== 0x04) {
      throw new Error(`Invalid public key format: first byte is ${publicKeyBuffer[0]} (expected 0x04)`)
    }

    if (privateKeyBuffer.length !== 32) {
      throw new Error(`Invalid private key length: ${privateKeyBuffer.length} (expected 32)`)
    }

    // Convert to base64url (URL-safe base64 without padding)
    const publicKeyBase64 = publicKeyBuffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const privateKeyBase64 = privateKeyBuffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    console.log("[v0] VAPID keys generated successfully")
    console.log("[v0] Public key length:", publicKeyBase64.length, "chars")
    console.log("[v0] Private key length:", privateKeyBase64.length, "chars")

    return NextResponse.json({
      success: true,
      keys: {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        email: "mailto:admin@order-terminal.de"
      },
      validation: {
        publicKeyBytes: publicKeyBuffer.length,
        privateKeyBytes: privateKeyBuffer.length,
        publicKeyChars: publicKeyBase64.length,
        privateKeyChars: privateKeyBase64.length,
        startsWithUncompressedIndicator: publicKeyBuffer[0] === 0x04
      },
      instructions: [
        "1. Copy NEXT_PUBLIC_VAPID_PUBLIC_KEY value to Vercel Environment Variables",
        "2. Copy VAPID_PRIVATE_KEY value to Vercel Environment Variables", 
        "3. Copy VAPID_EMAIL value to Vercel Environment Variables",
        "4. Redeploy your application (Environment variables require a new deployment)",
        "5. Test with /verify-push-setup"
      ]
    })
  } catch (error) {
    console.error("[v0] Failed to generate VAPID keys:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
