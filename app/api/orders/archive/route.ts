import { type NextRequest, NextResponse } from "next/server"
import { getArchivedOrders, getOrderItems } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get("restaurantId")

  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
  }

  const orders = await getArchivedOrders(Number.parseInt(restaurantId))

  const items: Record<number, Awaited<ReturnType<typeof getOrderItems>>> = {}
  for (const order of orders) {
    items[order.id] = await getOrderItems(order.id)
  }

  return NextResponse.json({ orders, items })
}
