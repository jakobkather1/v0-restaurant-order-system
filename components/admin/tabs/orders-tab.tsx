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

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">Orders Component</div>
    </div>
  )
}
