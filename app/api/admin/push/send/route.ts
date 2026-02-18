import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Lazy-load web-push only when actually sending notifications
async function getWebPush() {
  const webpush = await import("web-push")
  
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@example.com"

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
  }
  
  return webpush
}

export async function POST(request: NextRequest) {
  console.log("PUSH-API: Started. Request received.")
  
  try {
    const body = await request.json()
    const { restaurantId, title, message, orderUrl } = body

    console.log("PUSH-API: Parsed body:", { restaurantId, title, message: message?.substring(0, 50) })

    if (!restaurantId) {
      console.error("PUSH-API: Missing restaurant ID")
      return NextResponse.json(
        { error: "Missing restaurant ID" },
        { status: 400 }
      )
    }

    // Check if VAPID keys are configured
    const hasPublicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY
    console.log("PUSH-API: VAPID keys configured:", { publicKey: hasPublicKey ? "YES" : "NO", privateKey: hasPrivateKey ? "YES" : "NO" })

    if (!hasPublicKey || !hasPrivateKey) {
      console.warn("PUSH-API: VAPID keys not configured, skipping push notification")
      return NextResponse.json({ 
        success: false, 
        message: "Push notifications not configured - VAPID keys missing" 
      })
    }

    console.log("PUSH-API: Looking for subscriptions for restaurant:", restaurantId)

    // Get active subscriptions
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE restaurant_id = ${restaurantId}
      AND is_active = true
    `

    console.log("PUSH-API: Found", subscriptions.length, "subscriptions")

    if (subscriptions.length === 0) {
      console.log("PUSH-API: No active subscriptions found for restaurant", restaurantId)
      return NextResponse.json({ 
        success: true, 
        sent: 0,
        message: "No active subscriptions" 
      })
    }

    console.log("PUSH-API: Attempting to send push to", subscriptions.length, "subscribers")
    
    const webpush = await getWebPush()
    console.log("PUSH-API: web-push module loaded")
    
    const payload = JSON.stringify({
      title: title || "Neue Bestellung",
      body: message || "Sie haben eine neue Bestellung erhalten",
      tag: "order-notification",
      data: {
        url: orderUrl || "/admin/dashboard",
      },
    })

    let sentCount = 0
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        sentCount++
      } catch (error: any) {
        console.error("[v0] Error sending to subscription:", error.message)
        
        // Deactivate subscription if it's no longer valid
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`
            UPDATE push_subscriptions
            SET is_active = false
            WHERE endpoint = ${sub.endpoint}
          `
        }
      }
    })

    await Promise.allSettled(sendPromises)

    console.log("PUSH-API: Completed. Sent:", sentCount, "of", subscriptions.length)

    return NextResponse.json({ success: true, sent: sentCount, total: subscriptions.length })
  } catch (error) {
    console.error("PUSH-API: CRITICAL ERROR:", error instanceof Error ? error.message : error)
    console.error("PUSH-API: Full error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send notifications" },
      { status: 500 }
    )
  }
}
