"use client"

import { AlertCircle, BarChart3, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/**
 * Analytics Info Component
 * Shows which analytics services are integrated and their status
 */
export function AnalyticsInfo() {
  const analyticsServices = [
    {
      name: "Vercel Analytics",
      provider: "Vercel",
      status: "active",
      description: "Web Vitals, Page Performance, Browser Usage",
      requiresConsent: true,
      consentCategory: "analytics",
      cookieName: "_vercel_analytics",
      cookieDuration: "1 year",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <div>
            <CardTitle>Analytics Übersicht</CardTitle>
            <CardDescription>
              Welche Analytics-Tools sind integriert und wie funktioniert die Cookie-Zustimmung
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <p className="font-semibold text-sm text-purple-900">Aktuelle Konfiguration</p>
          </div>
          <p className="text-sm text-purple-800">
            Analytics werden <strong>NUR</strong> aktiviert wenn der User der "Analytics"-Kategorie zustimmt.
            Wenn der User ablehnt, wird kein Tracking durchgeführt.
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {analyticsServices.map((service) => (
            <div key={service.name} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{service.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {service.provider}
                  </Badge>
                  {service.status === "active" ? (
                    <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Konfiguriert
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600">{service.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Consent erforderlich:</p>
                  <p className="font-medium flex items-center gap-1">
                    {service.requiresConsent ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {service.consentCategory}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-600" />
                        Nein
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cookie-Namen:</p>
                  <p className="font-mono text-xs">{service.cookieName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Dauer:</p>
                  <p className="font-medium">{service.cookieDuration}</p>
                </div>
              </div>

              {service.implementationNote && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Hinweis:</span> {service.implementationNote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <h5 className="font-semibold text-sm">So funktioniert die Analytics-Zustimmung:</h5>
          <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
            <li>
              <strong>Besucher öffnet die Website</strong> → Cookie-Banner wird angezeigt
            </li>
            <li>
              <strong>User klickt "Alle akzeptieren"</strong> → Analytics wird sofort aktiviert
            </li>
            <li>
              <strong>User klickt "Ablehnen"</strong> → Nur notwendige Cookies aktiv, Analytics deaktiviert
            </li>
            <li>
              <strong>Consent-Cookie wird für 1 Jahr gespeichert</strong> → Banner erscheint nicht erneut
            </li>
            <li>
              <strong>Browser-Cookies (z.B. _ga)</strong> werden nur bei "Analytics = true" gespeichert
            </li>
          </ol>
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <h5 className="font-semibold text-sm">Wie du Debug kannst:</h5>
          <div className="text-xs text-gray-700 space-y-1 font-mono bg-white p-2 rounded border">
            <p>
              <span className="text-blue-600">1. Öffne Browser DevTools</span> (F12)
            </p>
            <p>
              <span className="text-blue-600">2. Application → Cookies</span> → suche "cookie_consent"
            </p>
            <p>
              <span className="text-blue-600">3. Wert hat Format:</span> &#123;version, consent: &#123;analytics: true/false&#125;&#125;
            </p>
            <p>
              <span className="text-blue-600">4. Prüfe ob _vercel_analytics Cookies existieren</span> (nur wenn analytics: true)
            </p>
            <p>
              <span className="text-blue-600">5. Konsole-Logs:</span> [v0] Analytics enabled/disabled
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
