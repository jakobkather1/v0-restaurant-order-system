"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updatePlatformAgbAvv } from "@/app/super-admin/actions"
import { Scale, FileText, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface PlatformAgbAvvTabProps {
  settings: Record<string, string>
}

export function PlatformAgbAvvTab({ settings }: PlatformAgbAvvTabProps) {
  const [agbs, setAgbs] = useState(settings.platform_agbs || "")
  const [avv, setAvv] = useState(settings.platform_avv || "")
  const [loading, setLoading] = useState(false)
  const [showAgbPreview, setShowAgbPreview] = useState(false)
  const [showAvvPreview, setShowAvvPreview] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!agbs.trim() || !avv.trim()) {
      toast.error("Bitte füllen Sie beide Felder aus")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.set("agbs", agbs)
      formData.set("avv", avv)

      const result = await updatePlatformAgbAvv(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("AGBs und AVV gespeichert")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save AGBs/AVV:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Plattform AGBs & AVV
          </CardTitle>
          <CardDescription>
            Konfiguriere die AGBs und den Auftragsverarbeitungsvertrag für alle Restaurants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Scale className="h-4 w-4" />
            <AlertDescription>
              Restaurant-Besitzer müssen diese Dokumente akzeptieren, bevor Kunden bei ihnen bestellen können.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="agbs">Allgemeine Geschäftsbedingungen (HTML)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgbPreview(true)}
                disabled={!agbs.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </Button>
            </div>
            <Textarea
              id="agbs"
              value={agbs}
              onChange={(e) => setAgbs(e.target.value)}
              placeholder="<h2>Allgemeine Geschäftsbedingungen</h2><p>Ihre AGBs hier...</p>"
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">Zeichen: {agbs.length}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="avv">Auftragsverarbeitungsvertrag (HTML)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAvvPreview(true)}
                disabled={!avv.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </Button>
            </div>
            <Textarea
              id="avv"
              value={avv}
              onChange={(e) => setAvv(e.target.value)}
              placeholder="<h2>Auftragsverarbeitungsvertrag (AVV)</h2><p>Ihr AVV hier...</p>"
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">Zeichen: {avv.length}</p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Speichert..." : "AGBs & AVV speichern"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAgbPreview} onOpenChange={setShowAgbPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschau: Allgemeine Geschäftsbedingungen</DialogTitle>
            <DialogDescription>So sehen Restaurant-Besitzer die AGBs</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: agbs }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAvvPreview} onOpenChange={setShowAvvPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschau: Auftragsverarbeitungsvertrag</DialogTitle>
            <DialogDescription>So sehen Restaurant-Besitzer den AVV</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: avv }} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
