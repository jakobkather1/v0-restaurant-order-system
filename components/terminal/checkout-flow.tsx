"use client"

import type React from "react"
import { Clock } from "lucide-react"

import { useState, useEffect } from "react"
import type { CartItem, Restaurant, DeliveryZone, MenuItem, ItemVariant, Topping } from "@/lib/types"
import { createOrder, checkDiscountCode } from "@/app/[slug]/actions"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle,
  Tag,
  Loader2,
  Truck,
  Store,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Banknote,
} from "lucide-react"
import { StripeCheckout, useStripeAvailable } from "./stripe-checkout"
import { useRef } from "react"

type CheckoutStep = "upsell" | "details" | "payment" | "success"

interface CheckoutFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  restaurant: Restaurant
  deliveryZones: DeliveryZone[]
  isOpen: boolean
  upsellItems: MenuItem[]
  allMenuItems: MenuItem[]
  getItemVariants: (itemId: number) => ItemVariant[]
  toppings: Topping[]
  onAddItem: (item: MenuItem, variant?: ItemVariant) => void
  onSuccess: () => void
  prefilledOrderType?: "pickup" | "delivery" | null
  prefilledAddress?: {
    street: string
    number: string
    postalCode: string
    city: string
    zone: DeliveryZone
  } | null
}

export function CheckoutFlow({
  open,
  onOpenChange,
  cart,
  restaurant,
  deliveryZones,
  isOpen,
  upsellItems,
  allMenuItems,
  getItemVariants,
  toppings,
  onAddItem,
  onSuccess,
  prefilledOrderType = null,
  prefilledAddress = null,
}: CheckoutFlowProps) {
  const hasUpsellItems = upsellItems.length > 0
  const [step, setStep] = useState<CheckoutStep>(hasUpsellItems ? "upsell" : "details")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const { available: stripeAvailable, loading: stripeLoading } = useStripeAvailable(restaurant.id)

  // Upsell state
  const [selectedUpsellItem, setSelectedUpsellItem] = useState<MenuItem | null>(null)
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set())

  // Form state - use prefilled values if available, or load from localStorage
  const [orderType, setOrderType] = useState<"delivery" | "pickup">(
    prefilledOrderType === "pickup" ? "pickup" : "delivery"
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState(prefilledAddress?.street || "")
  const [houseNumber, setHouseNumber] = useState(prefilledAddress?.number || "")
  const [postalCode, setPostalCode] = useState(prefilledAddress?.postalCode || "")
  const [city, setCity] = useState(prefilledAddress?.city || "")
  
  // Load saved contact data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('checkout_contact_data')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        if (!name) setName(parsed.name || "")
        if (!email) setEmail(parsed.email || "")
        if (!phone) setPhone(parsed.phone || "")
        if (!prefilledAddress?.street && parsed.street) setStreet(parsed.street || "")
        if (!prefilledAddress?.number && parsed.houseNumber) setHouseNumber(parsed.houseNumber || "")
        if (!prefilledAddress?.postalCode && parsed.postalCode) setPostalCode(parsed.postalCode || "")
        if (!prefilledAddress?.city && parsed.city) setCity(parsed.city || "")
      }
    } catch (error) {
      console.error("Failed to load saved contact data:", error)
    }
  }, [])
  const [notes, setNotes] = useState("")
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(prefilledAddress?.zone || null)
  const [matchingZones, setMatchingZones] = useState<DeliveryZone[]>([])
  const [address, setAddress] = useState("")
  const [zoneError, setZoneError] = useState<string | null>(null)
  
  // Time scheduling state
  const [preparationMinutes, setPreparationMinutes] = useState(15)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [timeOptions, setTimeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loadingTimes, setLoadingTimes] = useState(false)

  // Discount state
  const [discountCode, setDiscountCode] = useState("")
  const [discountLoading, setDiscountLoading] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    type: "percentage" | "fixed"
    value: number
    minimumOrderValue: number
  } | null>(null)

  const [orderId, setOrderId] = useState<number | null>(null)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  const containerRef = useRef(null)

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0)
  const deliveryFee = orderType === "pickup" ? 0 : selectedZone ? (Number(selectedZone.price) || 0) : 0
  const meetsMinimumOrder = !appliedDiscount || subtotal >= appliedDiscount.minimumOrderValue

  let discountAmount = 0
  if (appliedDiscount && meetsMinimumOrder) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = (subtotal * appliedDiscount.value) / 100
    } else {
      discountAmount = Math.min(appliedDiscount.value, subtotal)
    }
  }

  const total = subtotal - discountAmount + deliveryFee
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStep(hasUpsellItems ? "upsell" : "details")
      setAddedItems(new Set())
      setSelectedUpsellItem(null)
      setError(null)
      setAddress("")
      setSelectedTime("")
      
      // Apply prefilled values
      if (prefilledOrderType) {
        setOrderType(prefilledOrderType)
      }
      if (prefilledAddress) {
        setStreet(prefilledAddress.street)
        setHouseNumber(prefilledAddress.number)
        setPostalCode(prefilledAddress.postalCode)
        setCity(prefilledAddress.city)
        setSelectedZone(prefilledAddress.zone)
        setZoneError(null)
      }
    }
  }, [open, hasUpsellItems, prefilledOrderType, prefilledAddress])

  // Auto-detect delivery zone based on postal code and city
  useEffect(() => {
    if (orderType === "delivery" && postalCode.trim() && deliveryZones.length > 0) {
      const matchingZonesForPostal = deliveryZones.filter((zone) =>
        zone.postal_codes.some((code) => code.toLowerCase().trim() === postalCode.toLowerCase().trim())
      )
      
      setMatchingZones(matchingZonesForPostal)
      
      if (matchingZonesForPostal.length === 0) {
        setSelectedZone(null)
        setZoneError(`Leider liefern wir nicht zur PLZ ${postalCode}`)
      } else if (matchingZonesForPostal.length === 1) {
        // Only one zone matches - auto-select it
        setSelectedZone(matchingZonesForPostal[0])
        setZoneError(null)
      } else {
        // Multiple zones match - try to match by city name
        const cityLower = city.toLowerCase().trim()
        if (cityLower) {
          const cityMatch = matchingZonesForPostal.find(zone => 
            zone.name.toLowerCase().includes(cityLower)
          )
          if (cityMatch) {
            setSelectedZone(cityMatch)
            setZoneError(null)
          } else {
            // City doesn't match any zone - user needs to select manually
            setSelectedZone(null)
            setZoneError(null)
          }
        } else {
          // No city entered yet - wait for user to select or enter city
          setSelectedZone(null)
          setZoneError(null)
        }
      }
    } else if (orderType === "pickup") {
      setSelectedZone(null)
      setMatchingZones([])
      setZoneError(null)
    }
  }, [postalCode, city, orderType, deliveryZones])

  // Helper function to check if a time is within opening hours
  function isWithinOpeningHours(date: Date, openingHours: Record<string, { open: string; close: string }>): boolean {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const dayKey = dayNames[date.getDay()]
    const hours = openingHours[dayKey]
    
    if (!hours || !hours.open || !hours.close) {
      return false
    }
    
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    return timeStr >= hours.open && timeStr <= hours.close
  }

  // Helper to get next opening time if restaurant is currently closed
  function getNextOpeningTime(now: Date, openingHours: Record<string, { open: string; close: string }>): Date | null {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const dayKey = dayNames[checkDate.getDay()]
      const hours = openingHours[dayKey]
      
      if (hours && hours.open) {
        const [openHour, openMin] = hours.open.split(':').map(Number)
        const openingTime = new Date(checkDate)
        openingTime.setHours(openHour, openMin, 0, 0)
        
        // If today and opening time is in future, return it
        if (i === 0 && openingTime > now) {
          return openingTime
        }
        // If future day, return that opening time
        if (i > 0) {
          return openingTime
        }
      }
    }
    return null
  }

  // Load delivery times and generate time options when order type or zone changes
  useEffect(() => {
    async function loadDeliveryTimes() {
      setLoadingTimes(true)
      try {
        const zoneParam = orderType === "delivery" && selectedZone ? `&deliveryZoneId=${selectedZone.id}` : ""
        const typeParam = `&orderType=${orderType}`
        const response = await fetch(`/api/delivery-times?restaurantId=${restaurant.id}${zoneParam}${typeParam}`)
        const data = await response.json()
        
        const prepMins = data.preparationMinutes || (orderType === "pickup" ? 15 : 30)
        setPreparationMinutes(prepMins)
        
        // Generate time slots: earliest + every 15 minutes, filtered by opening hours
        const now = new Date()
        let earliest = new Date(now.getTime() + prepMins * 60000)
        
        // If restaurant is closed and accepts preorders, use next opening time + prep time
        if (!isOpen && restaurant.accepts_preorders) {
          const nextOpening = getNextOpeningTime(now, restaurant.opening_hours)
          if (nextOpening) {
            const openingPlusPrepTime = new Date(nextOpening.getTime() + prepMins * 60000)
            // Use the later of the two: now + prep time OR opening time + prep time
            earliest = earliest > openingPlusPrepTime ? earliest : openingPlusPrepTime
          }
        }
        
        const options: Array<{ value: string; label: string }> = []
        
        // Round earliest to next 5-minute interval
        const earliestMinutes = earliest.getMinutes()
        const roundedMinutes = Math.ceil(earliestMinutes / 5) * 5
        earliest.setMinutes(roundedMinutes, 0, 0)
        
        // Generate slots for the next 24 hours (96 slots at 15-min intervals)
        for (let i = 0; i < 96; i++) {
          const slotTime = new Date(earliest.getTime() + i * 15 * 60000)
          
          // Only include times within opening hours
          if (!isWithinOpeningHours(slotTime, restaurant.opening_hours)) {
            continue
          }
          
          const hours = String(slotTime.getHours()).padStart(2, '0')
          const minutes = String(slotTime.getMinutes()).padStart(2, '0')
          const timeStr = `${hours}:${minutes}`
          
          const isToday = slotTime.getDate() === now.getDate()
          const isTomorrow = slotTime.getDate() === now.getDate() + 1
          
          let label = `${timeStr} Uhr`
          if (options.length === 0) {
            label = `${timeStr} Uhr (frühestmöglich)`
          } else if (!isToday && isTomorrow) {
            label = `${timeStr} Uhr (morgen)`
          } else if (!isToday) {
            label = `${timeStr} Uhr (${slotTime.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })})`
          }
          
          options.push({
            value: slotTime.toISOString(),
            label
          })
          
          // Limit to 20 options for better UX
          if (options.length >= 20) break
        }
        
        setTimeOptions(options)
        setSelectedTime(options[0]?.value || "")
      } catch (error) {
        console.error("Failed to load delivery times:", error)
        setPreparationMinutes(orderType === "pickup" ? 15 : 30)
      } finally {
        setLoadingTimes(false)
      }
    }

    if (open) {
      loadDeliveryTimes()
    }
  }, [open, orderType, selectedZone, restaurant.id, restaurant.opening_hours])

  // Get recommended items - ONLY show items marked as upsell by admin
  // Show all upsell items (don't filter out items already in cart)
  const recommendedItems = upsellItems

  function handleAddUpsellItem(item: MenuItem, variant?: ItemVariant) {
    onAddItem(item, variant)
    setAddedItems((prev) => new Set([...prev, item.id]))
    setSelectedUpsellItem(null)
  }

  function handleUpsellItemClick(item: MenuItem) {
    const variants = getItemVariants(item.id)
    if (variants.length > 0) {
      setSelectedUpsellItem(item)
    } else {
      handleAddUpsellItem(item)
    }
  }

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return

    setDiscountLoading(true)
    setError(null)

    const result = await checkDiscountCode(restaurant.id, discountCode)
    if (result.valid) {
      const minValue = result.minimumOrderValue || 0
      if (minValue > 0 && subtotal < minValue) {
        setError(`Mindestbestellwert von ${minValue.toFixed(2)}€ nicht erreicht`)
        setDiscountLoading(false)
        return
      }

      setAppliedDiscount({
        code: discountCode.toUpperCase(),
        type: result.discountType as "percentage" | "fixed",
        value: result.discountValue as number,
        minimumOrderValue: minValue,
      })
    } else {
      setError(result.error || "Ungültiger Code")
    }

    setDiscountLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name || !phone) {
      setError("Bitte Name und Telefonnummer angeben")
      return
    }

    if (orderType === "delivery") {
      // First check if address is entered at all
      if (!street || !houseNumber || !postalCode || !city) {
        setError("Bitte vollständige Lieferadresse angeben")
        return
      }
      // Only then check if the zone is valid
      if (deliveryZones.length > 0 && !selectedZone) {
        setError(zoneError || "Wir liefern leider nicht zu dieser Postleitzahl")
        return
      }
    }
    // Check minimum order value for selected zone
    const minOrderValue = Number(selectedZone?.minimum_order_value) || 0
    if (selectedZone && minOrderValue > 0) {
      if (subtotal < minOrderValue) {
        setError(`Mindestbestellwert für ${selectedZone.name}: ${minOrderValue.toFixed(2)}€ (aktuell: ${subtotal.toFixed(2)}€)`)
        return
      }
    }

    // If card payment selected and Stripe available, go to payment step
    if (paymentMethod === "card" && stripeAvailable) {
      setStep("payment")
      return
    }

    // Otherwise, create order directly (cash payment)
    await submitOrder()
  }

  async function submitOrder() {
    setLoading(true)
    setError(null)

    const fullAddress = orderType === "delivery" 
      ? `${street} ${houseNumber}, ${postalCode} ${city}` 
      : ""
    
    try {
      const result = await createOrder({
        restaurantId: restaurant.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: fullAddress,
        customerNotes: notes,
        deliveryZoneId: selectedZone?.id || null,
        deliveryFee,
        discountCode: appliedDiscount?.code || null,
        discountAmount,
        items: cart,
        orderType,
        scheduledTime: selectedTime || undefined,
        paymentMethod: paymentMethod,
      })

      if (result.success) {
        // Save contact data to localStorage for next time
        try {
          const contactData = {
            name,
            email,
            phone,
            street,
            houseNumber,
            postalCode,
            city,
          }
          localStorage.setItem('checkout_contact_data', JSON.stringify(contactData))
        } catch (error) {
          console.error("Failed to save contact data:", error)
        }
        
    setOrderId(result.orderId ?? null)
    setOrderNumber(result.orderNumber ?? null)
    setStep("success")
    onSuccess()
      } else {
        setError(result.error || "Fehler beim Erstellen der Bestellung")
      }
    } catch (error) {
      console.error("Order creation error:", error)
      setError(error instanceof Error ? error.message : "Fehler beim Erstellen der Bestellung")
    }

    setLoading(false)
  }

  function handlePaymentSuccess() {
    submitOrder()
  }

  function handlePaymentError(errorMsg: string) {
    setError(errorMsg)
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep(hasUpsellItems ? "upsell" : "details")
      setError(null)
      setName("")
      setEmail("")
      setPhone("")
      setStreet("")
      setHouseNumber("")
      setPostalCode("")
      setCity("")
      setNotes("")
      setSelectedZone(null)
      setDiscountCode("")
      setAppliedDiscount(null)
      setOrderId(null)
      setOrderType("delivery")
      setAddedItems(new Set())
      setSelectedUpsellItem(null)
    }, 300)
  }

  const showPaymentStep = paymentMethod === "card" && stripeAvailable
  
  const steps = hasUpsellItems
    ? showPaymentStep
      ? [
          { id: "upsell", label: "Extras", icon: Sparkles },
          { id: "details", label: "Details", icon: CreditCard },
          { id: "payment", label: "Zahlung", icon: Banknote },
        ]
      : [
          { id: "upsell", label: "Extras", icon: Sparkles },
          { id: "details", label: "Bestellung", icon: CreditCard },
        ]
    : showPaymentStep
      ? [
          { id: "details", label: "Details", icon: CreditCard },
          { id: "payment", label: "Zahlung", icon: Banknote },
        ]
  : [{ id: "details", label: "Bestellung", icon: CreditCard }]

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        className="w-full sm:max-w-lg lg:max-w-xl p-0 gap-0 flex flex-col bg-background"
        style={{
          height: '100dvh',
          minHeight: '100dvh',
          maxHeight: '100dvh'
        }}
      >
        {/* Header with Progress - flex-none (fixed height) */}
        <div className="flex-none border-b bg-background pt-[env(safe-area-inset-top)]">
          {/* Progress Bar - Hidden on very small screens, simplified */}
          {step !== "success" && steps.length > 1 && (
            <div className="px-4 sm:px-6 pt-2 sm:pt-3">
              <div className="flex items-center justify-between mb-2">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                        step === s.id
                          ? "text-white"
                          : steps.findIndex((x) => x.id === step) > i
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500",
                      )}
                      style={step === s.id ? { backgroundColor: restaurant.primary_color } : {}}
                    >
                      {steps.findIndex((x) => x.id === step) > i ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <s.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="hidden xs:inline sm:inline">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <ChevronRight className="h-4 w-4 mx-1 sm:mx-2 text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Summary */}
          {step !== "success" && (
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{cartItemCount} Artikel</span>
                </span>
              </div>
              <div className="font-bold text-base sm:text-lg" style={{ color: restaurant.primary_color }}>
                {subtotal.toFixed(2)}€
              </div>
            </div>
          )}
        </div>

        {/* Content - flex-1 (takes remaining space, scrolls internally) */}
        <div
          className="flex-1 overflow-y-auto bg-background overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Success Step */}
          {step === "success" && (
            <div className="py-6 sm:py-8 px-4 sm:px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 bg-white flex flex-col justify-center">
              <div
                className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: `${restaurant.primary_color}20` }}
              >
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: restaurant.primary_color }} />
              </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">Bestellung aufgegeben!</div>
          <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
            Deine Bestellnummer ist <span className="font-bold text-foreground">#{orderNumber}</span>
          </p>
              <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">
                {orderType === "pickup"
                  ? "Du kannst deine Bestellung in Kürze bei uns abholen."
                  : "Wir haben deine Bestellung erhalten und bereiten sie vor."}
              </p>
              <Button
                className="px-6 sm:px-8 h-11 sm:h-12 text-base sm:text-lg font-semibold rounded-xl w-full sm:w-auto"
                style={{ backgroundColor: restaurant.primary_color }}
                onClick={handleClose}
              >
                Schließen
              </Button>
            </div>
          )}

          {/* Upsell Step */}
          {step === "upsell" && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 animate-in fade-in slide-in-from-right-4 duration-300 bg-white">
              {selectedUpsellItem ? (
                // Variant Selection
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedUpsellItem(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück zur Auswahl
                  </button>

                  <div className="space-y-2">
                    <div className="font-semibold text-base sm:text-lg">{selectedUpsellItem.name}</div>
                    {selectedUpsellItem.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground">{selectedUpsellItem.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Größe wählen:</p>
                    <div className="grid gap-2">
                      {getItemVariants(selectedUpsellItem.id).map((variant) => {
                        const variantPrice = Number(selectedUpsellItem.base_price) + Number(variant.price_modifier)
                        return (
                          <button
                            key={variant.id}
                            onClick={() => handleAddUpsellItem(selectedUpsellItem, variant)}
                            className="flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                          >
                            <span className="font-medium text-sm sm:text-base">{variant.name}</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span
                                className="font-semibold text-sm sm:text-base"
                                style={{ color: restaurant.primary_color }}
                              >
                                +{variantPrice.toFixed(2)}€
                              </span>
                              <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <Plus className="h-4 w-4" style={{ color: restaurant.primary_color }} />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Items Grid
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${restaurant.primary_color}15` }}>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: restaurant.primary_color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-base sm:text-lg">Perfekte Ergänzung</div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Diese Artikel passen perfekt dazu</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {recommendedItems.map((item) => {
                      const itemVariants = getItemVariants(item.id)
                      const hasVariants = itemVariants.length > 0
                      const minPrice = hasVariants
                        ? Math.min(
                            Number(item.base_price),
                            ...itemVariants.map((v) => Number(item.base_price) + Number(v.price_modifier)),
                          )
                        : Number(item.base_price)
                      const isAdded = addedItems.has(item.id)

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleUpsellItemClick(item)}
                          className={cn(
                            "relative flex flex-col rounded-xl border-2 p-2 sm:p-3 text-left transition-all",
                            isAdded
                              ? "border-green-500 bg-green-50"
                              : "border-border hover:border-primary/50 hover:shadow-md",
                          )}
                        >
                          {isAdded && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                              <Check className="h-3 w-3" />
                            </div>
                          )}

                          {item.image_url ? (
                            <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                              <img
                                src={item.image_url || "/placeholder.svg"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="aspect-square rounded-lg mb-2 flex items-center justify-center text-xl sm:text-2xl"
                              style={{ backgroundColor: `${restaurant.primary_color}10` }}
                            >
                              🍽️
                            </div>
                          )}

                          <div className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">{item.name}</div>

                          <div className="flex items-center justify-between mt-auto pt-1 sm:pt-2">
                            <span className="font-bold text-xs sm:text-sm" style={{ color: restaurant.primary_color }}>
                              {hasVariants ? "ab " : "+"}
                              {minPrice.toFixed(2)}€
                            </span>
                            {!isAdded && (
                              <div
                                className="p-1 sm:p-1.5 rounded-full"
                                style={{ backgroundColor: `${restaurant.primary_color}15` }}
                              >
                                <Plus className="h-4 w-4" style={{ color: restaurant.primary_color }} />
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Step */}
          {step === "details" && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 animate-in fade-in slide-in-from-right-4 duration-300 bg-white">
              {!isOpen && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs sm:text-sm text-red-700 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Das Restaurant ist aktuell geschlossen
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs sm:text-sm text-red-700 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                {/* Order Type */}
                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-sm sm:text-base font-medium">Bestellart</Label>
                  <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "delivery" | "pickup")}>
                    <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12">
                      <TabsTrigger
                        value="delivery"
                        className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Lieferung
                      </TabsTrigger>
                      <TabsTrigger
                        value="pickup"
                        className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Abholung
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Contact Details */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Kontaktdaten</div>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Max Mustermann"
                        className="h-10 sm:h-11 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm">
                        Telefon *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0123 456789"
                        className="h-10 sm:h-11 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm">
                      E-Mail (optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="max@beispiel.de"
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                {orderType === "delivery" && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Lieferadresse</div>
                    {prefilledAddress && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <span className="font-semibold">✓ Lieferadresse bereits ausgefüllt</span>
                          <br />
                          Du kannst die Adresse bei Bedarf anpassen.
                        </p>
                      </div>
                    )}
                    <div className="grid gap-3 sm:gap-4 grid-cols-[1fr_auto]">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="street" className="text-xs sm:text-sm">
                          Straße *
                        </Label>
                        <Input
                          id="street"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Musterstraße"
                          className="h-10 sm:h-11 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 w-24">
                        <Label htmlFor="houseNumber" className="text-xs sm:text-sm">
                          Nr. *
                        </Label>
                        <Input
                          id="houseNumber"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(e.target.value)}
                          placeholder="12"
                          className="h-10 sm:h-11 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-[auto_1fr]">
                      <div className="space-y-1.5 sm:space-y-2 w-28">
                        <Label htmlFor="postalCode" className="text-xs sm:text-sm">
                          PLZ *
                        </Label>
                        <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="12345"
                          className="h-10 sm:h-11 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="city" className="text-xs sm:text-sm">
                          Ort *
                        </Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Musterstadt"
                          className="h-10 sm:h-11 text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Zone selection dropdown when multiple zones match */}
                    {matchingZones.length > 1 && (
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="deliveryZone" className="text-xs sm:text-sm">
                          Liefergebiet auswählen *
                        </Label>
                        <Select
                          value={selectedZone?.id.toString() || ""}
                          onValueChange={(value) => {
                            const zone = matchingZones.find(z => z.id.toString() === value)
                            setSelectedZone(zone || null)
                          }}
                        >
                          <SelectTrigger className="h-10 sm:h-11 text-sm">
                            <SelectValue placeholder="Bitte Liefergebiet wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                {matchingZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name} - {Number(zone.price).toFixed(2)}€
                    {zone.minimum_order_value && Number(zone.minimum_order_value) > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                                    (Min. {Number(zone.minimum_order_value).toFixed(2)}€)
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Mehrere Liefergebiete verfügbar für PLZ {postalCode}
                        </p>
                      </div>
                    )}
                    
                    {/* Auto-detected delivery zone info */}
                    {selectedZone && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                <p className="font-medium text-green-900">Liefergebiet: {selectedZone.name}</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Lieferkosten: {Number(selectedZone.price).toFixed(2)}€
                  {selectedZone.minimum_order_value && Number(selectedZone.minimum_order_value) > 0 && (
                    <> • Mindestbestellwert: {Number(selectedZone.minimum_order_value).toFixed(2)}€</>
                  )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {zoneError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-900">{zoneError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Time Selection */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="time" className="text-xs sm:text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: restaurant.primary_color }} />
                    {orderType === "pickup" ? "Abholzeit" : "Lieferzeit"}
                  </Label>
                  <Select
                    value={selectedTime}
                    onValueChange={setSelectedTime}
                    disabled={loadingTimes}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue placeholder={loadingTimes ? "Zeiten werden geladen..." : "Bitte wählen..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Vorbereitungszeit: ca. {preparationMinutes} Minuten
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="notes" className="text-xs sm:text-sm">
                    Anmerkungen (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Besondere Wünsche oder Hinweise..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Discount Code */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Rabattcode</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="pl-9 h-10 sm:h-11 text-sm"
                        disabled={!!appliedDiscount}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyDiscount}
                      disabled={discountLoading || !!appliedDiscount || !discountCode.trim()}
                      className="h-10 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm bg-transparent"
                    >
                      {discountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Einlösen"}
                    </Button>
                  </div>
                  {appliedDiscount && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {appliedDiscount.code} -{" "}
                        {appliedDiscount.type === "percentage"
                          ? `${appliedDiscount.value}%`
                          : `${appliedDiscount.value.toFixed(2)}€`}{" "}
                        Rabatt
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Method Selection */}
                {!stripeLoading && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Zahlungsart</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm",
                          paymentMethod === "cash"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Banknote className={cn("h-5 w-5", paymentMethod === "cash" ? "text-green-600" : "text-gray-500")} />
                        <span className={paymentMethod === "cash" ? "font-medium text-green-700" : "text-gray-700"}>
                          Barzahlung
                        </span>
                      </button>
                      {stripeAvailable && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm",
                            paymentMethod === "card"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <CreditCard className={cn("h-5 w-5", paymentMethod === "card" ? "text-blue-600" : "text-gray-500")} />
                          <span className={paymentMethod === "card" ? "font-medium text-blue-700" : "text-gray-700"}>
                            Kartenzahlung
                          </span>
                        </button>
                      )}
                    </div>
                    {!stripeAvailable && (
                      <p className="text-xs text-gray-500">Online-Zahlung ist derzeit nicht verfügbar</p>
                    )}
                  </div>
                )}

                {/* Checkout info text */}
                {restaurant.checkout_info_text && (
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs sm:text-sm text-blue-700">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{restaurant.checkout_info_text}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Payment Step */}
          {step === "payment" && (
            <div className="px-4 sm:px-6 py-4 sm:py-6 animate-in fade-in slide-in-from-right-4 duration-300 min-h-full bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full" style={{ backgroundColor: `${restaurant.primary_color}15` }}>
                    <CreditCard className="h-5 w-5" style={{ color: restaurant.primary_color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Zahlung</div>
                    <p className="text-sm text-muted-foreground">Sichere Zahlung mit Stripe</p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabatt</span>
                      <span>-{discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  {orderType === "delivery" && deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liefergebühr</span>
                      <span>{deliveryFee.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                    <span>Gesamt</span>
                    <span style={{ color: restaurant.primary_color }}>{total.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Stripe Checkout */}
                <StripeCheckout
                  restaurantId={restaurant.id}
                  amount={total}
                  customerEmail={email || undefined}
                  primaryColor={restaurant.primary_color}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                {/* Back button */}
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="w-full"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Zurück zu Details
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - flex-none (stays at bottom, always visible) */}
        {step !== "success" && (
          <div className="flex-none border-t bg-background px-4 sm:px-6 py-2.5 sm:py-3 space-y-1.5 sm:space-y-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            {step === "details" && (
              <div className="space-y-3">
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabatt</span>
                      <span>-{discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  {orderType === "delivery" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liefergebühr</span>
                      <span>{deliveryFee > 0 ? `${deliveryFee.toFixed(2)}€` : "Wird berechnet"}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
                    <span>Gesamt</span>
                    <span style={{ color: restaurant.primary_color }}>{total.toFixed(2)}€</span>
                  </div>
                </div>
                
                {/* Minimum Order Value Warning */}
                {orderType === "delivery" && selectedZone && selectedZone.minimum_order_value && Number(selectedZone.minimum_order_value) > 0 && subtotal < Number(selectedZone.minimum_order_value) && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs sm:text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Mindestbestellwert nicht erreicht</p>
                      <p className="mt-1">
                        Für {selectedZone.name} beträgt der Mindestbestellwert {Number(selectedZone.minimum_order_value).toFixed(2)}€. 
                        Bitte füge noch {(Number(selectedZone.minimum_order_value) - subtotal).toFixed(2)}€ hinzu.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              {step === "upsell" && hasUpsellItems && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-12 sm:h-12 text-sm sm:text-base touch-manipulation"
                  >
                    <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    Zurück
                  </Button>
                  <Button
                    onClick={() => setStep("details")}
                    style={{ backgroundColor: restaurant.primary_color }}
                    className="flex-1 h-12 sm:h-12 font-semibold rounded-xl text-sm sm:text-base touch-manipulation"
                  >
                    Weiter
                    <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              {step === "details" && (
                <>
                  {hasUpsellItems && (
                    <Button
                      variant="outline"
                      onClick={() => setStep("upsell")}
                      className="h-11 sm:h-12 px-3 sm:px-4 text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    form="checkout-form"
                    style={{ backgroundColor: restaurant.primary_color }}
                    className="flex-1 h-12 sm:h-12 font-semibold rounded-xl text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    disabled={
                      loading || 
                      restaurant.manually_closed || 
                      (!isOpen && !restaurant.accepts_preorders) ||
                      (orderType === "delivery" && deliveryZones.length > 0 && !selectedZone) ||
                      (orderType === "delivery" && selectedZone && selectedZone.minimum_order_value && subtotal < Number(selectedZone.minimum_order_value))
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : restaurant.manually_closed ? (
                      "Restaurant geschlossen"
                    ) : orderType === "delivery" && (!street || !houseNumber || !postalCode || !city) ? (
                      "Bitte Adresse eingeben"
                    ) : orderType === "delivery" && deliveryZones.length > 0 && !selectedZone ? (
                      "Wir liefern leider nicht zu Ihnen"
                    ) : orderType === "delivery" && selectedZone && selectedZone.minimum_order_value && subtotal < Number(selectedZone.minimum_order_value) ? (
                      `Mindestbestellwert: ${Number(selectedZone.minimum_order_value).toFixed(2)}€`
                    ) : (
                      "Jetzt bestellen"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
