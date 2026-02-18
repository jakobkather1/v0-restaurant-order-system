"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function FixVapidKeysPage() {
  const [loading, setLoading] = useState(false)
  const [keys, setKeys] = useState<{
    publicKey: string
    privateKey: string
    email: string
  } | null>(null)

  const generateKeys = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching VAPID keys from /api/admin/vapid-generate...")
      const response = await fetch("/api/admin/vapid-generate")
      console.log("[v0] Response status:", response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] API returned error:", errorData)
        toast.error(`API Fehler: ${errorData.error || response.statusText}`)
        return
      }
      
      const data = await response.json()
      console.log("[v0] Received data:", { 
        hasPublicKey: !!data.publicKey, 
        hasPrivateKey: !!data.privateKey,
        publicKeyLength: data.publicKey?.length,
        privateKeyLength: data.privateKey?.length
      })
      
      if (data.publicKey && data.privateKey) {
        setKeys({
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          email: "mailto:admin@order-terminal.de"
        })
        toast.success("VAPID Keys erfolgreich generiert!")
      } else {
        console.error("[v0] Keys missing in response:", data)
        toast.error("Keys fehlen in der API-Antwort")
      }
    } catch (error) {
      console.error("[v0] Error generating keys:", error)
      toast.error(`Fehler beim Generieren der Keys: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopiert!`)
  }

  const resetSubscriptions = async () => {
    if (!confirm("Alle Push-Subscriptions löschen? Admins müssen Benachrichtigungen neu aktivieren.")) {
      return
    }

    try {
      const response = await fetch("/api/admin/push/reset-subscriptions", {
        method: "POST"
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`${data.deleted} Subscriptions gelöscht`)
      }
    } catch (error) {
      toast.error("Fehler beim Löschen der Subscriptions")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔧 VAPID Keys Reparatur</h1>
          <p className="text-muted-foreground mt-2">
            Beheben Sie den "BadJwtToken" Fehler durch neue VAPID Keys
          </p>
        </div>

        {/* Problem Explanation */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Problem: BadJwtToken (403)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-red-900">
            <p><strong>Ursache:</strong> Die VAPID Keys sind kein valides Keypair oder wurden manuell erstellt.</p>
            <p><strong>Symptom:</strong> Push-Benachrichtigungen schlagen mit "BadJwtToken" fehl.</p>
            <p><strong>Lösung:</strong> Neue Keys generieren, in Vercel setzen, alte Subscriptions löschen.</p>
          </CardContent>
        </Card>

        {/* Step 1: Generate Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Schritt 1: Neue VAPID Keys generieren</CardTitle>
            <CardDescription>
              Generiert ein valides VAPID Keypair mit web-push
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateKeys} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Keys Generieren
            </Button>

            {keys && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-800">Keys erfolgreich generiert!</p>
                </div>

                {/* Public Key */}
                <div>
                  <label className="text-sm font-medium block mb-2">NEXT_PUBLIC_VAPID_PUBLIC_KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.publicKey}
                      readOnly
                      className="flex-1 p-2 border rounded font-mono text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keys.publicKey, "Public Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Länge: {keys.publicKey.length} Zeichen
                  </p>
                </div>

                {/* Private Key */}
                <div>
                  <label className="text-sm font-medium block mb-2">VAPID_PRIVATE_KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.privateKey}
                      readOnly
                      className="flex-1 p-2 border rounded font-mono text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keys.privateKey, "Private Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Länge: {keys.privateKey.length} Zeichen
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium block mb-2">VAPID_EMAIL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.email}
                      readOnly
                      className="flex-1 p-2 border rounded font-mono text-sm bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keys.email, "Email")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Update Vercel */}
        <Card>
          <CardHeader>
            <CardTitle>Schritt 2: In Vercel Environment Variables setzen</CardTitle>
            <CardDescription>
              Kopieren Sie die generierten Keys in Vercel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Gehen Sie zu Vercel → Project Settings → Environment Variables</li>
              <li>Löschen oder ersetzen Sie <code className="bg-gray-100 px-1">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code></li>
              <li>Löschen oder ersetzen Sie <code className="bg-gray-100 px-1">VAPID_PRIVATE_KEY</code></li>
              <li>Setzen Sie <code className="bg-gray-100 px-1">VAPID_EMAIL</code> falls nicht vorhanden</li>
              <li><strong>Deployen Sie neu!</strong> (Environment Variables brauchen Redeploy)</li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 3: Reset Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Schritt 3: Alte Subscriptions löschen</CardTitle>
            <CardDescription>
              Löscht alle Push-Subscriptions, die mit den alten Keys erstellt wurden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={resetSubscriptions}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Alle Subscriptions löschen
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Admins müssen Push-Benachrichtigungen im Security Tab neu aktivieren
            </p>
          </CardContent>
        </Card>

        {/* Step 4: Test */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Schritt 4: Testen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <ol className="list-decimal list-inside space-y-1">
              <li>Öffnen Sie <code className="bg-blue-100 px-1">/muster/admin/dashboard</code></li>
              <li>Gehen Sie zu Einstellungen → Sicherheit</li>
              <li>Aktivieren Sie Push-Benachrichtigungen</li>
              <li>Erstellen Sie eine Testbestellung</li>
              <li>Sie sollten eine Push-Benachrichtigung erhalten!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
