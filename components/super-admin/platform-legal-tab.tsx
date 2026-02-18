"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updatePlatformLegalSettings } from "@/app/super-admin/actions"
import { toast } from "sonner"
import { Save, Building2, FileText, Shield } from "lucide-react"

interface PlatformLegalTabProps {
  settings: Record<string, string>
}

export function PlatformLegalTab({ settings }: PlatformLegalTabProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await updatePlatformLegalSettings(formData)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Einstellungen gespeichert")
    }
  }

  return (
    <form action={handleSubmit}>
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Unternehmen
          </TabsTrigger>
          <TabsTrigger value="imprint" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Impressum
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Datenschutz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Plattform-Informationen</CardTitle>
              <CardDescription>Grundlegende Informationen über den Plattformbetreiber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Plattform-Name</Label>
                  <Input
                    id="platform_name"
                    name="platform_name"
                    defaultValue={settings.platform_name || ""}
                    placeholder="z.B. Restaurant Bestellsystem"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_legal_name">Firmenname</Label>
                  <Input
                    id="platform_legal_name"
                    name="platform_legal_name"
                    defaultValue={settings.platform_legal_name || ""}
                    placeholder="z.B. Muster GmbH"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform_legal_address">Adresse</Label>
                <Textarea
                  id="platform_legal_address"
                  name="platform_legal_address"
                  defaultValue={settings.platform_legal_address || ""}
                  placeholder="Musterstraße 1&#10;12345 Musterstadt&#10;Deutschland"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform_legal_contact">Kontakt</Label>
                  <Textarea
                    id="platform_legal_contact"
                    name="platform_legal_contact"
                    defaultValue={settings.platform_legal_contact || ""}
                    placeholder="E-Mail: info@example.com&#10;Telefon: +49 123 456789"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_tax_id">Steuernummer / USt-IdNr.</Label>
                  <Input
                    id="platform_tax_id"
                    name="platform_tax_id"
                    defaultValue={settings.platform_tax_id || ""}
                    placeholder="z.B. DE123456789"
                  />
                </div>
                {/* Adding platform domain field */}
                <div className="space-y-2">
                  <Label htmlFor="platform_domain">Plattform-Domain</Label>
                  <Input
                    id="platform_domain"
                    name="platform_domain"
                    defaultValue={settings.platform_domain || ""}
                    placeholder="z.B. bestellung.example.com"
                    type="text"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imprint">
          <Card>
            <CardHeader>
              <CardTitle>Impressum der Plattform</CardTitle>
              <CardDescription>
                Vollständiges Impressum des Plattformbetreibers. Wird auf allen Restaurant-Terminals unter
                "Plattform-Rechtliches" angezeigt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="platform_imprint">Impressum-Text</Label>
                <Textarea
                  id="platform_imprint"
                  name="platform_imprint"
                  defaultValue={settings.platform_imprint || ""}
                  placeholder="Vollständiges Impressum hier eingeben...&#10;&#10;Angaben gemäß § 5 TMG:&#10;Firmenname&#10;Adresse&#10;&#10;Vertreten durch:&#10;Geschäftsführer&#10;&#10;Kontakt:&#10;Telefon: ...&#10;E-Mail: ...&#10;&#10;Registereintrag:&#10;Handelsregister: ...&#10;Registernummer: ...&#10;&#10;Umsatzsteuer-ID:&#10;..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Markdown wird unterstützt. Nutze **fett** für Überschriften.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Datenschutzerklärung der Plattform</CardTitle>
              <CardDescription>
                Datenschutzerklärung des Plattformbetreibers. Wird auf allen Restaurant-Terminals unter
                "Plattform-Rechtliches" angezeigt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform_privacy_policy">Datenschutzerklärung</Label>
                <Textarea
                  id="platform_privacy_policy"
                  name="platform_privacy_policy"
                  defaultValue={settings.platform_privacy_policy || ""}
                  placeholder="Datenschutzerklärung hier eingeben...&#10;&#10;1. Datenschutz auf einen Blick&#10;&#10;Allgemeine Hinweise&#10;Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert...&#10;&#10;2. Allgemeine Hinweise und Pflichtinformationen&#10;&#10;Datenschutz&#10;Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Markdown wird unterstützt. Nutze **fett** für Überschriften.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform_terms_of_service">Nutzungsbedingungen (optional)</Label>
                <Textarea
                  id="platform_terms_of_service"
                  name="platform_terms_of_service"
                  defaultValue={settings.platform_terms_of_service || ""}
                  placeholder="Allgemeine Nutzungsbedingungen hier eingeben..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Speichern..." : "Einstellungen speichern"}
        </Button>
      </div>
    </form>
  )
}
