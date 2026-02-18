"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Scale, FileText, ExternalLink, AlertCircle, CheckCircle2, Euro } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { acceptAgbAvv } from "@/app/[slug]/admin/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Restaurant } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AgbAvvTabProps {
  restaurant: Restaurant
  platformAgbs: string
  platformAvv: string
}

export function AgbAvvTab({ restaurant, platformAgbs, platformAvv }: AgbAvvTabProps) {
  const [showAgbDialog, setShowAgbDialog] = useState(false)
  const [showAvvDialog, setShowAvvDialog] = useState(false)
  const [agbAccepted, setAgbAccepted] = useState(false)
  const [avvAccepted, setAvvAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const hasAccepted = restaurant.agb_accepted_at && restaurant.avv_accepted_at
  const acceptedAt = restaurant.agb_accepted_at 
    ? new Date(restaurant.agb_accepted_at).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null

  async function handleAccept() {
    if (!agbAccepted || !avvAccepted) {
      toast.error("Bitte akzeptieren Sie beide Dokumente")
      return
    }

    setIsSubmitting(true)
    try {
      await acceptAgbAvv(restaurant.slug)
      toast.success("AGBs und AVV erfolgreich akzeptiert")
      router.refresh()
    } catch (error) {
      console.error("Error accepting AGBs/AVV:", error)
      toast.error("Fehler beim Akzeptieren")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            AGBs und Auftragsverarbeitungsvertrag (AVV)
          </CardTitle>
          <CardDescription>
            Akzeptieren Sie die Allgemeinen Geschäftsbedingungen und den Auftragsverarbeitungsvertrag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Fee Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Euro className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Plattform-Gebühr</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {restaurant.fee_type === "percentage" 
                      ? `${restaurant.fee_value}% vom monatlichen Umsatz`
                      : `${Number(restaurant.fee_value).toFixed(2)}€ monatlich (Fixbetrag)`}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {restaurant.fee_type === "percentage"
                      ? "Diese Gebühr wird vom monatlichen Gesamtumsatz berechnet und am Monatsende abgerechnet."
                      : "Dieser Fixbetrag wird monatlich unabhängig vom Umsatz berechnet."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasAccepted ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">
                Sie haben die AGBs und den AVV am {acceptedAt} akzeptiert. Ihre Kunden können nun Bestellungen aufgeben.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <strong>Wichtig:</strong> Kunden können erst bestellen, wenn Sie die AGBs und den AVV akzeptiert haben.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">Allgemeine Geschäftsbedingungen</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Lesen Sie die AGBs für die Nutzung der Plattform
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAgbDialog(true)}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  AGBs anzeigen
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50">
              <Scale className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">Auftragsverarbeitungsvertrag (AVV)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Lesen Sie den AVV gemäß DSGVO Art. 28
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvvDialog(true)}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  AVV anzeigen
                </Button>
              </div>
            </div>
          </div>

          {!hasAccepted && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agb-checkbox"
                  checked={agbAccepted}
                  onCheckedChange={(checked) => setAgbAccepted(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="agb-checkbox" className="text-sm font-normal cursor-pointer">
                    Ich habe die{" "}
                    <button
                      type="button"
                      onClick={() => setShowAgbDialog(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Allgemeinen Geschäftsbedingungen
                    </button>{" "}
                    gelesen und akzeptiere sie.
                  </Label>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="avv-checkbox"
                  checked={avvAccepted}
                  onCheckedChange={(checked) => setAvvAccepted(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="avv-checkbox" className="text-sm font-normal cursor-pointer">
                    Ich habe den{" "}
                    <button
                      type="button"
                      onClick={() => setShowAvvDialog(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Auftragsverarbeitungsvertrag (AVV)
                    </button>{" "}
                    gelesen und akzeptiere ihn.
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleAccept}
                disabled={!agbAccepted || !avvAccepted || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Wird gespeichert..." : "AGBs und AVV akzeptieren"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AGBs Dialog */}
      <Dialog open={showAgbDialog} onOpenChange={setShowAgbDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Allgemeine Geschäftsbedingungen</DialogTitle>
            <DialogDescription>Bitte lesen Sie die AGBs sorgfältig durch</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: platformAgbs || "<p>Keine AGBs konfiguriert</p>" }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* AVV Dialog */}
      <Dialog open={showAvvDialog} onOpenChange={setShowAvvDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auftragsverarbeitungsvertrag (AVV)</DialogTitle>
            <DialogDescription>Bitte lesen Sie den AVV sorgfältig durch</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: platformAvv || "<p>Kein AVV konfiguriert</p>" }} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
