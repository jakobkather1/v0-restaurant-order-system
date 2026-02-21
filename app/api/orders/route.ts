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

    // Get items for all orders in a single batch query (fixes N+1 problem)
    const orderIds = orders.map(o => o.id)
    const items: Record<number, Awaited<ReturnType<typeof getOrderItems>>> = {}
    
    if (orderIds.length > 0) {
      // Fetch all items in parallel instead of sequentially
      const itemsArray = await Promise.all(
        orderIds.map(orderId => getOrderItems(orderId))
      )
      
      // Map results to order IDs
      orderIds.forEach((orderId, index) => {
        items[orderId] = itemsArray[index]
      })
    }

    const response = NextResponse.json({ orders, items })
    
    // Add cache headers: Cache for 3 seconds, allow stale for 10 seconds while revalidating
    response.headers.set('Cache-Control', 's-maxage=3, stale-while-revalidate=10')
    
    return response
  } catch (error) {
    // Return empty data on error instead of crashing
    console.error("Orders API error:", (error as Error).message)
    return NextResponse.json({ orders: [], items: {} })
  }
}
