"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Ban, Check, Euro } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: {
    id: number
    order_number: string
    total_price: number
    payment_method: string
    stripe_payment_intent_id?: string
  }
  onSuccess: () => void
}

export function CancelOrderDialog({ open, onOpenChange, order, onSuccess }: CancelOrderDialogProps) {
  const [step, setStep] = useState<"confirm" | "amount" | "final">("confirm")
  const [refundType, setRefundType] = useState<"full" | "partial">("full")
  const [refundAmount, setRefundAmount] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)

  const isStripePayment = order.payment_method === "online" && order.stripe_payment_intent_id
  const requiresRefund = isStripePayment

  const handleCancel = async () => {
    console.log("[v0] Cancel dialog: Starting cancellation")
    
    try {
      setLoading(true)
      
      const body: any = {
        reason: "customer_request",
      }

      if (requiresRefund && refundType === "partial") {
        const amount = parseFloat(refundAmount)
        if (isNaN(amount) || amount <= 0 || amount > order.total_price) {
          toast.error("Ungültiger Rückerstattungsbetrag")
          return
        }
        // Convert to cents for API
        body.refundAmount = Math.round(amount * 100)
        console.log("[v0] Cancel dialog: Partial refund amount:", amount, "euros =", body.refundAmount, "cents")
      }

      console.log("[v0] Cancel dialog: Sending request to /api/orders/" + order.id + "/cancel")

      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      console.log("[v0] Cancel dialog: Response status:", response.status)

      const data = await response.json()
      console.log("[v0] Cancel dialog: Response data:", data)

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error
        console.error("[v0] Cancel dialog: Error from API:", errorMsg)
        throw new Error(errorMsg || "Stornierung fehlgeschlagen")
      }

      toast.success(
        requiresRefund 
          ? `Bestellung storniert und ${data.refundAmount.toFixed(2)}€ erstattet. Bestellung wurde ins Archiv verschoben.`
          : "Bestellung erfolgreich storniert und ins Archiv verschoben."
      )
      
      console.log("[v0] Cancel dialog: Cancellation successful")
      onSuccess()
      onOpenChange(false)
      resetDialog()
    } catch (error: any) {
      console.error("[v0] Cancel dialog: Error caught:", error)
      toast.error(error.message || "Fehler beim Stornieren der Bestellung")
    } finally {
      setLoading(false)
    }
  }

  const resetDialog = () => {
    setStep("confirm")
    setRefundType("full")
    setRefundAmount("")
    setConfirmText("")
  }

  const handleClose = () => {
    onOpenChange(false)
    resetDialog()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bestellung stornieren
          </DialogTitle>
          <DialogDescription>
            Bestellung #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">Wichtiger Hinweis</p>
                <p className="text-muted-foreground">
                  Diese Aktion kann nicht rückgängig gemacht werden. Die Bestellung wird als storniert markiert.
                </p>
              </div>
            </div>

            {requiresRefund && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Zahlungsmethode:</span>
                  <Badge variant="secondary">Online-Zahlung (Stripe)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Bestellwert:</span>
                  <span className="font-bold">{order.total_price.toFixed(2)}€</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label>Rückerstattungstyp wählen:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={refundType === "full" ? "default" : "outline"}
                      onClick={() => setRefundType("full")}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Vollständig</span>
                      <span className="text-xs opacity-80">{order.total_price.toFixed(2)}€</span>
                    </Button>
                    <Button
                      type="button"
                      variant={refundType === "partial" ? "default" : "outline"}
                      onClick={() => setRefundType("partial")}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Euro className="h-4 w-4" />
                      <span className="font-medium">Teilweise</span>
                      <span className="text-xs opacity-80">Betrag angeben</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (requiresRefund && refundType === "partial") {
                    setStep("amount")
                  } else {
                    setStep("final")
                  }
                }}
                disabled={loading}
              >
                Weiter
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Rückerstattungsbetrag (in Euro)</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={order.total_price}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="z.B. 15.50"
              />
              <p className="text-xs text-muted-foreground">
                Maximal: {order.total_price.toFixed(2)}€
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep("confirm")} disabled={loading}>
                Zurück
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep("final")}
                disabled={loading || !refundAmount || parseFloat(refundAmount) <= 0}
              >
                Weiter
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "final" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-2">Letzte Bestätigung erforderlich</p>
                <p className="text-muted-foreground mb-3">
                  {requiresRefund ? (
                    <>
                      Die Bestellung wird storniert und{" "}
                      <strong>
                        {refundType === "full" 
                          ? order.total_price.toFixed(2) 
                          : parseFloat(refundAmount || "0").toFixed(2)}€
                      </strong>{" "}
                      werden an den Kunden zurückerstattet.
                    </>
                  ) : (
                    "Die Bestellung wird als storniert markiert."
                  )}
                </p>
                <p className="text-muted-foreground">
                  Geben Sie zur Bestätigung <strong>STORNIEREN</strong> ein:
                </p>
              </div>
            </div>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="STORNIEREN"
              className="font-mono"
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => refundType === "partial" ? setStep("amount") : setStep("confirm")} 
                disabled={loading}
              >
                Zurück
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading || confirmText !== "STORNIEREN"}
              >
                {loading ? "Storniere..." : "Endgültig stornieren"}
              </Button>
              </DialogFooter>
            </div>
          )}
      </DialogContent>
    </Dialog>
  )
}
