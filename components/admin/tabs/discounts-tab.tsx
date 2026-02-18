"use client"

import { useState } from "react"
import { createDiscountCode, toggleDiscountCode, deleteDiscountCode } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Tag } from "lucide-react"
import type { DiscountCode } from "@/lib/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface DiscountsTabProps {
  discountCodes: DiscountCode[]
}

export function DiscountsTab({ discountCodes }: DiscountsTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set("discountType", discountType)
    const result = await createDiscountCode(formData)
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success("Rabattcode erstellt")
    setShowDialog(false)
    setLoading(false)
  }

  async function handleToggle(id: number, isActive: boolean) {
    await toggleDiscountCode(id, isActive)
  }

  async function handleDelete(id: number) {
    if (confirm("Rabattcode löschen?")) {
      await deleteDiscountCode(id)
    }
  }

  function handleDialogChange(open: boolean) {
    setShowDialog(open)
    if (open) {
      setError(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rabattcodes</h2>
          <p className="text-muted-foreground">Erstelle und verwalte Gutscheincodes</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Code
        </Button>
      </div>

      {discountCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Noch keine Rabattcodes erstellt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {discountCodes.map((code) => (
            <Card key={code.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-lg font-bold bg-gray-100 px-2 py-1 rounded">{code.code}</code>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {code.discount_type === "percentage"
                        ? `${Number(code.discount_value)}%`
                        : `${Number(code.discount_value).toFixed(2)}€`}
                    </div>
                    {Number(code.minimum_order_value) > 0 && (
                      <div className="text-sm text-amber-600 mt-1">
                        Ab {Number(code.minimum_order_value).toFixed(2)}€ Bestellwert
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">{code.usage_count}x verwendet</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Switch checked={code.is_active} onCheckedChange={(checked) => handleToggle(code.id, checked)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(code.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          <strong>Hinweis:</strong> Rabatte gelten nur auf den Warenwert der Speisen, nicht auf Liefergebühren.
        </p>
      </div>

      <Dialog open={showDialog} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Rabattcode</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" placeholder="z.B. SOMMER20" className="uppercase" required />
              <p className="text-xs text-gray-500">Wird automatisch in Großbuchstaben umgewandelt</p>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Art</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Prozentual</SelectItem>
                    <SelectItem value="fixed">Fixbetrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">{discountType === "percentage" ? "Prozent (%)" : "Betrag (€)"}</Label>
                <Input id="discountValue" name="discountValue" type="number" step="0.01" min="0" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumOrderValue">Mindestbestellwert (€)</Label>
              <Input
                id="minimumOrderValue"
                name="minimumOrderValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">0 = kein Mindestbestellwert erforderlich</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Erstelle..." : "Code erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
