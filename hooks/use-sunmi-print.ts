import { useState, useEffect, useCallback } from 'react'

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
    toppings: Array<{ name: string }>
    notes?: string
  }>
  subtotal: number
  discountAmount?: number
  deliveryFee?: number
  total: number
  paymentMethod: 'cash' | 'card' | 'online'
  createdAt: string
}

interface SunmiPrintResponse {
  success: boolean
  message: string
  method?: 'sunmi' | 'browser'
}

const SUNMI_SERVICE_URL = 'http://127.0.0.1:8888'

export function useSunmiPrint() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkSunmiService = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    console.log('[v0] Checking Sunmi service at:', SUNMI_SERVICE_URL)
    
    try {
      const response = await fetch(`${SUNMI_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      
      if (response.ok) {
        const data = await response.json()
        const isReady = data.status === 'ready'
        console.log('[v0] Sunmi service health check:', data, 'Ready:', isReady)
        setIsAvailable(isReady)
      } else {
        console.log('[v0] Sunmi service health check failed with status:', response.status)
        setIsAvailable(false)
      }
    } catch (error) {
      console.log('[v0] Sunmi service not reachable:', error instanceof Error ? error.message : error)
      setIsAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }, [isChecking])

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
