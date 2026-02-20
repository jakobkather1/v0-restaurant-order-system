import { getPool } from "@/lib/db"
import { NextRequest } from "next/server"

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Use Node.js runtime for pg connection

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get("restaurantId")

  if (!restaurantId) {
    return new Response(JSON.stringify({ error: "Restaurant ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  console.log(`[v0] Realtime connection requested for restaurant ${restaurantId}`)

  // Create a TransformStream for SSE
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Set up PostgreSQL LISTEN in a separate async function
  const setupListener = async () => {
    const pool = getPool()
    const client = await pool.connect()
    
    const channelName = `order_events_${restaurantId}`
    
    try {
      console.log(`[v0] Setting up LISTEN on channel: ${channelName}`)
      
      // Start listening on the restaurant-specific channel
      await client.query(`LISTEN ${channelName}`)
      
      // Send initial connection success message
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', restaurantId })}\n\n`)
      )
      
      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        writer.write(encoder.encode(`: keepalive\n\n`)).catch(() => {
          clearInterval(keepaliveInterval)
        })
      }, 30000)
      
      // Handle notifications from PostgreSQL
      client.on('notification', async (msg) => {
        console.log(`[v0] Received notification on ${msg.channel}:`, msg.payload)
        
        try {
          const payload = JSON.parse(msg.payload || '{}')
          
          // Send to client via SSE
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          )
        } catch (error) {
          console.error('[v0] Error processing notification:', error)
        }
      })
      
      // Handle client disconnect
      request.signal.addEventListener('abort', async () => {
        console.log(`[v0] Client disconnected from realtime channel ${channelName}`)
        clearInterval(keepaliveInterval)
        
        try {
          await client.query(`UNLISTEN ${channelName}`)
          client.release()
        } catch (error) {
          console.error('[v0] Error during cleanup:', error)
        }
        
        await writer.close()
      })
      
    } catch (error) {
      console.error('[v0] Error setting up listener:', error)
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to setup listener' })}\n\n`)
      )
      client.release()
      await writer.close()
    }
  }

  // Start the listener asynchronously
  setupListener()

  // Return SSE stream
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  })
}
