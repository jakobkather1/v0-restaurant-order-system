"use client"

import { useState } from "react"
import { createRestaurant } from "@/app/super-admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface CreateRestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRestaurantDialog({ open, onOpenChange }: CreateRestaurantDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [feeType, setFeeType] = useState<"percentage" | "fixed">("percentage")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set("feeType", feeType)
    const result = await createRestaurant(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onOpenChange(false)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Neues Restaurant erstellen</DialogTitle>
          <DialogDescription>Füge ein neues Restaurant zum System hinzu</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input id="name" name="name" placeholder="Bella Marina" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL-Slug *</Label>
            <Input id="slug" name="slug" placeholder="bella-marina" required />
            <p className="text-xs text-muted-foreground">Wird als Pfad verwendet: /bella-marina</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain (optional)</Label>
            <Input id="domain" name="domain" placeholder="bella-marina.de" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Gebührenart</Label>
              <Select value={feeType} onValueChange={(v) => setFeeType(v as "percentage" | "fixed")}>
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
              <Label htmlFor="feeValue">{feeType === "percentage" ? "Prozent (%)" : "Betrag (€)"}</Label>
              <Input id="feeValue" name="feeValue" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin-Passwort</Label>
            <Input id="adminPassword" name="adminPassword" type="password" placeholder="••••••••" />
            <p className="text-xs text-muted-foreground">Passwort für das Restaurant-Admin-Panel</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Erstelle..." : "Restaurant erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
