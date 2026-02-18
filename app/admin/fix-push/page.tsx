"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Copy, Loader2, Key, Database, Send } from "lucide-react"
import { toast } from "sonner"

export default function FixPushPage() {
  const [loading, setLoading] = useState(false)
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string; email: string } | null>(null)
  const [step, setStep] = useState(1)
  const [subscriptionsDeleted, setSubscriptionsDeleted] = useState(false)

  const generateNewKeys = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/vapid-generate")
      const data = await response.json()
      
      if (data.publicKey && data.privateKey) {
        setKeys({
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          email: "mailto:admin@order-terminal.de"
        })
        setStep(2)
        toast.success("Neue VAPID Keys generiert!")
      } else {
        toast.error("Keys konnten nicht generiert werden")
      }
    } catch (error) {
      toast.error("Fehler beim Generieren")
    } finally {
      setLoading(false)
    }
  }

  const deleteOldSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/push/reset-subscriptions", {
        method: "POST"
      })
      const data = await response.json()
      
      if (data.success) {
        setSubscriptionsDeleted(true)
        setStep(4)
        toast.success("Alte Subscriptions gelöscht!")
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      toast.error("Fehler beim Löschen")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopiert!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Push-Benachrichtigungen Reparieren</h1>
          <p className="text-gray-600">Schritt-für-Schritt Anleitung zum Beheben von VAPID Problemen</p>
        </div>

        {/* Step 1: Generate Keys */}
        <Card className={step >= 1 ? "border-sky-500 border-2" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-sky-600" />
                <CardTitle>Schritt 1: Neue VAPID Keys Generieren</CardTitle>
              </div>
              {keys && <CheckCircle className="h-6 w-6 text-green-600" />}
            </div>
            <CardDescription>
              Generiere ein neues, gültiges VAPID Keypair mit der web-push Library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!keys ? (
              <Button 
                onClick={generateNewKeys} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Neue Keys Generieren
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Keys erfolgreich generiert! Kopiere diese in Vercel.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">NEXT_PUBLIC_VAPID_PUBLIC_KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.publicKey}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-sm font-mono bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keys.publicKey, "Public Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">VAPID_PRIVATE_KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.privateKey}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-sm font-mono bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(keys.privateKey, "Private Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">VAPID_EMAIL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keys.email}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
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
        {keys && (
          <Card className={step >= 2 ? "border-sky-500 border-2" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle>Schritt 2: Keys in Vercel Eintragen</CardTitle>
              </div>
              <CardDescription>
                Füge die Keys in Vercel Environment Variables ein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Öffne Vercel Dashboard → Project Settings → Environment Variables</li>
                <li>Lösche die alten VAPID Keys (falls vorhanden)</li>
                <li>Füge die drei neuen Keys ein (siehe oben)</li>
                <li>Klicke auf "Save"</li>
                <li>Deploy das Projekt neu (wichtig!)</li>
              </ol>
              <Button 
                className="w-full mt-4 bg-transparent" 
                variant="outline"
                onClick={() => setStep(3)}
              >
                Keys eingetragen, weiter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Delete Subscriptions */}
        {step >= 3 && (
          <Card className={step >= 3 ? "border-sky-500 border-2" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-600" />
                  <CardTitle>Schritt 3: Alte Subscriptions Löschen</CardTitle>
                </div>
                {subscriptionsDeleted && <CheckCircle className="h-6 w-6 text-green-600" />}
              </div>
              <CardDescription>
                Lösche alle Push-Subscriptions die mit den alten Keys erstellt wurden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!subscriptionsDeleted ? (
                <>
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      Dies löscht ALLE Push-Subscriptions. Admins müssen Push-Benachrichtigungen neu aktivieren.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={deleteOldSubscriptions} 
                    disabled={loading}
                    className="w-full"
                    variant="destructive"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Lösche...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Alte Subscriptions Löschen
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Alle alten Subscriptions wurden gelöscht!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Test */}
        {step >= 4 && (
          <Card className="border-green-500 border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                <CardTitle>Schritt 4: Testen</CardTitle>
              </div>
              <CardDescription>
                Aktiviere Push-Benachrichtigungen im Admin Dashboard neu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Setup abgeschlossen!</p>
                  <p className="text-sm">
                    1. Öffne /{"{slug}"}/admin/dashboard<br />
                    2. Gehe zu Einstellungen → Sicherheit<br />
                    3. Aktiviere Push-Benachrichtigungen<br />
                    4. Erstelle eine Testbestellung<br />
                    5. Du solltest eine Benachrichtigung erhalten!
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Der BadJwtToken Fehler sollte jetzt verschwunden sein. Falls nicht, überprüfe ob du:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Die Keys exakt kopiert hast (kein Whitespace)</li>
                  <li>Nach dem Speichern neu deployed hast</li>
                  <li>Alte Subscriptions wirklich gelöscht wurden</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
