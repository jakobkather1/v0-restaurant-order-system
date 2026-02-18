'use client';

import type { Restaurant, DeliveryZone } from "@/lib/types"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, Star, Truck, Store, MapPin, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RestaurantInfoModal } from "./restaurant-info-modal"

interface RestaurantInfoBarProps {
  restaurant: Restaurant
  isOpen: boolean
  isCustomDomain?: boolean
  reviewStats?: { avgRating: number; reviewCount: number }
  deliveryZones?: DeliveryZone[]
  selectedZone?: DeliveryZone
  orderType?: "pickup" | "delivery" | null
  textColor?: string
  onChangeOrderType?: (type: "pickup" | "delivery") => void
}

export function RestaurantInfoBar({ 
  restaurant, 
  isOpen, 
  isCustomDomain,
  reviewStats, 
  deliveryZones, 
  selectedZone, 
  orderType,
  textColor = "#1f2937",
  onChangeOrderType
}: RestaurantInfoBarProps) {
  const [showZonesDialog, setShowZonesDialog] = useState(false)
  
  // If a zone is selected, use its values; otherwise show minimum across all zones
  const displayMinOrderValue = selectedZone && selectedZone.minimum_order_value > 0
    ? Number(selectedZone.minimum_order_value)
    : deliveryZones && deliveryZones.length > 0
      ? Math.min(...deliveryZones.map(z => Number(z.minimum_order_value)).filter(v => v > 0))
      : null
  
  const deliveryFee = selectedZone ? Number(selectedZone.delivery_fee) : null

  return (
    <div className="bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
          {/* Restaurant Info Button - Left Side with Border */}
          <div className="border rounded-lg" style={{ borderColor: textColor }}>
            <RestaurantInfoModal 
              restaurant={restaurant} 
              isCustomDomain={isCustomDomain} 
              variant="button"
              textColor={textColor}
            />
          </div>
          
          {/* Opening Status */}
          {isOpen ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Clock className="h-3 w-3 flex-shrink-0" style={{ color: textColor }} />
              <span className="font-medium text-[10px] sm:text-xs leading-tight" style={{ color: textColor }}>Geöffnet</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" style={{ color: textColor }} />
              <span className="font-medium text-[10px] sm:text-xs leading-tight" style={{ color: textColor }}>
                {restaurant.accepts_preorders ? "Vorbestellung" : "Geschlossen"}
              </span>
            </div>
          )}

          {/* Reviews */}
          {reviewStats && reviewStats.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Star className="h-3 w-3 flex-shrink-0 fill-current" style={{ color: textColor }} />
              <span className="font-medium text-[10px] sm:text-xs leading-tight" style={{ color: textColor }}>
                {reviewStats.avgRating.toFixed(1)} ({reviewStats.reviewCount})
              </span>
            </div>
          )}

          {/* Order Type Toggle */}
          {orderType && onChangeOrderType && (
            <div className="flex items-center gap-0 border rounded-lg overflow-hidden" style={{ borderColor: textColor }}>
              <button
                onClick={() => onChangeOrderType("pickup")}
                className={`flex items-center gap-1.5 px-2 py-1.5 transition-all ${
                  orderType === "pickup" ? "font-bold" : "opacity-60 hover:opacity-100"
                }`}
                style={{ 
                  backgroundColor: orderType === "pickup" ? `${textColor}15` : "transparent",
                  color: textColor
                }}
              >
                <Store className="h-3 w-3 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight">Abholung</span>
              </button>
              <div className="w-px h-4 opacity-30" style={{ backgroundColor: textColor }} />
              <button
                onClick={() => onChangeOrderType("delivery")}
                className={`flex items-center gap-1.5 px-2 py-1.5 transition-all ${
                  orderType === "delivery" ? "font-bold" : "opacity-60 hover:opacity-100"
                }`}
                style={{ 
                  backgroundColor: orderType === "delivery" ? `${textColor}15` : "transparent",
                  color: textColor
                }}
              >
                <Truck className="h-3 w-3 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs leading-tight">Lieferung</span>
              </button>
            </div>
          )}




        </div>
      </div>

      {/* Delivery Zones Dialog */}
      <Dialog open={showZonesDialog} onOpenChange={setShowZonesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Unsere Liefergebiete</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {deliveryZones?.map((zone) => (
              <div
                key={zone.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="font-semibold text-lg mb-2">{zone.name}</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[120px]">Postleitzahlen:</span>
                    <span className="text-muted-foreground">{zone.postal_codes.join(", ")}</span>
                  </div>
                  
                  {zone.minimum_order_value > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Mindestbestellwert:</span>
                      <span className="text-muted-foreground">{Number(zone.minimum_order_value).toFixed(2)}€</span>
                    </div>
                  )}
                  
                  {zone.delivery_fee > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Liefergebühr:</span>
                      <span className="text-muted-foreground">{Number(zone.delivery_fee).toFixed(2)}€</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
