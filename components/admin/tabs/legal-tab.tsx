"use client"

import { useState } from "react"
import { updateLegalSettings } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { Restaurant } from "@/lib/types"

interface LegalTabProps {
  restaurant: Restaurant
}

export function LegalTab({ restaurant }: LegalTabProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    const result = await updateLegalSettings(formData)
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Rechtliche Angaben gespeichert" })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rechtliches</h2>
        <p className="text-muted-foreground">Impressum und Datenschutzerklärung für dein Restaurant-Terminal</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Impressum-Daten</CardTitle>
          <CardDescription>Strukturierte Angaben für das Impressum</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Betreiber / Inhaber</Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={restaurant.legal_name || ""}
                placeholder="z.B. Max Mustermann oder GmbH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalAddress">Vollständige Adresse</Label>
              <Textarea
                id="legalAddress"
                name="legalAddress"
                defaultValue={restaurant.legal_address || ""}
                placeholder="Straße und Hausnummer&#10;Postleitzahl Stadt&#10;Land"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalContact">Kontaktdaten (Tel/E-Mail)</Label>
              <Textarea
                id="legalContact"
                name="legalContact"
                defaultValue={restaurant.legal_contact || ""}
                placeholder="Telefon: +49...&#10;E-Mail: info@..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Steuernummer / Handelsregisternummer</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={restaurant.tax_id || ""}
                placeholder="USt-IdNr. oder HRA-Nummer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalDisclaimer">Haftungshinweis</Label>
              <Textarea
                id="legalDisclaimer"
                name="legalDisclaimer"
                defaultValue={restaurant.legal_disclaimer || ""}
                placeholder="Optionale Haftungsausschlüsse..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datenschutzerklärung</CardTitle>
          <CardDescription>Paste hier deine Datenschutzerklärung ein (z.B. von e-Recht24)</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privacyPolicy">Datenschutzerklärung (Markdown oder HTML)</Label>
              <Textarea
                id="privacyPolicy"
                name="privacyPolicy"
                defaultValue={restaurant.privacy_policy_content || ""}
                placeholder="Kopiere hier deine vollständige Datenschutzerklärung..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unterstützt Markdown-Formatierung. Zeilenumbrüche und Struktur bleiben erhalten.
              </p>
            </div>
            <Button type="submit" disabled={loading}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
