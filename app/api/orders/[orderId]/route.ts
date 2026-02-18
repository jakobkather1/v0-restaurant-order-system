import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  try {
    const orders = await sql`
      SELECT o.*, r.name as restaurant_name, r.logo_url, r.primary_color, r.address as restaurant_address, r.phone as restaurant_phone
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ${orderId}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orders[0]

    const items = await sql`
      SELECT oi.*, 
        (SELECT json_agg(json_build_object('id', oit.id, 'topping_name', oit.topping_name, 'topping_price', oit.topping_price))
         FROM order_item_toppings oit WHERE oit.order_item_id = oi.id) as toppings
      FROM order_items oi WHERE oi.order_id = ${orderId}
    `

    return NextResponse.json({
      order: {
        ...order,
        items,
        order_type: order.order_type || "delivery",
        estimated_time: order.estimated_time || null,
      },
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
