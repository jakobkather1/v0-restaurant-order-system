import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Log VAPID status
    console.log("[v0] DIAGNOSTIC: Checking VAPID configuration...")
    console.log("[v0] DIAGNOSTIC: NEXT_PUBLIC_VAPID_PUBLIC_KEY:", !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, `(${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0} chars)`)
    console.log("[v0] DIAGNOSTIC: VAPID_PRIVATE_KEY:", !!process.env.VAPID_PRIVATE_KEY, `(${process.env.VAPID_PRIVATE_KEY?.length || 0} chars)`)
    console.log("[v0] DIAGNOSTIC: VAPID_EMAIL:", process.env.VAPID_EMAIL || "NOT SET")

    const allVapidConfigured = 
      !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && 
      !!process.env.VAPID_PRIVATE_KEY && 
      !!process.env.VAPID_EMAIL &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length >= 80 &&
      process.env.VAPID_PRIVATE_KEY.length >= 40

    console.log("[v0] DIAGNOSTIC: All VAPID keys valid:", allVapidConfigured)

    const diagnostic = {
      vapid: {
        publicKeyConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        privateKeyConfigured: !!process.env.VAPID_PRIVATE_KEY,
        emailConfigured: !!process.env.VAPID_EMAIL,
        publicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
        privateKeyLength: process.env.VAPID_PRIVATE_KEY?.length || 0,
        email: process.env.VAPID_EMAIL || null,
        allValid: allVapidConfigured,
        errors: [] as string[]
      },
      database: {
        subscriptionsTable: false,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        subscriptionsByRestaurant: [] as any[]
      },
      serviceWorker: {
        path: "/sw.js",
        expected: true
      }
    }

    // Collect VAPID errors
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      diagnostic.vapid.errors.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set")
    } else if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length < 80) {
      diagnostic.vapid.errors.push(`Public key too short (${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length} chars, need 80+)`)
    }

    if (!process.env.VAPID_PRIVATE_KEY) {
      diagnostic.vapid.errors.push("VAPID_PRIVATE_KEY not set")
    } else if (process.env.VAPID_PRIVATE_KEY.length < 40) {
      diagnostic.vapid.errors.push(`Private key too short (${process.env.VAPID_PRIVATE_KEY.length} chars, need 40+)`)
    }

    if (!process.env.VAPID_EMAIL) {
      diagnostic.vapid.errors.push("VAPID_EMAIL not set")
    }

    // Check database
    try {
      const subscriptions = await sql`
        SELECT 
          restaurant_id,
          COUNT(*) as total,
          SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
        FROM push_subscriptions
        GROUP BY restaurant_id
        ORDER BY restaurant_id
      `
      
      diagnostic.database.subscriptionsTable = true
      diagnostic.database.subscriptionsByRestaurant = subscriptions.map(s => ({
        restaurantId: s.restaurant_id,
        total: Number(s.total),
        active: Number(s.active)
      }))
      
      diagnostic.database.totalSubscriptions = subscriptions.reduce((sum, s) => sum + Number(s.total), 0)
      diagnostic.database.activeSubscriptions = subscriptions.reduce((sum, s) => sum + Number(s.active), 0)
    } catch (error) {
      console.error("[Diagnostic] Database error:", error)
    }

    return NextResponse.json(diagnostic)
  } catch (error) {
    console.error("[Diagnostic] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Diagnostic failed" },
      { status: 500 }
    )
  }
}
