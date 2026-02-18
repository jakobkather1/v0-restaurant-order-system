import { type NextRequest, NextResponse } from "next/server"
import { getActiveOrders, getArchivedOrders, getOrderItems } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const archived = searchParams.get("archived") === "true"

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    const orders = archived
      ? await getArchivedOrders(Number.parseInt(restaurantId))
      : await getActiveOrders(Number.parseInt(restaurantId))

    // Get items for all orders
    const items: Record<number, Awaited<ReturnType<typeof getOrderItems>>> = {}
    for (const order of orders) {
      items[order.id] = await getOrderItems(order.id)
    }

    return NextResponse.json({ orders, items })
  } catch (error) {
    // Return empty data on error instead of crashing
    console.error("Orders API error:", (error as Error).message)
    return NextResponse.json({ orders: [], items: {} })
  }
}
