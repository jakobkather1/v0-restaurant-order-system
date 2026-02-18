"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CreditCard, CheckCircle2, XCircle, Loader2, ExternalLink, 
  AlertTriangle, RefreshCw, Banknote, ShieldCheck
} from "lucide-react"
import type { Restaurant } from "@/lib/types"

interface StripeTabProps {
  restaurant: Restaurant
}

interface StripeStatus {
  connected: boolean
  accountId?: string
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  dashboardUrl?: string
}

export function StripeTab({ restaurant }: StripeTabProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check Stripe status on mount
  useEffect(() => {
    checkStatus()
  }, [restaurant.id])

  async function checkStatus() {
    setChecking(true)
    setError(null)
    try {
      const response = await fetch(`/api/stripe/connect?restaurantId=${restaurant.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setStatus(data)
      } else {
        setError(data.error || "Fehler beim Abrufen des Status")
      }
    } catch (err) {
      setError("Netzwerkfehler beim Abrufen des Stripe-Status")
    } finally {
      setChecking(false)
    }
  }

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          email: restaurant.email,
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        setError(data.error || "Fehler beim Erstellen des Stripe-Kontos")
      }
    } catch (err) {
      setError("Netzwerkfehler beim Verbinden mit Stripe")
    } finally {
      setLoading(false)
    }
  }

  function StatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${enabled ? "bg-green-50" : "bg-gray-50"}`}>
        {enabled ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400" />
        )}
        <span className={`text-sm ${enabled ? "text-green-700" : "text-gray-600"}`}>{label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stripe Zahlungen</h2>
        <p className="text-gray-600">Verbinde dein Stripe-Konto um Zahlungen zu empfangen</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {checking ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <span className="ml-3 text-gray-600">Stripe-Status wird geladen...</span>
          </CardContent>
        </Card>
      ) : status?.connected && status.onboardingComplete ? (
        // Connected and onboarding complete
        <div className="space-y-4">
          <Card className="bg-white border-gray-200 border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Stripe verbunden</CardTitle>
                    <CardDescription>Dein Restaurant kann Zahlungen empfangen</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkStatus}
                  className="bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusBadge enabled={status.onboardingComplete} label="Einrichtung abgeschlossen" />
                <StatusBadge enabled={status.chargesEnabled} label="Zahlungen aktiv" />
                <StatusBadge enabled={status.payoutsEnabled} label="Auszahlungen aktiv" />
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Stripe Account ID</p>
                <code className="text-sm font-mono text-gray-900">{status.accountId}</code>
              </div>

              {status.dashboardUrl && (
                <Button asChild className="w-full bg-[#635BFF] hover:bg-[#5851db]">
                  <a href={status.dashboardUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stripe Dashboard öffnen
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Features */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Zahlungsoptionen</CardTitle>
              <CardDescription>Diese Zahlungsmethoden sind für deine Kunden verfügbar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-medium text-gray-900">Kreditkarte</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, AMEX</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Banknote className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-medium text-gray-900">SEPA Lastschrift</p>
                    <p className="text-xs text-gray-500">Bankeinzug aus EU</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-medium text-gray-900">Apple Pay / Google Pay</p>
                    <p className="text-xs text-gray-500">Schnelle mobile Zahlung</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-medium text-gray-900">Klarna / Sofort</p>
                    <p className="text-xs text-gray-500">Sofortüberweisung</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : status?.connected && !status.onboardingComplete ? (
        // Connected but onboarding incomplete
        <Card className="bg-white border-gray-200 border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Einrichtung unvollständig</CardTitle>
                <CardDescription>Bitte schließe die Stripe-Einrichtung ab</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Du hast die Stripe-Einrichtung begonnen, aber noch nicht abgeschlossen. 
              Klicke auf den Button unten, um fortzufahren.
            </p>
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              className="w-full bg-[#635BFF] hover:bg-[#5851db]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird geladen...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Einrichtung fortsetzen
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Not connected
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#635BFF]/10 rounded-full">
                <CreditCard className="h-8 w-8 text-[#635BFF]" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Mit Stripe verbinden</CardTitle>
                <CardDescription>
                  Verbinde dein Stripe-Konto um Online-Zahlungen zu akzeptieren
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Sichere Zahlungen</p>
                <p className="text-sm text-gray-600">PCI-konforme Zahlungsabwicklung</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Banknote className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Direkte Auszahlung</p>
                <p className="text-sm text-gray-600">Geld direkt auf dein Bankkonto</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Alle Zahlungsmethoden</p>
                <p className="text-sm text-gray-600">Kreditkarte, SEPA, Apple Pay & mehr</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Betrugsschutz</p>
                <p className="text-sm text-gray-600">Automatische Betrugserkennung</p>
              </div>
            </div>

            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
              <p className="text-sm text-sky-800">
                <strong>Hinweis:</strong> Du wirst zu Stripe weitergeleitet, um dein Konto 
                zu erstellen oder zu verbinden. Nach der Einrichtung wirst du automatisch 
                zurückgeleitet.
              </p>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={loading}
              className="w-full bg-[#635BFF] hover:bg-[#5851db] h-12 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verbindung wird hergestellt...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Mit Stripe verbinden
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
