"use client"

import { calculateSubtotal } from "@/lib/utils"

import type { CartItem, Restaurant, DeliveryZone } from "@/lib/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Pencil, Trash2, ShoppingBag, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  restaurant: Restaurant
  isOpen: boolean
  deliveryZones?: DeliveryZone[]
  selectedZone?: DeliveryZone | null
  orderType?: "pickup" | "delivery" | null
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemove: (index: number) => void
  onEdit: (index: number) => void
  onCheckout: () => void
}

export function CartDrawer({
  open,
  onOpenChange,
  cart,
  restaurant,
  isOpen,
  deliveryZones = [],
  selectedZone = null,
  orderType = null,
  onUpdateQuantity,
  onRemove,
  onEdit,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = calculateSubtotal(cart)

  // Calculate minimum order value based on order type
  let minimumOrderValue = 0
  let hasMinimumOrderRequirements = false
  
  if (orderType === "delivery") {
    // For delivery: use selected zone's minimum order value
    if (selectedZone && selectedZone.minimum_order_value) {
      minimumOrderValue = Number(selectedZone.minimum_order_value)
      hasMinimumOrderRequirements = minimumOrderValue > 0
    }
  }
  // For pickup (orderType === "pickup"): no minimum order requirement
  
  const meetsMinimumOrder = !hasMinimumOrderRequirements || subtotal >= minimumOrderValue
  const remainingAmount = minimumOrderValue > 0 ? minimumOrderValue - subtotal : 0

  // Can checkout if restaurant is open/accepts preorders, regardless of minimum order value
  const canCheckout = !restaurant.manually_closed && (isOpen || restaurant.accepts_preorders)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 h-[100svh] min-h-[100svh] flex flex-col bg-background">
        {/* Header - flex-none (fixed height) */}
        <SheetHeader className="flex-none px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b bg-background pt-[env(safe-area-inset-top)]">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingBag className="h-5 w-5" />
            Warenkorb
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} Artikel
              </Badge>
            )}
          </SheetTitle>
          {!isOpen && cart.length > 0 && restaurant.accepts_preorders && (
            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-800 font-medium">
                🕒 Vorbestellung möglich - Restaurant öffnet bald
              </p>
            </div>
          )}
          {!isOpen && cart.length > 0 && !restaurant.accepts_preorders && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-800 font-medium">
                ⏸️ Restaurant geschlossen - Vorbestellungen nicht verfügbar
              </p>
            </div>
          )}
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Dein Warenkorb ist leer</p>
            <p className="text-sm text-gray-400">Füge Gerichte aus der Speisekarte hinzu</p>
          </div>
        ) : (
          <>
            {/* Scrollable Content Container - contains both items AND footer */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="min-h-full flex flex-col">
                {/* Cart Items */}
                <div className="px-4 sm:px-6 py-3 space-y-2 sm:space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.menuItem.name}</span>
                            {item.variant && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs bg-gray-100">
                                {item.variant.name}
                              </Badge>
                            )}
                          </div>
                          {item.toppings.length > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                              + {item.toppings.map((t) => t.name).join(", ")}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs sm:text-sm text-gray-400 italic mt-1 truncate">"{item.notes}"</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-gray-900 text-sm sm:text-base">
                            {(item.totalPrice * item.quantity).toFixed(2)}€
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400">{item.totalPrice.toFixed(2)}€ / Stk.</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            onClick={() => onEdit(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onRemove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-7 sm:w-8 text-center font-semibold text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-white"
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spacer - pushes footer to bottom when content is short */}
                <div className="flex-1" />

                {/* Footer - now part of scrollable content, sticks to bottom with mt-auto */}
                <div className="mt-auto border-t bg-background px-4 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">Zwischensumme</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{subtotal.toFixed(2)}€</span>
                  </div>
                  
                  {/* Delivery Fee Display */}
                  {orderType === "delivery" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Liefergebühr</span>
                      <span className="font-semibold text-gray-900">
                        {selectedZone ? `${(Number(selectedZone.delivery_fee) || 0).toFixed(2)}€` : "wird berechnet"}
                      </span>
                    </div>
                  )}
                  
                  {/* Total with Delivery Fee */}
                  {orderType === "delivery" && selectedZone && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-900 font-semibold text-sm sm:text-base">Gesamt</span>
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">
                        {(subtotal + (Number(selectedZone.delivery_fee) || 0)).toFixed(2)}€
                      </span>
                    </div>
                  )}
                  
                  {/* Minimum Order Value Info - Only as hint for delivery */}
                  {orderType === "delivery" && hasMinimumOrderRequirements && !meetsMinimumOrder && (
                    <Alert className="py-2 bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs sm:text-sm text-amber-800">
                        Hinweis: Mindestbestellwert für Lieferung: {minimumOrderValue.toFixed(2)}€
                        <br />
                        <span className="font-medium">Noch {remainingAmount.toFixed(2)}€ bis zum Mindestbestellwert</span>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Success indicator when minimum is met - Only for delivery */}
                  {orderType === "delivery" && hasMinimumOrderRequirements && meetsMinimumOrder && (
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-green-800 font-medium flex items-center gap-2">
                        <span className="text-green-600">✓</span> Mindestbestellwert erfüllt
                      </p>
                    </div>
                  )}
                  
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    {orderType === "delivery" && hasMinimumOrderRequirements 
                      ? "Mindestbestellwert abhängig von deiner Lieferadresse"
                      : orderType === "pickup"
                        ? "Abholung - kein Mindestbestellwert"
                        : "Liefergebühren werden im nächsten Schritt berechnet"}
                  </p>
                  
                  <Button
                    className="w-full h-14 sm:h-14 text-base sm:text-lg font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    style={{ backgroundColor: canCheckout ? restaurant.primary_color : undefined }}
                    onClick={onCheckout}
                    disabled={!canCheckout}
                  >
                    {restaurant.manually_closed 
                      ? "Restaurant geschlossen" 
                      : canCheckout 
                        ? (isOpen ? "Weiter zur Kasse" : "Vorbestellen") 
                        : "Aktuell geschlossen"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
