import { NextResponse } from "next/server"

/**
 * Test endpoint to verify push notification configuration
 * Access via: /api/admin/push/test
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ? `Set (${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length} chars)`
        : "NOT SET",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY
        ? `Set (${process.env.VAPID_PRIVATE_KEY.length} chars)`
        : "NOT SET",
      VAPID_EMAIL: process.env.VAPID_EMAIL || "NOT SET",
    },
    validation: {
      publicKeyValid:
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length >= 80,
      privateKeyValid:
        process.env.VAPID_PRIVATE_KEY &&
        process.env.VAPID_PRIVATE_KEY.length >= 40,
      emailValid: !!process.env.VAPID_EMAIL,
    },
    recommendations: [] as string[],
  }

  // Add recommendations
  if (!diagnostics.validation.publicKeyValid) {
    diagnostics.recommendations.push(
      "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable with a valid VAPID public key"
    )
  }
  if (!diagnostics.validation.privateKeyValid) {
    diagnostics.recommendations.push(
      "Set VAPID_PRIVATE_KEY environment variable with a valid VAPID private key"
    )
  }
  if (!diagnostics.validation.emailValid) {
    diagnostics.recommendations.push(
      "Set VAPID_EMAIL environment variable with a contact email"
    )
  }

  const allValid = Object.values(diagnostics.validation).every((v) => v)

  return NextResponse.json({
    status: allValid ? "OK" : "Configuration incomplete",
    ...diagnostics,
  })
}
