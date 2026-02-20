"use server"

import { sql, validateDiscountCode, isRestaurantOpen, getRestaurantByIdentifier } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { CartItem, DeliveryZone } from "@/lib/types"

interface OrderData {
  restaurantId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerNotes: string
  deliveryZoneId: number | null
  deliveryFee: number
  discountCode: string | null
  discountAmount: number
  items: CartItem[]
  orderType: "delivery" | "pickup"
  scheduledTime?: string
}

export async function createOrder(data: OrderData) {
  console.log("[v0] ==================== CREATE ORDER START ====================")
  console.log("[v0] DEBUG: createOrder called with restaurantId:", data.restaurantId)
  console.log("[v0] DEBUG: Customer:", data.customerName, "| Items:", data.items.length)
  
  // Calculate subtotal (food items only)
  console.log("[v0] DEBUG: Calculating subtotal...")
  const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0)
  console.log("[v0] DEBUG: Subtotal calculated:", subtotal)

  // For pickup orders, no delivery fee
  const deliveryFee = data.orderType === "pickup" ? 0 : data.deliveryFee
  console.log("[v0] DEBUG: Delivery fee:", deliveryFee, "| Order type:", data.orderType)

  // Calculate total
  const total = subtotal - data.discountAmount + deliveryFee
  console.log("[v0] DEBUG: Total calculated:", total)

  // Get next order number for this restaurant
  console.log("[v0] DEBUG: Getting next order number for restaurant:", data.restaurantId)
  const maxOrderNumberResult = await sql`
    SELECT COALESCE(MAX(order_number), 0) as max_order_number
    FROM orders
    WHERE restaurant_id = ${data.restaurantId}
  `
  const nextOrderNumber = (maxOrderNumberResult[0]?.max_order_number || 0) + 1
  console.log("[v0] DEBUG: Next order number:", nextOrderNumber)

  // Create order
  console.log("[v0] DEBUG: Attempting to INSERT order into database...")
  let orderResult
  try {
    orderResult = await sql`
      INSERT INTO orders (
        restaurant_id, order_number, customer_name, customer_email, customer_phone, customer_address, customer_notes,
        delivery_zone_id, delivery_fee, subtotal, discount_amount, discount_code_used, total, order_type, scheduled_time
      )
      VALUES (
        ${data.restaurantId}, ${nextOrderNumber}, ${data.customerName}, ${data.customerEmail || null}, ${data.customerPhone},
        ${data.orderType === "pickup" ? null : data.customerAddress}, ${data.customerNotes || null}, 
        ${data.orderType === "pickup" ? null : data.deliveryZoneId}, ${deliveryFee},
        ${subtotal}, ${data.discountAmount}, ${data.discountCode || null}, ${total}, ${data.orderType}, ${data.scheduledTime || null}
      )
      RETURNING id, order_number
    `
    console.log("[v0] DEBUG: Order INSERT successful, result:", JSON.stringify(orderResult))
  } catch (dbError) {
    console.error("[v0] DEBUG: ORDER INSERT FAILED:", dbError instanceof Error ? dbError.message : dbError)
    console.error("[v0] DEBUG: Full error:", JSON.stringify(dbError, null, 2))
    throw dbError
  }

  const orderId = orderResult[0].id
  console.log("[v0] DEBUG: Order ID extracted:", orderId)

  // Create order items
  console.log("[v0] DEBUG: Creating order items, count:", data.items.length)
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i]
    console.log("[v0] DEBUG: Processing item", i + 1, "of", data.items.length, ":", item.menuItem.name)
    
    const toppingPrice = item.toppingPrices
      ? Object.values(item.toppingPrices).reduce((sum, p) => sum + p, 0)
      : item.toppings.reduce((sum, t) => sum + Number(t.price), 0)

    try {
      const itemResult = await sql`
        INSERT INTO order_items (
          order_id, menu_item_id, item_name, variant_name, quantity, unit_price, total_price, notes
        )
        VALUES (
          ${orderId}, ${item.menuItem.id}, ${item.menuItem.name}, ${item.variant?.name || null},
          ${item.quantity}, ${item.totalPrice}, ${item.totalPrice * item.quantity}, ${item.notes || null}
        )
        RETURNING id
      `
      console.log("[v0] DEBUG: Order item inserted, ID:", itemResult[0].id)

      const orderItemId = itemResult[0].id

      // Create order item toppings with correct prices
      for (const topping of item.toppings) {
        const toppingPriceForItem = item.toppingPrices?.[topping.id] ?? Number(topping.price)
        await sql`
          INSERT INTO order_item_toppings (order_item_id, topping_name, topping_price)
          VALUES (${orderItemId}, ${topping.name}, ${toppingPriceForItem})
        `
      }
      console.log("[v0] DEBUG: Toppings inserted for item:", item.toppings.length)
    } catch (itemError) {
      console.error("[v0] DEBUG: ORDER ITEM INSERT FAILED:", itemError instanceof Error ? itemError.message : itemError)
      throw itemError
    }
  }
  console.log("[v0] DEBUG: All order items created successfully")

  // Increment discount code usage if used
  console.log("[v0] DEBUG: Checking discount code:", data.discountCode || "none")
  if (data.discountCode) {
    try {
      await sql`
        UPDATE discount_codes 
        SET usage_count = usage_count + 1 
        WHERE restaurant_id = ${data.restaurantId} AND code = ${data.discountCode.toUpperCase()}
      `
      console.log("[v0] DEBUG: Discount code usage incremented")
    } catch (discountError) {
      console.error("[v0] DEBUG: Discount update failed:", discountError)
    }
  }

  // Update monthly revenue
  console.log("[v0] DEBUG: Updating monthly revenue...")
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01"

  // Get restaurant fee config
  console.log("[v0] DEBUG: Getting restaurant by ID:", data.restaurantId)
  const restaurant = await getRestaurantByIdentifier(data.restaurantId.toString())
  console.log("[v0] DEBUG: Restaurant found:", restaurant ? restaurant.slug : "NOT FOUND")
  
  let feeAmount = 0
  if (restaurant) {
    if (restaurant.fee_type === "percentage") {
      feeAmount = (subtotal * Number(restaurant.fee_value)) / 100
    }
  }
  console.log("[v0] DEBUG: Fee amount calculated:", feeAmount)

  try {
    await sql`
      INSERT INTO monthly_revenue (restaurant_id, month, total_revenue, total_orders, fee_amount)
      VALUES (${data.restaurantId}, ${currentMonth}, ${subtotal}, 1, ${feeAmount})
      ON CONFLICT (restaurant_id, month)
      DO UPDATE SET 
        total_revenue = monthly_revenue.total_revenue + ${subtotal},
        total_orders = monthly_revenue.total_orders + 1,
        fee_amount = monthly_revenue.fee_amount + ${feeAmount}
    `
    console.log("[v0] DEBUG: Monthly revenue updated successfully")
  } catch (revenueError) {
    console.error("[v0] DEBUG: Monthly revenue update failed:", revenueError)
  }
  
  console.log("[v0] DEBUG: ========== NOW ENTERING PUSH NOTIFICATION TRIGGER ==========")

  // ============================================================================
  // PUSH NOTIFICATION TRIGGER - DIRECT EXECUTION (setImmediate doesn't work in Server Actions)
  // ============================================================================
  console.log("[v0] ========================================")
  console.log("[v0] NOTIFICATION TRIGGER START")
  console.log("[v0] Order ID:", orderId)
  console.log("[v0] Restaurant ID:", data.restaurantId)
  console.log("[v0] ========================================")
  
  // Direct execution - Server Actions wait for promises
  try {
    console.log("[v0] TRIGGER: Importing notification sender...")
    const { sendPushToAdmins, createInAppNotification } = await import("@/lib/notifications/sender")
    console.log("[v0] TRIGGER: Notification sender imported successfully")
    
    const notificationTitle = 'Neue Bestellung eingegangen!'
    const notificationMessage = `Bestellung #${nextOrderNumber} von ${data.customerName} - ${total.toFixed(2)}€`
    const orderUrl = restaurant?.slug ? `/${restaurant.slug}/admin/dashboard` : '/admin/dashboard'
    
    console.log("[v0] TRIGGER: Notification details:", {
      title: notificationTitle,
      message: notificationMessage,
      url: orderUrl,
      restaurantId: data.restaurantId
    })
    
    // 1. Create in-app notification (ALWAYS - even if push fails)
    console.log("[v0] TRIGGER: Creating in-app notification...")
    try {
      await createInAppNotification(
        data.restaurantId,
        notificationTitle,
        notificationMessage,
        orderUrl
      )
      console.log("[v0] TRIGGER: ✓ In-app notification created successfully")
    } catch (inAppError) {
      console.error("[v0] TRIGGER: ✗ In-app notification failed:", inAppError instanceof Error ? inAppError.message : inAppError)
    }
    
    // 2. Send push notification (may fail if no subscriptions or VAPID not configured)
    console.log("[v0] TRIGGER: Sending push notifications...")
    try {
      const pushResult = await sendPushToAdmins(data.restaurantId, {
        title: notificationTitle,
        body: notificationMessage,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: {
          url: orderUrl,
          orderId: orderId.toString(),
          restaurantId: data.restaurantId.toString()
        }
      })
      
      console.log("[v0] TRIGGER: ✓ Push notifications result:", {
        success: pushResult.success,
        failed: pushResult.failed,
        total: pushResult.success + pushResult.failed
      })
      
      if (pushResult.success === 0 && pushResult.failed === 0) {
        console.log("[v0] TRIGGER: ⚠ No push subscriptions found for restaurant:", data.restaurantId)
      } else if (pushResult.success > 0) {
        console.log("[v0] TRIGGER: ✓ Successfully sent to", pushResult.success, "device(s)")
      }
    } catch (pushError) {
      console.error("[v0] TRIGGER: ✗ Push notification failed:", pushError instanceof Error ? pushError.message : pushError)
    }
    
    console.log("[v0] TRIGGER: Notification trigger completed")
  } catch (error) {
    console.error("[v0] TRIGGER: CRITICAL ERROR in notification trigger:", error instanceof Error ? error.message : error)
    console.error("[v0] TRIGGER: Error stack:", error instanceof Error ? error.stack : "No stack trace")
  }

  console.log("[v0] DEBUG: Revalidating paths...")
  revalidatePath("/", "layout")
  
  console.log("[v0] ==================== CREATE ORDER COMPLETE ====================")
  console.log("[v0] DEBUG: Returning success with orderId:", orderId, "and orderNumber:", nextOrderNumber)
  return { success: true, orderId, orderNumber: nextOrderNumber }
}

export async function checkDiscountCode(restaurantId: number, code: string) {
  const discount = await validateDiscountCode(restaurantId, code)
  if (!discount) {
    return { valid: false, error: "Ungültiger Code" }
  }
  return {
    valid: true,
    discountType: discount.discount_type,
    discountValue: Number(discount.discount_value),
    minimumOrderValue: Number(discount.minimum_order_value) || 0,
  }
}

export async function checkRestaurantOpen(restaurantId: number) {
  const restaurant = await getRestaurantByIdentifier(restaurantId.toString())
  if (!restaurant) return false
  return isRestaurantOpen(restaurant.opening_hours || {})
}

export async function validateDeliveryZone(zones: DeliveryZone[], postalCode: string) {
  for (const zone of zones) {
    if (zone.postal_codes.length === 0) {
      continue
    }
    if (zone.postal_codes.includes(postalCode)) {
      return { valid: true, zone }
    }
  }
  const universalZone = zones.find((z) => z.postal_codes.length === 0)
  if (universalZone) {
    return { valid: true, zone: universalZone }
  }
  return { valid: false, error: "Ihre PLZ liegt außerhalb unseres Liefergebiets" }
}

export async function submitReview(formData: FormData) {
  const restaurantId = Number.parseInt(formData.get("restaurantId") as string)
  const customerName = formData.get("customerName") as string
  const email = formData.get("email") as string
  const rating = Number.parseInt(formData.get("rating") as string)
  const comment = formData.get("comment") as string

  if (!restaurantId || !customerName || !rating || !comment) {
    return { error: "Bitte alle Pflichtfelder ausfüllen" }
  }

  if (rating < 1 || rating > 5) {
    return { error: "Ungültige Bewertung" }
  }

  try {
    await sql`
      INSERT INTO reviews (restaurant_id, customer_name, customer_email, rating, comment, is_approved)
      VALUES (${restaurantId}, ${customerName}, ${email || null}, ${rating}, ${comment}, false)
    `
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Review submission error:", error)
    return { error: "Fehler beim Speichern der Bewertung" }
  }
}
