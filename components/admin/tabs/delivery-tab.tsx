"use client"

import { useState } from "react"
import { createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, MapPin } from "lucide-react"
import type { DeliveryZone } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeliveryTabProps {
  deliveryZones: DeliveryZone[]
}

export function DeliveryTab({ deliveryZones }: DeliveryTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<DeliveryZone | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    if (editing) {
      formData.set("id", editing.id.toString())
      await updateDeliveryZone(formData)
    } else {
      await createDeliveryZone(formData)
    }
    setShowDialog(false)
    setEditing(null)
    setLoading(false)
  }

  async function handleDelete(id: number) {
    if (confirm("Lieferzone löschen?")) {
      await deleteDeliveryZone(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lieferzonen</h2>
          <p className="text-muted-foreground">Definiere Liefergebiete und Preise</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setShowDialog(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neue Zone
        </Button>
      </div>

      {deliveryZones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Noch keine Lieferzonen definiert</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deliveryZones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(zone)
                        setShowDialog(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{Number(zone.price).toFixed(2)}€</div>
                {zone.postal_codes.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">PLZ:</span> {zone.postal_codes.join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Zone bearbeiten" : "Neue Lieferzone"}</DialogTitle>
            <DialogDescription>Definiere Name, Preis und PLZ-Bereiche</DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoneName">Name *</Label>
              <Input
                id="zoneName"
                name="name"
                defaultValue={editing?.name || ""}
                placeholder="z.B. Innenstadt"
                required
              />
            </div>
                <div className="space-y-2">
                  <Label htmlFor="zonePrice">Lieferpreis (€)</Label>
                  <Input id="zonePrice" name="price" type="number" step="0.01" min="0" defaultValue={editing?.price || 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrder">Mindestbestellwert (€)</Label>
                  <Input 
                    id="minimumOrder" 
                    name="minimumOrderValue" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    defaultValue={editing?.minimum_order_value || 0} 
                    placeholder="z.B. 15.00"
                  />
                  <p className="text-xs text-muted-foreground">Mindestbestellwert für diese Lieferzone</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zonePlz">Postleitzahlen (kommagetrennt)</Label>
                  <Input
                    id="zonePlz"
                    name="postalCodes"
                    defaultValue={editing?.postal_codes.join(", ") || ""}
                    placeholder="z.B. 12345, 12346, 12347"
                  />
                  <p className="text-xs text-muted-foreground">Zur Validierung der Kundenadresse</p>
                </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
