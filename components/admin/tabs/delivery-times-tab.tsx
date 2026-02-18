"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Save, AlertCircle, CheckCircle } from "lucide-react"
import type { Restaurant, DeliveryZone } from "@/lib/types"
import { updateDeliveryTimes, updateRestaurantPreorders, toggleManuallyClosed } from "@/app/[slug]/admin/actions"

interface DeliveryTimesTabProps {
  restaurant: Restaurant
  deliveryZones: DeliveryZone[]
  deliveryTimes: Array<{
    id: number
    delivery_zone_id: number | null
    preparation_minutes: number
    zone?: DeliveryZone
  }>
}

export function DeliveryTimesTab({ restaurant, deliveryZones = [], deliveryTimes = [] }: DeliveryTimesTabProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [acceptsPreorders, setAcceptsPreorders] = useState(restaurant.accepts_preorders || false)
  const [manuallyClosed, setManuallyClosed] = useState(restaurant.manually_closed || false)
  
  // Initialize times from props with safety checks
  const pickupTime = deliveryTimes?.find(dt => dt.delivery_zone_id === null)
  const [times, setTimes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {
      pickup: pickupTime?.preparation_minutes || 15
    }
    
    if (deliveryZones) {
      deliveryZones.forEach(zone => {
        const zoneTime = deliveryTimes?.find(dt => dt.delivery_zone_id === zone.id)
        initial[`zone_${zone.id}`] = zoneTime?.preparation_minutes || 30
      })
    }
    
    return initial
  })

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      // Prepare data for all zones + pickup
      const timesToSave = [
        { delivery_zone_id: null, preparation_minutes: times.pickup }
      ]
      
      deliveryZones.forEach(zone => {
        timesToSave.push({
          delivery_zone_id: zone.id,
          preparation_minutes: times[`zone_${zone.id}`]
        })
      })
      
      await updateDeliveryTimes(restaurant.id, timesToSave)
      setMessage({ type: "success", text: "Lieferzeiten erfolgreich gespeichert!" })
    } catch (error) {
      setMessage({ type: "error", text: "Fehler beim Speichern der Lieferzeiten" })
    } finally {
      setLoading(false)
    }
  }

  const handlePreorderToggle = async (enabled: boolean) => {
    setAcceptsPreorders(enabled)
    setLoading(true)
    try {
      await updateRestaurantPreorders(restaurant.id, enabled)
      setMessage({ 
        type: "success", 
        text: enabled ? "Vorbestellungen aktiviert" : "Vorbestellungen deaktiviert" 
      })
    } catch (error) {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren der Vorbestellungen" })
      setAcceptsPreorders(!enabled)
    } finally {
      setLoading(false)
    }
  }

  const handleManuallyClosedToggle = async (closed: boolean) => {
    setManuallyClosed(closed)
    setLoading(true)
    try {
      await toggleManuallyClosed(restaurant.id, closed)
      setMessage({ 
        type: "success", 
        text: closed ? "Restaurant manuell geschlossen - keine Bestellungen möglich" : "Restaurant wieder geöffnet" 
      })
    } catch (error) {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren des Status" })
      setManuallyClosed(!closed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Manual Close Toggle */}
      <Card className={manuallyClosed ? "border-red-300 bg-red-50" : ""}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${manuallyClosed ? "text-red-600" : "text-orange-600"}`} />
            <CardTitle>Notfall-Schließung</CardTitle>
          </div>
          <CardDescription>
            Restaurant vorübergehend schließen - keine Bestellungen möglich (auch keine Vorbestellungen).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="manually-closed-toggle" className="text-base">
                Restaurant manuell geschlossen
              </Label>
              <p className="text-sm text-muted-foreground">
                Verwenden Sie dies, wenn Sie früher schließen oder vorübergehend keine Bestellungen annehmen möchten
              </p>
            </div>
            <Switch
              id="manually-closed-toggle"
              checked={manuallyClosed}
              onCheckedChange={handleManuallyClosedToggle}
              disabled={loading}
            />
          </div>
          {manuallyClosed && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                ⚠️ Ihr Restaurant ist derzeit manuell geschlossen. Kunden können keine Bestellungen aufgeben.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-orders Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            <CardTitle>Vorbestellungen</CardTitle>
          </div>
          <CardDescription>
            Erlauben Sie Kunden, Bestellungen aufzugeben, auch wenn Ihr Restaurant geschlossen ist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preorders-toggle" className="text-base">
                Vorbestellungen akzeptieren
              </Label>
              <p className="text-sm text-muted-foreground">
                Wenn aktiviert, können Kunden bei geschlossenem Restaurant für später bestellen
              </p>
            </div>
            <Switch
              id="preorders-toggle"
              checked={acceptsPreorders}
              onCheckedChange={handlePreorderToggle}
              disabled={loading || manuallyClosed}
            />
          </div>
          {manuallyClosed && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="text-sm text-gray-700">
                Diese Einstellung ist deaktiviert, solange das Restaurant manuell geschlossen ist.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pickup Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-600" />
            <CardTitle>Abholzeit</CardTitle>
          </div>
          <CardDescription>
            Vorbereitungszeit für Abholungen. Diese Zeit wird dem Kunden als früheste Abholzeit angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="pickup-time">Vorbereitungszeit (Minuten)</Label>
              <Input
                id="pickup-time"
                type="number"
                min="5"
                max="120"
                value={times.pickup}
                onChange={(e) =>
                  setTimes({ ...times, pickup: parseInt(e.target.value) || 15 })
                }
                className="mt-2"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Aktuell: {times.pickup} Minuten
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Zones Times */}
      {deliveryZones.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-600" />
              <CardTitle>Lieferzeiten nach Zone</CardTitle>
            </div>
            <CardDescription>
              Vorbereitungszeit für jede Lieferzone. Diese Zeit wird dem Kunden als früheste Lieferzeit angezeigt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryZones.map((zone) => (
              <div key={zone.id} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`zone-${zone.id}`}>
                    {zone.name}
                    {zone.postal_code && (
                      <span className="text-muted-foreground ml-2">
                        (PLZ: {zone.postal_code})
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`zone-${zone.id}`}
                    type="number"
                    min="15"
                    max="180"
                    value={times[`zone_${zone.id}`]}
                    onChange={(e) =>
                      setTimes({
                        ...times,
                        [`zone_${zone.id}`]: parseInt(e.target.value) || 30,
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {times[`zone_${zone.id}`]} Minuten
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Hinweis zur Zeitauswahl:</p>
              <p>
                Kunden können bei der Bestellung eine spätere Uhrzeit auswählen (Vorbestellung). 
                Die früheste auswählbare Zeit ist die aktuelle Uhrzeit plus die hier eingestellte Vorbereitungszeit.
              </p>
              <p className="mt-2">
                <strong>Beispiel:</strong> Es ist 18:03 Uhr und die Abholzeit beträgt 15 Minuten. 
                Der Kunde kann 18:18 Uhr oder später auswählen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          size="lg"
          className="bg-sky-600 hover:bg-sky-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Speichern..." : "Lieferzeiten speichern"}
        </Button>
      </div>
    </div>
  )
}
