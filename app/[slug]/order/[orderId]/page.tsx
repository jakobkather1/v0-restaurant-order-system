import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { OrderConfirmation } from "@/components/terminal/order-confirmation"

async function getOrder(orderId: string, slug: string) {

  const orders = await sql`
    SELECT o.*, r.name as restaurant_name, r.logo_url, r.primary_color
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = ${orderId} AND r.slug = ${slug}
  `

  if (orders.length === 0) return null

  const order = orders[0]

  const items = await sql`
    SELECT * FROM order_items WHERE order_id = ${orderId}
  `

  return { ...order, items }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>
}) {
  const { slug, orderId } = await params
  const decodedSlug = decodeURIComponent(slug)
  const order = await getOrder(orderId, decodedSlug)

  if (!order) {
    notFound()
  }

  return <OrderConfirmation order={order} slug={slug} />
}
