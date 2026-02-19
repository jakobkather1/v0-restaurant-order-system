import { NextRequest } from 'next/server'
import { sql } from '@neondatabase/serverless'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events (SSE) endpoint for real-time order updates
 * Clients subscribe to this endpoint to receive instant notifications when new orders arrive
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get('restaurantId')

  if (!restaurantId) {
    return new Response('Missing restaurantId', { status: 400 })
  }

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Track the last order ID we've seen
  let lastOrderId = 0

  // Initialize last order ID from database
  try {
    const result = await sql`
      SELECT id FROM orders 
      WHERE restaurant_id = ${Number(restaurantId)} 
      AND status != 'completed' AND status != 'cancelled'
      ORDER BY id DESC 
      LIMIT 1
    `
    if (result.length > 0) {
      lastOrderId = result[0].id
    }
  } catch (error) {
    console.error('[v0] SSE: Failed to get initial order ID:', error)
  }

  // Send initial connection message
  const sendMessage = async (data: any) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
      )
    } catch (error) {
      console.error('[v0] SSE: Failed to send message:', error)
    }
  }

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: heartbeat\n\n`))
    } catch (error) {
      clearInterval(heartbeatInterval)
      clearInterval(checkInterval)
    }
  }, 30000)

  // Check for new orders every 3 seconds
  const checkInterval = setInterval(async () => {
    try {
      const result = await sql`
        SELECT id, order_number, customer_name, total_price, order_type, status, created_at
        FROM orders 
        WHERE restaurant_id = ${Number(restaurantId)} 
        AND id > ${lastOrderId}
        AND status != 'completed' AND status != 'cancelled'
        ORDER BY id ASC
      `

      if (result.length > 0) {
        // New orders found!
        for (const order of result) {
          await sendMessage({
            type: 'new_order',
            order: {
              id: order.id,
              order_number: order.order_number,
              customer_name: order.customer_name,
              total_price: order.total_price,
              order_type: order.order_type,
              status: order.status,
              created_at: order.created_at,
            }
          })
          lastOrderId = Math.max(lastOrderId, order.id)
        }
      }
    } catch (error) {
      console.error('[v0] SSE: Failed to check for new orders:', error)
    }
  }, 3000)

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    console.log('[v0] SSE: Client disconnected')
    clearInterval(heartbeatInterval)
    clearInterval(checkInterval)
    writer.close()
  })

  // Send initial connection success message
  await sendMessage({ type: 'connected', message: 'Listening for new orders' })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
