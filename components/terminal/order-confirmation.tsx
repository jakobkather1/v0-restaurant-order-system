"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, ChefHat, Truck, Package, ArrowLeft, Phone, MapPin, Store, Timer } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

interface OrderItem {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  variant_name?: string
  toppings?: Array<{ topping_name: string; topping_price: number }>
  notes?: string
}

interface Order {
  id: number
  order_number: string
  status: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_address?: string
  customer_notes?: string
  order_type: "delivery" | "pickup"
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total: number
  estimated_time?: number
  created_at: string
  restaurant_name: string
  restaurant_address?: string
  restaurant_phone?: string
  logo_url?: string
  primary_color?: string
  items: OrderItem[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const deliveryStatusSteps = [
  { key: "pending", label: "Bestellt", icon: CheckCircle },
  { key: "confirmed", label: "Bestätigt", icon: Clock },
  { key: "preparing", label: "In Zubereitung", icon: ChefHat },
  { key: "ready", label: "Fertig", icon: Package },
  { key: "delivered", label: "Geliefert", icon: Truck },
]

const pickupStatusSteps = [
  { key: "pending", label: "Bestellt", icon: CheckCircle },
  { key: "confirmed", label: "Bestätigt", icon: Clock },
  { key: "preparing", label: "In Zubereitung", icon: ChefHat },
  { key: "ready", label: "Abholbereit", icon: Package },
]

export function OrderConfirmation({ order: initialOrder, slug }: { order: Order; slug: string }) {
  const { data: orderData } = useSWR<{ order: Order }>(`/api/orders/${initialOrder.id}`, fetcher, {
    refreshInterval: 5000,
    fallbackData: { order: initialOrder },
  })

  const order = orderData?.order || initialOrder
  const isPickup = order.order_type === "pickup"
  const steps = isPickup ? pickupStatusSteps : deliveryStatusSteps
  const currentStepIndex = steps.findIndex((s) => s.key === order.status)
  const primaryColor = order.primary_color || "#0c4a6e"

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(Number(amount))
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("de-DE", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="text-white py-6 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-2xl mx-auto">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Speisekarte
          </Link>
          <div className="flex items-center gap-4">
            {order.logo_url && (
              <img src={order.logo_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-full bg-white p-1" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{order.restaurant_name}</h1>
            <p className="text-white/80">Bestellung #{order.order_number}</p>
          </div>
        </div>
      </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <Card className="overflow-hidden">
          <div className="p-6 text-white text-center" style={{ backgroundColor: primaryColor }}>
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <div className="text-2xl font-bold mb-2">
              {order.status === "pending"
                ? "Bestellung eingegangen!"
                : order.status === "confirmed"
                  ? "Bestellung bestätigt!"
                  : order.status === "preparing"
                    ? "Wird zubereitet"
                    : order.status === "ready"
                      ? isPickup
                        ? "Bereit zur Abholung!"
                        : "Fertig!"
                      : order.status === "delivered"
                        ? "Geliefert!"
                        : "Abgeschlossen!"}
            </div>
            {order.estimated_time && order.status !== "delivered" && order.status !== "completed" && (
              <div className="flex items-center justify-center gap-2 text-white/90">
                <Timer className="h-5 w-5" />
                <span className="text-lg">
                  Ca. {order.estimated_time} Minuten {isPickup ? "bis zur Abholung" : "bis zur Lieferung"}
                </span>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            {/* Progress Steps */}
            <div className="relative">
              <div className="flex justify-between mb-2">
                {steps.map((step, index) => {
                  const isActive = index <= currentStepIndex
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive ? "text-white" : "bg-gray-100 text-gray-400"
                        }`}
                        style={{ backgroundColor: isActive ? primaryColor : undefined }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-xs mt-2 text-center ${isActive ? "font-medium text-gray-900" : "text-gray-400"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    backgroundColor: primaryColor,
                    width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="font-semibold text-lg">Bestelldetails</div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.quantity}x</span> {item.item_name}
                    {item.variant_name && <span className="text-gray-500 ml-1">({item.variant_name})</span>}
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-sm text-gray-500">+ {item.toppings.map((t) => t.topping_name).join(", ")}</p>
                    )}
                    {item.notes && <p className="text-sm text-gray-500 italic">{item.notes}</p>}
                  </div>
                  <span>{formatCurrency(Number(item.total_price))}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Zwischensumme</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              {!isPickup && Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Liefergebühr</span>
                  <span>{formatCurrency(Number(order.delivery_fee))}</span>
                </div>
              )}
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Rabatt</span>
                  <span>-{formatCurrency(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Gesamt</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">{isPickup ? "Abholung" : "Lieferung"}</div>
              <Badge variant="outline" className="capitalize flex items-center gap-1">
                {isPickup ? <Store className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                {isPickup ? "Abholung" : "Lieferung"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="font-medium">{order.customer_name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer_phone}
                  </p>
                </div>
              </div>

              {isPickup && order.restaurant_address && (
                <div className="flex items-start gap-3 pt-2 border-t">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Abholadresse</p>
                    <p className="text-sm text-gray-600">{order.restaurant_address}</p>
                    {order.restaurant_phone && <p className="text-sm text-gray-500">Tel: {order.restaurant_phone}</p>}
                  </div>
                </div>
              )}

              {!isPickup && order.customer_address && (
                <div className="flex items-start gap-3 pt-2 border-t">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm">{order.customer_address}</p>
                </div>
              )}

              {order.customer_notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Anmerkungen:</span> {order.customer_notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Time */}
        <p className="text-center text-sm text-gray-500">Bestellung aufgegeben um {formatTime(order.created_at)}</p>
      </main>
    </div>
  )
}
