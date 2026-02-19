"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateRestaurantSettings, updateOpeningHours } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { Restaurant } from "@/lib/types"

interface SettingsTabProps {
  restaurant: Restaurant
}

const DAYS = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
]

export function SettingsTab({ restaurant }: SettingsTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(restaurant.opening_hours || {})

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    
    console.log("[v0] Settings form submission started")
    
    // Ensure all fields are present to prevent overwriting with null
    if (!formData.has("primaryColor")) formData.set("primaryColor", restaurant.primary_color)
    if (!formData.has("backgroundColor")) formData.set("backgroundColor", restaurant.background_color || "#ffffff")
    if (!formData.has("textColor")) formData.set("textColor", restaurant.text_color || "#1f2937")
    if (!formData.has("checkoutInfoText")) formData.set("checkoutInfoText", restaurant.checkout_info_text || "")
    
    const result = await updateRestaurantSettings(formData)
    console.log("[v0] Update result:", result)
    
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
    } else if (result?.success) {
      setMessage({ type: "success", text: "Einstellungen gespeichert" })
      // Force refresh to get updated data from server
      router.refresh()
      console.log("[v0] Router refresh triggered")
    }
    setLoading(false)
  }

  async function handleHoursSubmit() {
    setLoading(true)
    setMessage(null)
    console.log("[v0] Opening hours submission started")
    const result = await updateOpeningHours(hours)
    console.log("[v0] Opening hours result:", result)
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
    } else if (result?.success) {
      setMessage({ type: "success", text: "Öffnungszeiten gespeichert" })
      router.refresh()
      console.log("[v0] Router refresh triggered for hours")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Einstellungen</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Stammdaten und Kontaktinformationen</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allgemein</CardTitle>
            <CardDescription>Name, Slogan und Werbebanner</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input id="name" name="name" defaultValue={restaurant.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input
                  id="slogan"
                  name="slogan"
                  defaultValue={restaurant.slogan || ""}
                  placeholder="Willkommen bei uns!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerText">Werbebanner</Label>
                <Input
                  id="bannerText"
                  name="bannerText"
                  defaultValue={restaurant.banner_text || ""}
                  placeholder="z.B. 10% Rabatt bei Abholung!"
                />
                <p className="text-xs text-muted-foreground">Erscheint als Laufband oben im Terminal</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="infoText">Info-Box Text</Label>
                <Textarea
                  id="infoText"
                  name="infoText"
                  defaultValue={restaurant.info_text || ""}
                  placeholder="Wichtige Hinweise für Kunden..."
                  rows={3}
                />
              </div>
              <input type="hidden" name="address" defaultValue={restaurant.address || ""} />
              <input type="hidden" name="email" defaultValue={restaurant.email || ""} />
              <input type="hidden" name="phone" defaultValue={restaurant.phone || ""} />
              <input type="hidden" name="ownerName" defaultValue={restaurant.owner_name || ""} />
              <input type="hidden" name="impressum" defaultValue={restaurant.impressum || ""} />
              <input type="hidden" name="checkoutInfoText" defaultValue={restaurant.checkout_info_text || ""} />
              <input type="hidden" name="primaryColor" defaultValue={restaurant.primary_color} />
              <input type="hidden" name="backgroundColor" defaultValue={restaurant.background_color || "#ffffff"} />
              <input type="hidden" name="textColor" defaultValue={restaurant.text_color || "#1f2937"} />
              <Button type="submit" disabled={loading}>
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
            <CardDescription>Adresse und Erreichbarkeit</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={restaurant.address || ""}
                  placeholder="Musterstr. 1, 12345 Stadt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" defaultValue={restaurant.phone || ""} placeholder="+49 123 456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={restaurant.email || ""}
                  placeholder="info@restaurant.de"
                />
              </div>
              <input type="hidden" name="name" defaultValue={restaurant.name} />
              <input type="hidden" name="slogan" defaultValue={restaurant.slogan || ""} />
              <input type="hidden" name="bannerText" defaultValue={restaurant.banner_text || ""} />
              <input type="hidden" name="infoText" defaultValue={restaurant.info_text || ""} />
              <input type="hidden" name="ownerName" defaultValue={restaurant.owner_name || ""} />
              <input type="hidden" name="impressum" defaultValue={restaurant.impressum || ""} />
              <input type="hidden" name="checkoutInfoText" defaultValue={restaurant.checkout_info_text || ""} />
              <input type="hidden" name="primaryColor" defaultValue={restaurant.primary_color} />
              <input type="hidden" name="backgroundColor" defaultValue={restaurant.background_color || "#ffffff"} />
              <input type="hidden" name="textColor" defaultValue={restaurant.text_color || "#1f2937"} />
              <Button type="submit" disabled={loading}>
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rechtliches</CardTitle>
            <CardDescription>Inhaber und Impressum</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Inhaber</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  defaultValue={restaurant.owner_name || ""}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impressum">Impressum</Label>
                <Textarea
                  id="impressum"
                  name="impressum"
                  defaultValue={restaurant.impressum || ""}
                  placeholder="Rechtliche Angaben..."
                  rows={4}
                />
              </div>
              <input type="hidden" name="name" defaultValue={restaurant.name} />
              <input type="hidden" name="slogan" defaultValue={restaurant.slogan || ""} />
              <input type="hidden" name="bannerText" defaultValue={restaurant.banner_text || ""} />
              <input type="hidden" name="infoText" defaultValue={restaurant.info_text || ""} />
              <input type="hidden" name="address" defaultValue={restaurant.address || ""} />
              <input type="hidden" name="email" defaultValue={restaurant.email || ""} />
              <input type="hidden" name="phone" defaultValue={restaurant.phone || ""} />
              <input type="hidden" name="checkoutInfoText" defaultValue={restaurant.checkout_info_text || ""} />
              <input type="hidden" name="primaryColor" defaultValue={restaurant.primary_color} />
              <input type="hidden" name="backgroundColor" defaultValue={restaurant.background_color || "#ffffff"} />
              <input type="hidden" name="textColor" defaultValue={restaurant.text_color || "#1f2937"} />
              <Button type="submit" disabled={loading}>
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Öffnungszeiten</CardTitle>
            <CardDescription>Bestellungen nur während der Öffnungszeiten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day.key} className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">{day.label}</Label>
                  <Input
                    type="time"
                    value={hours[day.key]?.open || ""}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day.key]: { ...hours[day.key], open: e.target.value },
                      })
                    }
                    placeholder="Öffnet"
                  />
                  <Input
                    type="time"
                    value={hours[day.key]?.close || ""}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day.key]: { ...hours[day.key], close: e.target.value },
                      })
                    }
                    placeholder="Schließt"
                  />
                </div>
              ))}
              <Button onClick={handleHoursSubmit} disabled={loading} className="mt-4">
                Öffnungszeiten speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
