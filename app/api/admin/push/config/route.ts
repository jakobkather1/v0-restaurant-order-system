import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log("[v0] CONFIG-API: Push config API called")
  
  // ONLY use NEXT_PUBLIC_VAPID_PUBLIC_KEY - no fallbacks
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
  
  console.log("[v0] CONFIG-API: Environment check:", {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!publicKey
  })
  
  if (!publicKey) {
    console.error("[v0] CONFIG-API: ❌ CRITICAL: No VAPID public key found in environment")
    console.error("[v0] CONFIG-API: Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel Environment Variables")
    return NextResponse.json({ 
      publicKey: null,
      configured: false,
      error: "NEXT_PUBLIC_VAPID_PUBLIC_KEY not found in Vercel environment variables" 
    })
  }
  
  // TRIM whitespace that may have been accidentally added
  const trimmedKey = publicKey.trim()
  
  console.log("[v0] CONFIG-API: Raw key length after trim:", trimmedKey.length)
  console.log("[v0] CONFIG-API: Key preview:", trimmedKey.substring(0, 20) + "...")
  
  // Validate key format (should be base64url and reasonable length)
  if (trimmedKey.length < 80) {
    console.error("[v0] CONFIG-API: ❌ VAPID public key too short:", trimmedKey.length, "chars (need 80+)")
    return NextResponse.json({ 
      publicKey: null,
      configured: false,
      error: `Invalid key format: too short (${trimmedKey.length} chars, need 80+)`
    })
  }
  
  console.log("[v0] CONFIG-API: ✓ VAPID key validated successfully")
  
  return NextResponse.json({ 
    publicKey: trimmedKey,
    configured: true 
  })
}
