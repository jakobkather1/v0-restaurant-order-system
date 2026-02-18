import { sql } from "@/lib/db"

interface PushSubscription {
  id: number
  endpoint: string
  p256dh: string
  auth: string
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
}

/**
 * Sends push notifications to all active subscriptions for a restaurant
 * Uses dynamic import to avoid build-time issues with web-push
 */
export async function sendPushToAdmins(
  restaurantId: number,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  console.log("PUSH-SENDER: Called for restaurant:", restaurantId)
  console.log("PUSH-SENDER: Payload:", JSON.stringify(payload))

  try {
    // Get all active push subscriptions for this restaurant
    console.log("PUSH-SENDER: Querying database for subscriptions...")
    const subscriptions = await sql<PushSubscription[]>`
      SELECT id, endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE restaurant_id = ${restaurantId}
      AND is_active = true
    `

    console.log("PUSH-SENDER: Found " + subscriptions.length + " push subscriptions for restaurant:", restaurantId)

    if (subscriptions.length === 0) {
      console.log("[v0] No active subscriptions, skipping push")
      return { success: 0, failed: 0 }
    }

    // Dynamic import of web-push to avoid build-time issues
    console.log("PUSH-SENDER: Dynamically importing web-push module...")
    let webpush
    try {
      webpush = await import("web-push")
      console.log("PUSH-SENDER: web-push imported successfully")
    } catch (importError) {
      console.log("PUSH-SENDER: web-push module not available (this is expected in some environments)")
      console.log("PUSH-SENDER: Push notifications disabled, continuing normally")
      return { success: 0, failed: 0 }
    }

    // Set VAPID details - ONLY use NEXT_PUBLIC_VAPID_PUBLIC_KEY (no fallbacks)
    // Apply strict validation: trim whitespace and ensure mailto: prefix
    const vapidPublicKeyRaw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    const vapidPrivateKeyRaw = process.env.VAPID_PRIVATE_KEY || null
    const vapidEmailRaw = process.env.VAPID_EMAIL || null

    console.log("PUSH-SENDER: VAPID environment variables check:", {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!vapidPublicKeyRaw,
      VAPID_PRIVATE_KEY: !!vapidPrivateKeyRaw,
      VAPID_EMAIL: !!vapidEmailRaw
    })

    if (!vapidPublicKeyRaw) {
      console.error("PUSH-SENDER: ❌ CRITICAL: NEXT_PUBLIC_VAPID_PUBLIC_KEY not found in environment!")
      console.error("PUSH-SENDER: Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel env vars")
      return { success: 0, failed: 0 }
    }

    if (!vapidPrivateKeyRaw) {
      console.error("PUSH-SENDER: ❌ CRITICAL: VAPID_PRIVATE_KEY not found in environment!")
      console.error("PUSH-SENDER: Set VAPID_PRIVATE_KEY in Vercel env vars (server-side only)")
      return { success: 0, failed: 0 }
    }

    if (!vapidEmailRaw) {
      console.error("PUSH-SENDER: ❌ CRITICAL: VAPID_EMAIL not found in environment!")
      console.error("PUSH-SENDER: Set VAPID_EMAIL in Vercel env vars")
      return { success: 0, failed: 0 }
    }

    // Strict validation and sanitization
    const vapidPublicKey = vapidPublicKeyRaw.trim()
    const vapidPrivateKey = vapidPrivateKeyRaw.trim()
    const vapidEmailClean = vapidEmailRaw.trim()
    
    // Ensure mailto: prefix
    const vapidSubject = vapidEmailClean.startsWith('mailto:') 
      ? vapidEmailClean 
      : `mailto:${vapidEmailClean}`

    // Diagnostic logs for key lengths (not the keys themselves!)
    console.log("PUSH-SENDER: VAPID Key Diagnostics:", {
      publicKeyLength: vapidPublicKey.length,
      privateKeyLength: vapidPrivateKey.length,
      subject: vapidSubject,
      hasMailtoPrefix: vapidSubject.startsWith('mailto:')
    })

    // Validate key lengths (P-256 keys should be ~87-88 chars for public, ~43 for private)
    if (vapidPublicKey.length < 80 || vapidPublicKey.length > 90) {
      console.error("PUSH-SENDER: ⚠️ WARNING: Public key length unusual:", vapidPublicKey.length, "(expected ~87-88)")
    }
    
    if (vapidPrivateKey.length < 40 || vapidPrivateKey.length > 50) {
      console.error("PUSH-SENDER: ⚠️ WARNING: Private key length unusual:", vapidPrivateKey.length, "(expected ~43)")
    }

    console.log("PUSH-SENDER: ✓ All VAPID credentials validated, setting up web-push...")

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )

    console.log("PUSH-SENDER: ✅ VAPID Keys loaded & trimmed. Starting send-out...")
    console.log("PUSH-SENDER: Preparing to send to", subscriptions.length, "subscription(s)")

    // Send push notification to each subscription
    let successCount = 0
    let failedCount = 0

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )

        console.log("PUSH-SENDER: ✓ Sent successfully to subscription:", sub.id)
        successCount++
      } catch (error: any) {
        console.error("PUSH-SENDER: ✗ Failed to send to subscription:", sub.id)
        console.error("PUSH-SENDER: Error Details:", {
          message: error?.message,
          statusCode: error?.statusCode,
          body: error?.body
        })
        failedCount++

        // Auto-cleanup invalid subscriptions
        if (error?.statusCode === 410) {
          // 410 Gone: Subscription expired or unsubscribed
          console.log("PUSH-SENDER: Subscription expired (410 Gone), removing from database:", sub.id)
          await sql`
            DELETE FROM push_subscriptions
            WHERE id = ${sub.id}
          `
        } else if (error?.statusCode === 403) {
          // 403 Forbidden: Usually BadJwtToken or VAPID mismatch - subscription is permanently invalid
          console.log("PUSH-SENDER: Subscription has VAPID mismatch (403 Forbidden), removing from database:", sub.id)
          console.log("PUSH-SENDER: This subscription was created with different VAPID keys")
          await sql`
            DELETE FROM push_subscriptions
            WHERE id = ${sub.id}
          `
        }
      }
    })

    await Promise.all(pushPromises)

    console.log("PUSH-SENDER: === SUMMARY ===")
    console.log("PUSH-SENDER: Total subscriptions:", subscriptions.length)
    console.log("PUSH-SENDER: Successful sends:", successCount)
    console.log("PUSH-SENDER: Failed sends:", failedCount)

    return { success: successCount, failed: failedCount }
  } catch (error) {
    console.error("PUSH-SENDER: CRITICAL ERROR:", error instanceof Error ? error.message : error)
    console.error("PUSH-SENDER: Error stack:", error instanceof Error ? error.stack : "No stack")
    return { success: 0, failed: 0 }
  }
}

/**
 * Creates an in-app notification as a fallback/supplement to push notifications
 */
export async function createInAppNotification(
  restaurantId: number,
  title: string,
  message: string,
  orderUrl?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_notifications (
        restaurant_id,
        title,
        message,
        link,
        is_read,
        created_at
      ) VALUES (
        ${restaurantId},
        ${title},
        ${message},
        ${orderUrl || null},
        false,
        NOW()
      )
    `
    console.log("[v0] In-app notification created for restaurant:", restaurantId)
  } catch (error) {
    console.error("[v0] Error creating in-app notification:", error)
  }
}
