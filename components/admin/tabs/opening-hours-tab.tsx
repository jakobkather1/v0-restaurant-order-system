"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import type { Restaurant } from "@/lib/types"
import { updateOpeningHours } from "@/app/[slug]/admin/actions"
import { toast } from "sonner"

const DAYS = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
] as const

interface OpeningHoursTabProps {
  restaurant: Restaurant
}

export function OpeningHoursTab({ restaurant }: OpeningHoursTabProps) {
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(
    restaurant.opening_hours || {}
  )

  async function handleSubmit() {
    setLoading(true)
    try {
      const result = await updateOpeningHours(hours)
      if (result.success) {
        toast.success("Öffnungszeiten wurden aktualisiert")
      } else {
        toast.error(result.error || "Fehler beim Speichern")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern der Öffnungszeiten")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-sky-600" />
          <CardTitle className="text-gray-900">Öffnungszeiten</CardTitle>
        </div>
        <CardDescription>
          Bestellungen sind nur während der Öffnungszeiten möglich. Diese werden automatisch im Restaurant-Info-Fenster angezeigt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day.key} className="grid grid-cols-[120px_1fr_1fr_auto] gap-3 items-center">
              <Label className="text-sm font-medium text-gray-700">{day.label}</Label>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Öffnet</Label>
                <Input
                  type="time"
                  value={hours[day.key]?.open || ""}
                  onChange={(e) =>
                    setHours({
                      ...hours,
                      [day.key]: { ...hours[day.key], open: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Schließt</Label>
                <Input
                  type="time"
                  value={hours[day.key]?.close || ""}
                  onChange={(e) =>
                    setHours({
                      ...hours,
                      [day.key]: { ...hours[day.key], close: e.target.value },
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newHours = { ...hours }
                  delete newHours[day.key]
                  setHours(newHours)
                }}
                className="text-xs text-gray-500 hover:text-red-600 mt-5"
              >
                Geschlossen
              </Button>
            </div>
          ))}
          <Button onClick={handleSubmit} disabled={loading} className="mt-4 bg-sky-600 hover:bg-sky-700">
            {loading ? "Wird gespeichert..." : "Öffnungszeiten speichern"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
