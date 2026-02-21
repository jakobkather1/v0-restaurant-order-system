"use client"
import useSWR from "swr"
import { markOrderCompleted, updateOrderStatus, setOrderEstimatedTime } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, Phone, MapPin, Printer, RefreshCw, Timer, Truck, Store, Ban } from "lucide-react"
import type { Order, OrderItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback, useRef } from "react"

import { CancelOrderDialog } from "@/components/admin/cancel-order-dialog"
import { useSunmiPrint } from "@/hooks/use-sunmi-print"
import { toast } from "sonner"

interface OrdersTabProps {
  orders: Order[]
  restaurantId: number
}

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[v0] Orders fetch failed:', response.status)
      return { orders: [], items: {} }
    }
    return await response.json()
  } catch (error) {
    console.warn('[v0] Orders fetch error (expected in some preview environments):', error instanceof Error ? error.message : error)
    return { orders: [], items: {} }
  }
}

export function OrdersTab({ orders: initialOrders, restaurantId }: OrdersTabProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [completingOrderId, setCompletingOrderId] = useState<number | null>(null)
  
  // Track previous order IDs to detect new orders and unprinted orders
  const previousOrderIds = useRef<Set<number>>(new Set(initialOrders.map(o => o.id)))
  const unprintedOrderIds = useRef<Set<number>>(new Set())
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Sunmi Print Integration
  const { print: printToSunmi, isSunmiAvailable, checkSunmiService } = useSunmiPrint()
  
  useEffect(() => {
    checkSunmiService()
  }, [checkSunmiService])
  
  // Function to play a single beep
  const playBeep = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create a pleasant notification sound (two-tone beep)
      const oscillator1 = audioContext.createOscillator()
      const oscillator2 = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator1.connect(gainNode)
      oscillator2.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // First tone: 800Hz
      oscillator1.frequency.value = 800
      oscillator1.type = 'sine'
      
      // Second tone: 1000Hz (creates a pleasant harmony)
      oscillator2.frequency.value = 1000
      oscillator2.type = 'sine'
      
      // Volume envelope: quick fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
      
      // Play the sound
      oscillator1.start(audioContext.currentTime)
      oscillator2.start(audioContext.currentTime)
      oscillator1.stop(audioContext.currentTime + 0.3)
      oscillator2.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('[v0] Audio playback failed:', error)
    }
  }, [])
  
  // Function to start continuous alarm
  const startAlarm = useCallback(() => {
    console.log('[v0] Starting alarm')
    // Stop any existing alarm first
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
    }
    
    // Play first beep immediately
    playBeep()
    
    // Then repeat every 2 seconds
    alarmIntervalRef.current = setInterval(() => {
      console.log('[v0] Playing alarm beep')
      playBeep()
    }, 2000)
  }, [playBeep])
  
  // Function to stop alarm
  const stopAlarm = useCallback(() => {
    console.log('[v0] Stopping alarm')
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
      alarmIntervalRef.current = null
    }
  }, [])
  
  // Cleanup alarm on unmount
  useEffect(() => {
    return () => {
      stopAlarm()
    }
  }, [stopAlarm])

  const { data: activeData, mutate: mutateActive } = useSWR(`/api/orders?restaurantId=${restaurantId}`, fetcher, {
    fallbackData: { orders: initialOrders, items: {} },
    refreshInterval: 10000, // Poll every 10 seconds for new orders
    refreshWhenHidden: false, // Don't poll when tab is hidden to save resources
    refreshWhenOffline: false, // Don't poll when offline
    revalidateOnFocus: true, // Immediately check when user returns to tab
    dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    onError: (error) => {
      // Silently log errors to prevent React crash in iframe
      console.warn('[v0] SWR fetch error:', error)
    },
  })

  const orders = activeData?.orders || initialOrders
  const orderItems = activeData?.items || {}

  const [estimatedTimes, setEstimatedTimes] = useState<Record<number, string>>({})
  
  // Detect new orders and start alarm
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id))
    const newOrders = orders.filter(order => !previousOrderIds.current.has(order.id))
    
    console.log('[v0] Order detection:', {
      ordersCount: orders.length,
      previousCount: previousOrderIds.current.size,
      newOrdersCount: newOrders.length,
      newOrderIds: newOrders.map(o => o.id),
      unprintedCount: unprintedOrderIds.current.size
    })
    
    if (newOrders.length > 0) {
      console.log('[v0] New orders detected! Adding to unprinted set and starting alarm')
      // Add new orders to unprinted set
      newOrders.forEach(order => {
        unprintedOrderIds.current.add(order.id)
      })
      
      // Start alarm for unprinted orders
      if (unprintedOrderIds.current.size > 0) {
        startAlarm()
      }
    }
    
    // Update tracked order IDs
    previousOrderIds.current = currentOrderIds
  }, [orders, startAlarm])

  async function handleComplete(orderId: number) {
    // Set loading state for this specific order
    setCompletingOrderId(orderId)
    
    // Execute server action first
    try {
      const result = await markOrderCompleted(orderId)
      
      if (result.error) {
        toast.error('Fehler beim Archivieren der Bestellung')
        setCompletingOrderId(null)
        return
      }
      
      // Remove from unprinted set to stop alarm
      unprintedOrderIds.current.delete(orderId)
      
      // Stop alarm if no more unprinted orders
      if (unprintedOrderIds.current.size === 0) {
        stopAlarm()
      }
      
      // Success - mark order as completed in UI
      mutateActive(
        (currentData) => {
          if (!currentData) return currentData
          
          const updatedOrders = currentData.orders.map(o => 
            o.id === orderId ? { ...o, is_completed: true, status: 'completed' } : o
          )
          
          return {
            orders: updatedOrders,
            items: currentData.items
          }
        },
        {
          revalidate: false, // Don't fetch from server - trust our optimistic update
          populateCache: true, // Keep the optimistic data in cache
        }
      )
      
      toast.success('Bestellung erfolgreich erledigt')
      setCompletingOrderId(null)
    } catch (error) {
      toast.error('Fehler beim Archivieren der Bestellung')
      setCompletingOrderId(null)
    }
  }

  async function handleStatusChange(orderId: number, status: string) {
    // Optimistic UI update - immediately update status in UI
    const optimisticOrders = orders.map(o => 
      o.id === orderId ? { ...o, status } : o
    )
    
    mutate(
      async () => {
        await updateOrderStatus(orderId, status)
        const endpoint = viewMode === "active" 
          ? `/api/orders?restaurantId=${restaurantId}`
          : `/api/orders/archive?restaurantId=${restaurantId}`
        return fetch(endpoint).then(r => r.json())
      },
      {
        optimisticData: {
          orders: optimisticOrders,
          items: orderItems
        },
        rollbackOnError: true,
        revalidate: true
      }
    )
  }

  async function handleSetTime(orderId: number) {
    const timeStr = estimatedTimes[orderId]
    if (!timeStr) return
    const minutes = Number.parseInt(timeStr)
    if (isNaN(minutes) || minutes <= 0) return

    await setOrderEstimatedTime(orderId, minutes)
    setEstimatedTimes((prev) => ({ ...prev, [orderId]: "" }))
    mutate()
  }

  async function printOrder(order: Order, items: OrderItem[]) {
    console.log('[v0] Print button clicked for order:', order.id)
    // Mark order as printed and stop alarm if no more unprinted orders
    unprintedOrderIds.current.delete(order.id)
    console.log('[v0] Remaining unprinted orders:', unprintedOrderIds.current.size)
    if (unprintedOrderIds.current.size === 0) {
      stopAlarm()
    }
    
    // Try Sunmi first if available
    if (isSunmiAvailable) {
      const printData = {
        restaurantId: String(restaurantId),
        orderNumber: String(order.order_number || order.id),
        orderType: order.order_type as "delivery" | "pickup",
        customerName: order.customer_name || "Gast",
        customerPhone: order.customer_phone || "",
        customerAddress: order.customer_address || undefined,
        customerNotes: order.customer_notes || undefined,
        items: items.map(item => {
          // Ensure all item details are included
          const itemPrice = Number(item.total_price) || 0
          const basePrice = item.variant_price ? Number(item.variant_price) : Number(item.base_price) || 0
          
          return {
            quantity: item.quantity || 1,
            name: item.item_name || "Artikel",
            variant: item.variant_name || undefined,
            price: itemPrice,
            basePrice: basePrice,
            toppings: item.toppings?.map(t => ({ 
              name: t.topping_name,
              price: Number(t.price) || 0
            })) || [],
            notes: item.notes || undefined,
          }
        }),
        subtotal: Number(order.subtotal) || 0,
        discountAmount: order.discount_amount ? Number(order.discount_amount) : undefined,
        deliveryFee: order.delivery_fee ? Number(order.delivery_fee) : undefined,
        total: Number(order.total) || 0,
        paymentMethod: (order.payment_method || "cash") as "cash" | "card" | "online",
        createdAt: order.created_at,
        estimatedTime: order.estimated_time_minutes ? `${order.estimated_time_minutes} min` : undefined,
      }
      
      const result = await printToSunmi(printData)
      
      if (result.success) {
        toast.success('Bon wurde gedruckt')
        return
      } else {
        toast.error('Sunmi-Druck fehlgeschlagen')
      }
    }
    
    // Fallback to browser print
    browserPrint(order, items)
  }

  function browserPrint(order: Order, items: OrderItem[]) {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.")
      toast.error("Popup wurde blockiert")
      return
    }

    const orderTypeLabel = order.order_type === "pickup" ? "ABHOLUNG" : "LIEFERUNG"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bestellung #${order.order_number || order.id}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 3mm; size: 57mm auto; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 32px; 
              width: 57mm; 
              margin: 0 auto; 
              padding: 3mm;
              line-height: 1.3;
            }
            h1 { 
              font-size: 40px; 
              margin: 0 0 5px; 
              text-align: center;
              font-weight: bold;
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 5px 0; 
            }
            .thick-divider { 
              border-top: 2px solid #000; 
              margin: 5px 0; 
            }
            .item { 
              margin: 3px 0; 
            }
            .item-line {
              display: flex;
              justify-content: space-between;
              gap: 3px;
            }
            .item-name {
              flex: 1;
              font-weight: bold;
              word-wrap: break-word;
              font-size: 32px;
            }
            .item-price {
              white-space: nowrap;
              font-weight: bold;
              font-size: 32px;
            }
            .topping { 
              padding-left: 10px; 
              font-size: 28px; 
              color: #333;
              margin: 2px 0;
              line-height: 1.3;
            }
            .item-variant {
              font-size: 28px;
              padding-left: 10px;
              color: #555;
              font-style: italic;
              margin: 1px 0;
            }
            .total { 
              font-weight: bold; 
              font-size: 38px; 
              margin-top: 5px;
              text-align: right;
            }
            .order-type { 
              font-weight: bold; 
              font-size: 38px; 
              text-align: center; 
              padding: 5px; 
              border: 2px solid #000; 
              margin-bottom: 5px;
              background: #000;
              color: #fff;
            }
            .section { 
              margin: 4px 0;
              font-size: 28px;
            }
            .label { 
              font-weight: bold;
              font-size: 28px;
            }
            .payment-badge {
              font-weight: bold; 
              text-align: center; 
              padding: 6px; 
              font-size: 32px;
              margin-top: 5px;
              border: 2px solid #000;
            }
            .payment-cash {
              background: #fef3c7;
              border-color: #f59e0b;
              color: #92400e;
            }
            .payment-online {
              background: #d1fae5;
              border-color: #10b981;
              color: #065f46;
            }
            .summary {
              font-size: 30px;
            }
          </style>
          <script>
            function doPrint() {
              try {
                window.print();
              } catch(e) {
                alert('Druckfehler: ' + e.message);
              }
            }
            
            // Try auto-print but don't fail if it doesn't work
            window.onload = function() {
              // On mobile/Android, auto-print often fails - show button instead
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
              
              if (!isMobile) {
                // Desktop: try auto-print
                setTimeout(function() {
                  doPrint();
                  setTimeout(function() { window.close(); }, 1000);
                }, 300);
              } else {
                // Mobile: show print button
                document.getElementById('print-btn').style.display = 'block';
              }
            }
            
            window.onafterprint = function() {
              window.close();
            }
          </script>
        </head>
        <body>
          <!-- Print Button for Mobile -->
          <div id="print-btn" style="display: none; position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);" onclick="doPrint()">
            🖨️ JETZT DRUCKEN
          </div>
          
          <div class="order-type">${orderTypeLabel}</div>
          <h1>#${order.order_number || order.id}</h1>
          <div style="text-align: center; font-size: 28px; margin-bottom: 5px;">
            ${new Date(order.created_at).toLocaleString("de-DE", { 
              day: '2-digit', 
              month: '2-digit',
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <div class="thick-divider"></div>
          
          <div class="section">
            <span class="label">Kunde:</span> ${order.customer_name}
          </div>
          <div class="section">
            <span class="label">Tel:</span> ${order.customer_phone}
          </div>
          ${order.order_type === "delivery" ? `
            <div class="section">
              <span class="label">Adresse:</span><br/>
              <span style="font-size: 28px;">${order.customer_address}</span>
            </div>
          ` : ""}
          ${order.customer_notes ? `
            <div class="section">
              <span class="label">Notiz:</span><br/>
              <em style="font-size: 28px;">${order.customer_notes}</em>
            </div>
          ` : ""}
          
          <div class="thick-divider"></div>
          
          ${items
            .map(
              (item) => `
            <div class="item">
              <div class="item-line">
                <span class="item-name">${item.quantity}x ${item.item_name}</span>
                <span class="item-price">${Number(item.total_price).toFixed(2)}€</span>
              </div>
              ${item.variant_name ? `<div style="font-size: 28px; padding-left: 8px;">${item.variant_name}</div>` : ""}
              ${item.toppings?.map((t) => `<div class="topping">+ ${t.topping_name}</div>`).join("") || ""}
              ${item.notes ? `<div class="topping"><em>! ${item.notes}</em></div>` : ""}
            </div>
          `,
            )
            .join("")}
          
          <div class="thick-divider"></div>
          
          <div class="summary" style="text-align: right;">
            <div>Zwischensumme: ${Number(order.subtotal).toFixed(2)}€</div>
            ${order.discount_amount > 0 ? `<div style="color: #16a34a;">Rabatt: -${Number(order.discount_amount).toFixed(2)}€</div>` : ""}
            ${order.order_type === "delivery" ? `<div>Lieferung: ${Number(order.delivery_fee).toFixed(2)}€</div>` : ""}
          </div>
          
          <div class="total">GESAMT: ${Number(order.total).toFixed(2)}€</div>
          
          <div class="thick-divider"></div>
          
          <div class="payment-badge ${order.payment_method === "cash" || !order.payment_method ? "payment-cash" : "payment-online"}">
            ${order.payment_method === "cash" || !order.payment_method ? "BARZAHLUNG" : "ONLINE BEZAHLT"}
          </div>
          
          <div style="text-align: center; font-size: 24px; margin-top: 8px; color: #666;">
            Vielen Dank!
          </div>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    // Print is triggered by onload event in HTML
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-gray-100 text-gray-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Bestellungen</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Verwalte eingehende und abgeschlossene Bestellungen</p>
        </div>
        
        {/* Sunmi Status Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSunmiAvailable === null ? (
            <Badge variant="outline" className="text-xs">
              <Printer className="h-3 w-3 mr-1" />
              Prüfe Sunmi...
            </Badge>
          ) : isSunmiAvailable ? (
            <Badge variant="default" className="text-xs bg-green-600">
              <Printer className="h-3 w-3 mr-1" />
              Sunmi Drucker bereit
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <Printer className="h-3 w-3 mr-1" />
              Browser-Druck
            </Badge>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={() => mutateActive()} className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Aktualisieren</span>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Keine Bestellungen</p>
            <p className="text-sm">Neue Bestellungen erscheinen hier automatisch</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => {
            const items = orderItems[order.id] || []
            const isPickup = order.order_type === "pickup"
            const isCompleted = order.is_completed === true
            const isCancelled = order.status === "cancelled" || order.is_cancelled
            return (
              <Card
                key={order.id}
                data-order-id={order.id}
                className={`${
                  isCompleted
                    ? "bg-red-50 border-l-4 border-l-red-400"
                    : order.order_type === "delivery"
                    ? "border-l-4 border-l-blue-500"
                    : order.order_type === "pickup"
                      ? "border-l-4 border-l-green-500"
                      : "border-l-4 border-l-purple-500"
                } transition-all duration-300`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">#{order.order_number || order.id}</CardTitle>
                      <Badge variant={isPickup ? "secondary" : "outline"} className="text-xs">
                        {isPickup ? (
                          <>
                            <Store className="mr-1 h-3 w-3" />
                            Abholung
                          </>
                        ) : (
                          <>
                            <Truck className="mr-1 h-3 w-3" />
                            Lieferung
                          </>
                        )}
                      </Badge>
                    </div>
                    <Badge className={statusColors[order.status] || ""}>
                      {order.status === "pending" && "Neu"}
                      {order.status === "confirmed" && "Bestätigt"}
                      {order.status === "preparing" && "In Zubereitung"}
                      {order.status === "ready" && "Fertig"}
                      {order.status === "delivered" && "Geliefert"}
                      {order.status === "completed" && "Erledigt"}
                      {order.status === "cancelled" && "Storniert"}
                    </Badge>
                    {isCancelled && (
                      <Badge variant="destructive" className="ml-2">
                        <Ban className="mr-1 h-3 w-3" />
                        Storniert
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{new Date(order.created_at).toLocaleString("de-DE")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">{order.customer_name}</div>
                    <a 
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      {order.customer_phone}
                    </a>
                    {!isPickup && order.customer_address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="break-words underline">{order.customer_address}</span>
                      </a>
                    )}
                    {order.delivery_zone_name && !isPickup && (
                      <Badge variant="outline" className="mt-1">
                        {order.delivery_zone_name}
                      </Badge>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 border-t pt-3">
                    {items.map((item: OrderItem) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="break-words">
                            {item.quantity}x {item.item_name}
                            {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>}
                          </span>
                          <span className="shrink-0">{Number(item.total_price).toFixed(2)}€</span>
                        </div>
                        {item.toppings?.map((t) => (
                          <div key={t.id} className="pl-4 text-xs text-muted-foreground">
                            + {t.topping_name}
                          </div>
                        ))}
                        {item.notes && <div className="pl-4 text-xs text-muted-foreground italic">{item.notes}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Customer Notes */}
                  {order.customer_notes && (
                    <div className="border-t pt-3 text-sm">
                      <span className="font-medium">Anmerkung:</span>
                      <p className="text-muted-foreground break-words">{order.customer_notes}</p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Zwischensumme</span>
                      <span>{Number(order.subtotal).toFixed(2)}€</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rabatt {order.discount_code_used && `(${order.discount_code_used})`}</span>
                        <span>-{Number(order.discount_amount).toFixed(2)}€</span>
                      </div>
                    )}
                    {!isPickup && (
                      <div className="flex justify-between">
                        <span>Liefergebühr</span>
                        <span>{Number(order.delivery_fee).toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t">
                      <span>Gesamt</span>
                      <span>{Number(order.total).toFixed(2)}€</span>
                    </div>
                    {isCancelled && order.refund_amount > 0 && (
                      <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                        <span>Rückerstattet</span>
                        <span>-{Number(order.refund_amount).toFixed(2)}€</span>
                      </div>
                    )}
                    {/* Payment Status */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Zahlungsmethode:</span>
                      {order.payment_method === "cash" || !order.payment_method ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold">
                          Barzahlung
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-semibold">
                          Online gezahlt
                        </Badge>
                      )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
