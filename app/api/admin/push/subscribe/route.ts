import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Push subscribe API called")
    
    const body = await request.json()
    const { restaurantId, subscription } = body

    console.log("[v0] Received subscription request for restaurant:", restaurantId)

    if (!restaurantId || !subscription) {
      console.error("[v0] Missing required fields:", { restaurantId: !!restaurantId, subscription: !!subscription })
      return NextResponse.json(
        { error: "Missing required fields: restaurantId and subscription are required" },
        { status: 400 }
      )
    }

    const { endpoint, keys } = subscription

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.error("[v0] Invalid subscription format:", subscription)
      return NextResponse.json(
        { error: "Invalid subscription format: endpoint, keys.p256dh, and keys.auth are required" },
        { status: 400 }
      )
    }

    const { p256dh, auth } = keys

    console.log("[v0] Saving push subscription for restaurant:", restaurantId)
    console.log("[v0] Endpoint:", endpoint.substring(0, 50) + "...")

    // Upsert subscription (update if exists, insert if not)
    const result = await sql`
      INSERT INTO push_subscriptions (
        restaurant_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        is_active
      ) VALUES (
        ${restaurantId},
        ${endpoint},
        ${p256dh},
        ${auth},
        ${request.headers.get("user-agent")},
        true
      )
      ON CONFLICT (restaurant_id, endpoint)
      DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        is_active = true,
        updated_at = NOW()
      RETURNING id
    `

    console.log("[v0] Push subscription saved successfully, ID:", result[0]?.id)

    return NextResponse.json({ 
      success: true,
      subscriptionId: result[0]?.id 
    })
  } catch (error) {
    console.error("[v0] Error saving push subscription:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: `Failed to save subscription: ${errorMessage}` },
      { status: 500 }
    )
  }
}
