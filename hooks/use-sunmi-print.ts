import { useState, useEffect, useCallback, useRef } from 'react'

interface SunmiPrintRequest {
  restaurantId: string
  orderNumber: string
  orderType: 'delivery' | 'pickup'
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerNotes?: string
  items: Array<{
    quantity: number
    name: string
    variant?: string
    price: number
    basePrice?: number
    toppings: Array<{ 
      name: string
      price?: number 
    }>
    notes?: string
  }>
  subtotal: number
  discountAmount?: number
  deliveryFee?: number
  total: number
  paymentMethod: 'cash' | 'card' | 'online'
  createdAt: string
  estimatedTime?: string
}

interface SunmiPrintResponse {
  success: boolean
  message: string
  method?: 'sunmi' | 'browser'
}

const SUNMI_SERVICE_URL = 'http://127.0.0.1:8888'

export function useSunmiPrint() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const isChecking = useRef(false)

  const checkSunmiService = useCallback(async () => {
    // Early exit if already checking or not in browser
    if (isChecking.current || typeof window === 'undefined') return
    
    isChecking.current = true
    
    try {
      // Wrap entire check in try-catch to prevent any unhandled errors
      // In v0 HTTPS preview, localhost HTTP calls will fail with Mixed Content or CORS errors
      const response = await fetch(`${SUNMI_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      }).catch((fetchError) => {
        // Silently catch fetch errors (CORS, Mixed Content, Network errors)
        console.log('[v0] Sunmi service fetch blocked (expected in preview):', fetchError.message)
        return null
      })
      
      if (response && response.ok) {
        const data = await response.json().catch(() => null)
        const isReady = data?.status === 'ready'
        setIsAvailable(isReady)
      } else {
        setIsAvailable(false)
      }
    } catch (error) {
      // Catch any unexpected errors to prevent React crash
      console.log('[v0] Sunmi service check failed silently:', error instanceof Error ? error.message : 'Unknown error')
      setIsAvailable(false)
    } finally {
      isChecking.current = false
    }
  }, [])

  useEffect(() => {
    checkSunmiService()
    
    // Check every 30 seconds
    const interval = setInterval(checkSunmiService, 30000)
    
    return () => clearInterval(interval)
  }, [checkSunmiService])

  const print = useCallback(async (request: SunmiPrintRequest): Promise<SunmiPrintResponse> => {
    console.log('[v0] Print requested - Sunmi available:', isAvailable)
    
    if (!isAvailable) {
      console.log('[v0] Sunmi not available - service not running')
      return {
        success: false,
        message: 'Sunmi Print Service ist nicht verfügbar',
        method: 'browser'
      }
    }

    try {
      console.log('[v0] Sending print request to Sunmi service')
      console.log('[v0] Request data:', JSON.stringify({
        orderNumber: request.orderNumber,
        itemCount: request.items.length,
        customerName: request.customerName,
        customerAddress: request.customerAddress,
        customerNotes: request.customerNotes,
        subtotal: request.subtotal,
        deliveryFee: request.deliveryFee,
        total: request.total,
        paymentMethod: request.paymentMethod,
        estimatedTime: request.estimatedTime,
        items: request.items.map(item => ({
          name: item.name,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
          toppingsCount: item.toppings?.length || 0,
          notes: item.notes
        }))
      }, null, 2))
      
      const response = await fetch(`${SUNMI_SERVICE_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000),
      })

      const data = await response.json()
      console.log('[v0] Sunmi print response:', data)

      return {
        ...data,
        method: 'sunmi'
      }
    } catch (error) {
      console.error('[v0] Sunmi print failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        method: 'browser'
      }
    }
  }, [isAvailable])

  return {
    print,
    isSunmiAvailable: isAvailable,
    checkSunmiService
  }
}
