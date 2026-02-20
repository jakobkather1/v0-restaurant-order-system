'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface RealtimeOrderEvent {
  event: 'new_order'
  order_id: number
  restaurant_id: number
  order_number: number
  customer_name: string
  order_type: string
  total: number
  status: string
  created_at: string
}

interface UseRealtimeOrdersOptions {
  restaurantId: number
  enabled?: boolean
  onNewOrder?: (order: RealtimeOrderEvent) => void
  onError?: (error: Error) => void
}

export function useRealtimeOrders({
  restaurantId,
  enabled = true,
  onNewOrder,
  onError
}: UseRealtimeOrdersOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeOrderEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) {
      return
    }

    console.log('[v0] Connecting to realtime orders for restaurant:', restaurantId)

    try {
      const eventSource = new EventSource(
        `/api/orders/realtime?restaurantId=${restaurantId}`
      )

      eventSource.onopen = () => {
        console.log('[v0] Realtime connection established')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[v0] Realtime event received:', data)

          if (data.type === 'connected') {
            console.log('[v0] Realtime connection confirmed')
            return
          }

          if (data.event === 'new_order') {
            setLastEvent(data)
            onNewOrder?.(data)
          }
        } catch (error) {
          console.error('[v0] Error parsing realtime event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[v0] Realtime connection error:', error)
        setIsConnected(false)
        
        // Close the current connection
        eventSource.close()
        eventSourceRef.current = null

        // Attempt to reconnect after 3 seconds (fixed interval for reliability)
        reconnectAttemptsRef.current++
        const reconnectDelay = 3000

        console.log(`[v0] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current})`)

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectDelay)

        onError?.(new Error('Realtime connection lost'))
      }

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('[v0] Failed to create EventSource:', error)
      onError?.(error as Error)
    }
  }, [enabled, restaurantId, onNewOrder, onError])

  const disconnect = useCallback(() => {
    console.log('[v0] Disconnecting from realtime orders')
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect
  }
}
