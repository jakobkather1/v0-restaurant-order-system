"use client"
import useSWR from "swr"
import { markOrderCompleted, updateOrderStatus, setOrderEstimatedTime } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, Phone, MapPin, Printer, RefreshCw, Timer, Truck, Store, Archive, Ban, Wifi, WifiOff } from "lucide-react"
import type { Order, OrderItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CancelOrderDialog } from "@/components/admin/cancel-order-dialog"
import { useSunmiPrint } from "@/hooks/use-sunmi-print"
import { toast } from "sonner"

interface OrdersTabProps {
  orders: Order[]
  restaurantId: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function OrdersTab({ orders: initialOrders, restaurantId }: OrdersTabProps) {
  const [viewMode, setViewMode] = useState<"active" | "archive">("active")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [previousOrderCount, setPreviousOrderCount] = useState(initialOrders.length)
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const [completingOrderId, setCompletingOrderId] = useState<number | null>(null)
  const previousOrderIds = useRef<Set<number>>(new Set(initialOrders.map(o => o.id)))
  
  // Sunmi Print Integration
  const { print: printToSunmi, isSunmiAvailable, checkSunmiService } = useSunmiPrint()
  
  useEffect(() => {
    checkSunmiService()
  }, [checkSunmiService])

  const { data: activeData, mutate: mutateActive } = useSWR(`/api/orders?restaurantId=${restaurantId}`, fetcher, {
    fallbackData: { orders: initialOrders, items: {} },
    refreshInterval: 2000, // Poll every 2 seconds for near-realtime updates (serverless-compatible)
    refreshWhenHidden: false, // Don't poll when tab is hidden to save resources
    refreshWhenOffline: false, // Don't poll when offline
    revalidateOnFocus: true, // Immediately check when user returns to tab
    dedupingInterval: 1000, // Prevent duplicate requests within 1 second
    compare: (a, b) => {
      // Custom comparator to detect new orders more reliably
      if (!a || !b) return false
      const aIds = new Set(a.orders?.map((o: Order) => o.id) || [])
      const bIds = new Set(b.orders?.map((o: Order) => o.id) || [])
      return aIds.size === bIds.size && [...aIds].every(id => bIds.has(id))
    }
  })

  const { data: archiveData, mutate: mutateArchive } = useSWR(
    viewMode === "archive" ? `/api/orders/archive?restaurantId=${restaurantId}` : null,
    fetcher,
    {
      fallbackData: { orders: [], items: {} },
    },
  )

  const activeOrders = activeData?.orders || initialOrders
  const archiveOrders = archiveData?.orders || []
  const activeItems = activeData?.items || {}
  const archiveItems = archiveData?.items || {}

  const orders = viewMode === "active" ? activeOrders : archiveOrders
  const orderItems = viewMode === "active" ? activeItems : archiveItems
  const mutate = viewMode === "active" ? mutateActive : mutateArchive

  const [estimatedTimes, setEstimatedTimes] = useState<Record<number, string>>({})

  // Detect new orders via polling comparison (SSE not compatible with Vercel serverless)
  useEffect(() => {
    if (viewMode !== "active") return
    
    const currentOrderIds = new Set(activeOrders.map(o => o.id))
    const newOrders = activeOrders.filter(order => !previousOrderIds.current.has(order.id))
    
    if (newOrders.length > 0) {
      console.log('[v0] New orders detected via polling:', newOrders.length)
      
      newOrders.forEach(order => {
        // Mark as new for highlighting
        setNewOrderIds(prev => new Set([...prev, order.id]))
        
        // Show toast notification
        toast.success(
          `Neue Bestellung eingetroffen!\n#${order.order_number} - ${order.customer_name}`,
          {
            duration: 8000,
            action: {
              label: 'Anzeigen',
              onClick: () => {
                const orderElement = document.querySelector(`[data-order-id="${order.id}"]`)
                orderElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          }
        )
        
        // Remove highlighting after 15 seconds
        setTimeout(() => {
          setNewOrderIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(order.id)
            return newSet
          })
        }, 15000)
      })
    }
    
    // Update previous order IDs
    previousOrderIds.current = currentOrderIds
  }, [activeOrders, viewMode])

  // No realtime connection on Vercel serverless
  const isRealtimeConnected = false

  async function handleComplete(orderId: number) {
    console.log('[v0] handleComplete - Starting for order:', orderId)
    
    // Set loading state for this specific order
    setCompletingOrderId(orderId)
    
    // Optimistic UI update - immediately remove from active orders for instant visual feedback
    mutateActive(
      {
        orders: activeOrders.filter(o => o.id !== orderId),
        items: activeItems
      },
      false // Don't revalidate yet - we'll do it manually after the action completes
    )
    
    // Execute server action in background
    try {
      const result = await markOrderCompleted(orderId)
      console.log('[v0] handleComplete - Server action completed:', result)
      
      if (result.error) {
        console.error('[v0] handleComplete - Error:', result.error)
        // Rollback optimistic update on error
        mutateActive()
        toast.error('Fehler beim Archivieren der Bestellung')
        setCompletingOrderId(null)
        return
      }
      
      // Success - trigger both active and archive to refresh
      mutateActive()
      mutateArchive()
      toast.success('Bestellung erfolgreich archiviert')
      setCompletingOrderId(null)
    } catch (error) {
      console.error('[v0] handleComplete - Exception:', error)
      // Rollback optimistic update on exception
      mutateActive()
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
    console.log('[v0] === PRINT STARTED ===')
    console.log('[v0] Order:', order.order_number || order.id)
    console.log('[v0] Sunmi available:', isSunmiAvailable)
    
    // Try Sunmi first if available
    if (isSunmiAvailable) {
      console.log('[v0] Attempting to print to Sunmi device...')
      
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
        console.log('[v0] Printed successfully to Sunmi device')
        toast.success('Bon wurde gedruckt')
        return
      } else {
        console.log('[v0] Sunmi print failed, falling back to browser print')
        toast.error('Sunmi-Druck fehlgeschlagen')
      }
    }
    
    // Fallback to browser print
    console.log('[v0] Falling back to browser print...')
    browserPrint(order, items)
  }

  function browserPrint(order: Order, items: OrderItem[]) {
    console.log('[v0] Opening print window...')
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      console.log('[v0] ERROR: Popup blocked by browser')
      alert("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.")
      toast.error("Popup wurde blockiert")
      return
    }
    console.log('[v0] Print window opened successfully')

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
    console.log('[v0] Writing HTML to print window')
    printWindow.document.write(html)
    printWindow.document.close()
    console.log('[v0] Print window ready - onload will trigger print dialog')
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
        
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "active" | "archive")} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
              <TabsTrigger value="active" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Aktiv ({activeOrders.length})
                {viewMode === "active" && (
                  isRealtimeConnected ? (
                    <Wifi className="h-3 w-3 text-green-500 ml-1" title="Echtzeit-Updates aktiv (PostgreSQL)" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-orange-500 ml-1" title="Keine Echtzeit-Verbindung" />
                  )
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                Archiv
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => mutate()} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Aktualisieren</span>
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {viewMode === "active" ? (
              <>
                <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Keine aktiven Bestellungen</p>
                <p className="text-sm">Neue Bestellungen erscheinen hier automatisch</p>
              </>
            ) : (
              <>
                <Archive className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Kein Archiv vorhanden</p>
                <p className="text-sm">Erledigte Bestellungen werden hier für 24h archiviert</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => {
            const items = orderItems[order.id] || []
            const isPickup = order.order_type === "pickup"
            const isArchived = viewMode === "archive"
            const isCancelled = order.status === "cancelled" || order.is_cancelled
            return (
              <Card
                key={order.id}
                data-order-id={order.id}
                className={`${
                  order.order_type === "delivery"
                    ? "border-l-4 border-l-blue-500"
                    : order.order_type === "pickup"
                      ? "border-l-4 border-l-green-500"
                      : "border-l-4 border-l-purple-500"
                } ${newOrderIds.has(order.id) ? "animate-pulse ring-2 ring-yellow-400 shadow-lg" : ""} transition-all duration-300`}
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

                  {!isArchived && !isCancelled && (
                    <>
                      <div className="flex flex-col gap-2 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            // Print order - checks Sunmi first, falls back to browser print if unavailable
                            printOrder(order, items)
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Drucken
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => handleComplete(order.id)}
                          disabled={completingOrderId === order.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {completingOrderId === order.id ? "Wird archiviert..." : "Erledigt"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                          onClick={() => {
                            setSelectedOrder(order)
                            setCancelDialogOpen(true)
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Stornieren
                        </Button>
                      </div>
                    </>
                  )}

                  {!isArchived && isCancelled && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => printOrder(order, items)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Drucken
                      </Button>
                    </div>
                  )}

                  {isArchived && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => printOrder(order, items)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Drucken
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedOrder && (
        <CancelOrderDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          order={{
            id: selectedOrder.id,
            order_number: selectedOrder.id.toString(),
            total_price: Number(selectedOrder.total),
            payment_method: selectedOrder.payment_method || "cash",
            stripe_payment_intent_id: selectedOrder.stripe_payment_intent_id,
          }}
          onSuccess={() => {
            // Update both active and archive views to reflect the cancellation
            mutateActive()
            mutateArchive()
          }}
        />
      )}
    </div>
  )
}
