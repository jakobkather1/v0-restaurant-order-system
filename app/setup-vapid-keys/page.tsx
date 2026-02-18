"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, RefreshCw, Check, AlertCircle } from "lucide-react"

interface VAPIDKeys {
  publicKey: string
  privateKey: string
  email: string
}

export default function SetupVAPIDKeysPage() {
  const [keys, setKeys] = useState<VAPIDKeys | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const generateKeys = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/admin/generate-vapid-keys")
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate keys")
      }
      
      setKeys(data.keys)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">VAPID Keys Setup</h1>
          <p className="text-slate-600">
            Generieren Sie valide VAPID-Schlüssel für Web Push Notifications
          </p>
        </div>

        {/* Generate Button */}
        <Card>
          <CardHeader>
            <CardTitle>Schritt 1: Keys Generieren</CardTitle>
            <CardDescription>
              Klicken Sie auf den Button, um neue VAPID-Schlüssel zu generieren.
              Diese werden im korrekten P-256 Format erstellt (65 Bytes für Public Key).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateKeys}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Generiere Keys...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Neue VAPID Keys Generieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Fehler bei der Generierung</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keys Display */}
        {keys && (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Keys erfolgreich generiert!</CardTitle>
                <CardDescription className="text-green-700">
                  Kopieren Sie die folgenden Werte in Ihre Vercel Environment Variables
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Public Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</CardTitle>
                <CardDescription>
                  Dieser Schlüssel wird an den Client gesendet und ist öffentlich sichtbar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm break-all">
                  {keys.publicKey}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Länge: {keys.publicKey.length} Zeichen</span>
                  <span>•</span>
                  <span>Format: Base64url (P-256, 65 Bytes)</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(keys.publicKey, "public")}
                  variant="outline"
                  className="w-full"
                >
                  {copiedField === "public" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Public Key kopieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Private Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono">VAPID_PRIVATE_KEY</CardTitle>
                <CardDescription>
                  Dieser Schlüssel bleibt auf dem Server und darf NIEMALS öffentlich geteilt werden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm break-all">
                  {keys.privateKey}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Länge: {keys.privateKey.length} Zeichen</span>
                  <span>•</span>
                  <span>Format: Base64url (32 Bytes)</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(keys.privateKey, "private")}
                  variant="outline"
                  className="w-full"
                >
                  {copiedField === "private" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Private Key kopieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono">VAPID_EMAIL</CardTitle>
                <CardDescription>
                  Kontakt-Email für Push Service Provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
                  {keys.email}
                </div>
                <Button
                  onClick={() => copyToClipboard(keys.email, "email")}
                  variant="outline"
                  className="w-full"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Email kopieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Schritt 2: In Vercel Eintragen</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Öffnen Sie Vercel → Project Settings → Environment Variables</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Löschen Sie alle alten VAPID-Keys falls vorhanden</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Fügen Sie alle 3 Keys hinzu (kopieren Sie mit den Buttons oben)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>Klicken Sie "Redeploy" in Vercel (Environment Variables benötigen einen neuen Deploy)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      5
                    </span>
                    <span>Testen Sie mit /verify-push-setup</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
