import { useEffect, useRef, useState, useCallback } from 'react'

export interface StreamedOrder {
  id: number
  order_number: string
  customer_name: string
  total_price: number
  order_type: string
  status: string
  created_at: string
}

interface UseOrderStreamOptions {
  restaurantId: number
  onNewOrder?: (order: StreamedOrder) => void
  enabled?: boolean
}

/**
 * Custom hook for real-time order updates using Server-Sent Events (SSE)
 * Provides instant push notifications when new orders arrive without polling
 */
export function useOrderStream({ restaurantId, onNewOrder, enabled = true }: UseOrderStreamOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    console.log('[v0] SSE: Connecting to order stream...')
    
    try {
      const eventSource = new EventSource(
        `/api/orders/stream?restaurantId=${restaurantId}`
      )

      eventSource.onopen = () => {
        console.log('[v0] SSE: Connected successfully')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log('[v0] SSE:', data.message)
          } else if (data.type === 'new_order' && data.order) {
            console.log('[v0] SSE: New order received:', data.order.order_number)
            onNewOrder?.(data.order)
          }
        } catch (err) {
          console.error('[v0] SSE: Failed to parse message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[v0] SSE: Connection error:', err)
        setIsConnected(false)
        setError('Connection error')
        eventSource.close()

        // Implement exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        
        console.log(`[v0] SSE: Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttempts.current})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect()
          }
        }, backoffDelay)
      }

      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('[v0] SSE: Failed to create EventSource:', err)
      setError('Failed to connect')
    }
  }, [restaurantId, onNewOrder, enabled])

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      console.log('[v0] SSE: Cleaning up connection')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect, enabled])

  return { isConnected, error }
}
