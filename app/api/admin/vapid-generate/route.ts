import { NextResponse } from "next/server"
import webpush from "web-push"

export const dynamic = "force-dynamic"

/**
 * Generate REAL valid VAPID keys using web-push library
 * These keys are guaranteed to work with Web Push services
 */
export async function GET() {
  try {
    // Use web-push library to generate valid VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys()
    
    console.log("[v0] VAPID-GEN: Generated new VAPID keys")
    console.log("[v0] VAPID-GEN: Public key length:", vapidKeys.publicKey.length)
    console.log("[v0] VAPID-GEN: Private key length:", vapidKeys.privateKey.length)
    
    return NextResponse.json({
      success: true,
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      instructions: [
        "1. Copy these keys to Vercel Environment Variables",
        "2. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY to the publicKey value",
        "3. Set VAPID_PRIVATE_KEY to the privateKey value", 
        "4. Set VAPID_EMAIL to mailto:admin@order-terminal.de",
        "5. Redeploy your application",
        "IMPORTANT: These keys are a valid pair - do NOT modify them!"
      ]
    })
  } catch (error) {
    console.error("[v0] VAPID-GEN: Error generating keys:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
