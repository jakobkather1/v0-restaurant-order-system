import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] VAPID key API called")
  
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  console.log("[v0] VAPID public key exists:", !!publicKey)
  if (publicKey) {
    console.log("[v0] VAPID public key length:", publicKey.length)
    console.log("[v0] VAPID public key preview:", publicKey.substring(0, 20) + "...")
  }

  if (!publicKey) {
    console.error("[v0] VAPID public key not configured in environment variables")
    return NextResponse.json(
      { error: "VAPID public key not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable." },
      { status: 500 }
    )
  }

  // Validate key format (should be base64url)
  if (publicKey.length < 80) {
    console.error("[v0] VAPID public key seems too short:", publicKey.length)
    return NextResponse.json(
      { error: "VAPID public key appears invalid (too short)" },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}
