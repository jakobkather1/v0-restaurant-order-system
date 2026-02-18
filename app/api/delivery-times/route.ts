import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const deliveryZoneId = searchParams.get("deliveryZoneId")
    const orderType = searchParams.get("orderType") // "pickup" or "delivery"

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    // For pickup: get entry where delivery_zone_id IS NULL
    // For delivery: get entry for specific delivery zone
    let result
    
    if (orderType === "pickup") {
      result = await sql`
        SELECT preparation_minutes
        FROM delivery_times
        WHERE restaurant_id = ${restaurantId}
          AND delivery_zone_id IS NULL
        LIMIT 1
      `
    } else if (deliveryZoneId) {
      result = await sql`
        SELECT preparation_minutes
        FROM delivery_times
        WHERE restaurant_id = ${restaurantId}
          AND delivery_zone_id = ${deliveryZoneId}::int
        LIMIT 1
      `
    } else {
      // No zone specified for delivery - return error or default
      return NextResponse.json({ preparationMinutes: 30 })
    }

    const preparationMinutes = result[0]?.preparation_minutes || (orderType === "pickup" ? 15 : 30)

    return NextResponse.json({ preparationMinutes })
  } catch (error) {
    console.error("Error fetching delivery times:", error)
    return NextResponse.json({ error: "Failed to fetch delivery times" }, { status: 500 })
  }
}
