"use client"

import React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Truck, AlertCircle, CheckCircle2 } from "lucide-react"
import type { DeliveryZone } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeliveryPreferenceModalProps {
  open: boolean
  onClose: () => void
  deliveryZones: DeliveryZone[]
  onSelectPickup: () => void
  onSelectDelivery: (address: DeliveryAddress) => void
  primaryColor: string
}

export interface DeliveryAddress {
  street: string
  number: string
  postalCode: string
  city: string
  zone: DeliveryZone
}

export function DeliveryPreferenceModal({
  open,
  onClose,
  deliveryZones,
  onSelectPickup,
  onSelectDelivery,
  primaryColor,
}: DeliveryPreferenceModalProps) {
  const [step, setStep] = useState<"choice" | "address">("choice")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [noZoneError, setNoZoneError] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("choice")
      setStreet("")
      setNumber("")
      setPostalCode("")
      setCity("")
      setSelectedZone(null)
      setNoZoneError(false)
    }
  }, [open])

  // Check for matching zone when postal code changes
  useEffect(() => {
    if (postalCode.length >= 4) {
      const zone = deliveryZones.find((z) =>
        z.postal_codes.some((code) => postalCode.startsWith(code))
      )
      if (zone) {
        setSelectedZone(zone)
        setNoZoneError(false)
        setCity(zone.name)
      } else {
        setSelectedZone(null)
        setNoZoneError(true)
        setCity("")
      }
    } else {
      setSelectedZone(null)
      setNoZoneError(false)
    }
  }, [postalCode, deliveryZones])

  const handlePickup = () => {
    onSelectPickup()
    onClose()
  }

  const handleDeliveryChoice = () => {
    setStep("address")
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedZone && street && number && postalCode && city) {
      onSelectDelivery({
        street,
        number,
        postalCode,
        city,
        zone: selectedZone,
      })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        {step === "choice" ? (
          <div className="relative">
            {/* Header with gradient background */}
            <div 
              className="px-6 py-8 text-white relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
              <div className="relative z-10">
                <DialogTitle className="text-2xl sm:text-3xl font-bold mb-2">
                  Wie möchten Sie bestellen?
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm sm:text-base">
                  Wählen Sie Ihre bevorzugte Bestellmethode
                </DialogDescription>
              </div>
            </div>

            {/* Choice buttons */}
            <div className="p-6 space-y-4">
              <button
                onClick={handlePickup}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:border-transparent hover:shadow-2xl hover:scale-[1.02]"
                style={{
                  '--hover-color': primaryColor,
                } as React.CSSProperties}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <div 
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Store className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-900 mb-1">Selbstabholung</div>
                    <p className="text-sm text-gray-600">Bestellen Sie und holen Sie direkt ab</p>
                  </div>
                  <div className="text-2xl text-gray-400 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </button>

              <button
                onClick={handleDeliveryChoice}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:border-transparent hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <div 
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Truck className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-900 mb-1">Lieferung</div>
                    <p className="text-sm text-gray-600">Bequem zu Ihnen nach Hause geliefert</p>
                  </div>
                  <div className="text-2xl text-gray-400 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </button>

              <p className="text-xs text-center text-gray-500 pt-2">
                💡 Sie können dies später jederzeit ändern
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Header with gradient background */}
            <div 
              className="px-6 py-6 text-white relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">
                    Lieferadresse eingeben
                  </DialogTitle>
                  <DialogDescription className="text-white/90 text-sm">
                    Wir zeigen Ihnen direkt Liefergebühren und Mindestbestellwert
                  </DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="p-6 space-y-5">
              {/* Street and Number */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street" className="text-sm font-semibold text-gray-700">
                    Straße *
                  </Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Musterstraße"
                    required
                    className="h-11 rounded-lg border-gray-300 focus:border-2 transition-all"
                    style={{ '--focus-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-sm font-semibold text-gray-700">
                    Nr. *
                  </Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    required
                    className="h-11 rounded-lg border-gray-300 focus:border-2 transition-all"
                  />
                </div>
              </div>

              {/* Postal Code and City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-semibold text-gray-700">
                    Postleitzahl *
                  </Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12345"
                    required
                    className="h-11 rounded-lg border-gray-300 focus:border-2 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                    Stadt *
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stadt"
                    required
                    disabled={selectedZone !== null}
                    className="h-11 rounded-lg border-gray-300 focus:border-2 transition-all disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Zone validation feedback */}
              {postalCode.length >= 4 && noZoneError && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-red-900 mb-1">Keine Lieferzone verfügbar</div>
                      <p className="text-sm text-red-700">
                        Wir liefern leider nicht zu Ihnen. Sie können aber gerne abholen!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedZone && (
                <div 
                  className="rounded-xl border-2 p-4 animate-in fade-in slide-in-from-top-2 duration-300"
                  style={{ 
                    backgroundColor: `${primaryColor}08`,
                    borderColor: `${primaryColor}40`
                  }}
                >
                  <div className="flex gap-3">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <CheckCircle2 className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span>Lieferzone:</span>
                        <span style={{ color: primaryColor }}>{selectedZone.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                          <span className="font-medium">Liefergebühr:</span>
                          <span className="font-bold">{(Number(selectedZone.delivery_fee) || 0).toFixed(2)}€</span>
                        </div>
                        {(Number(selectedZone.minimum_order_value) || 0) > 0 && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <span className="font-medium">Mindestbestellwert:</span>
                            <span className="font-bold">{(Number(selectedZone.minimum_order_value) || 0).toFixed(2)}€</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("choice")}
                  className="flex-1 h-12 rounded-xl border-2 font-semibold hover:bg-gray-50"
                >
                  Zurück
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!selectedZone || !street || !number || !postalCode || !city}
                >
                  Bestätigen
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
