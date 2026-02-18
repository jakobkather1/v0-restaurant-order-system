"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Globe, Copy, Check } from "lucide-react"

interface DomainRequest {
  id: number
  restaurant_id: number
  requested_domain: string
  status: "pending" | "completed" | "rejected"
  notes: string | null
  created_at: string
  updated_at: string
}

export function DomainSetupSection() {
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [existingRequest, setExistingRequest] = useState<DomainRequest | null>(null)
  const [copied, setCopied] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    fetchExistingRequest()
  }, [])

  async function fetchExistingRequest() {
    try {
      const res = await fetch("/api/admin/domain-request")
      if (res.ok) {
        const data = await res.json()
        setExistingRequest(data.request)
      }
    } catch (err) {
      console.error("Error fetching domain request:", err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/admin/domain-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit domain request")
        return
      }

      setSuccess(true)
      setDomain("")
      fetchExistingRequest()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleWithdraw() {
    if (!confirm("Möchten Sie Ihre Domain-Anfrage wirklich zurückziehen?")) {
      return
    }

    setWithdrawing(true)
    setError("")

    try {
      const res = await fetch("/api/admin/domain-request", {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to withdraw domain request")
        return
      }

      setExistingRequest(null)
      setSuccess(true)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setWithdrawing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Ausstehend</Badge>
      case "completed":
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" /> Abgeschlossen</Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Abgelehnt</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Eigene Domain einrichten</CardTitle>
        </div>
        <CardDescription>
          Verbinden Sie Ihre eigene Domain mit Ihrem Restaurant (z.B. restaurant.de)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Request Status */}
        {existingRequest && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{existingRequest.requested_domain}</span>
                    {getStatusBadge(existingRequest.status)}
                  </div>
                  {existingRequest.status === "pending" && (
                    <p className="text-sm text-muted-foreground">
                      Ihre Domain-Anfrage wird bearbeitet. Sie werden benachrichtigt, sobald sie aktiviert wurde.
                    </p>
                  )}
                  {existingRequest.status === "completed" && (
                    <p className="text-sm text-green-600">
                      ✓ Ihre Domain ist aktiv und funktioniert!
                    </p>
                  )}
                  {existingRequest.status === "rejected" && existingRequest.notes && (
                    <p className="text-sm text-red-600">
                      Grund: {existingRequest.notes}
                    </p>
                  )}
                </div>
                {existingRequest.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? "Wird zurückgezogen..." : "Anfrage zurückziehen"}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Step-by-Step Instructions */}
        {(!existingRequest || existingRequest.status === "rejected") && (
          <>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Domain registrieren</h4>
                  <p className="text-sm text-muted-foreground">
                    Falls noch nicht vorhanden, registrieren Sie eine Domain bei einem Domain-Provider 
                    (z.B. GoDaddy, Namecheap, IONOS, Strato)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">DNS-Einstellungen vornehmen</h4>
                  <p className="text-sm text-muted-foreground">
                    Fügen Sie bei Ihrem Domain-Provider folgende DNS-Einträge hinzu:
                  </p>
                  <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm font-mono">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-semibold">A</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-semibold">@</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-semibold">76.76.21.21</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("76.76.21.21")}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Die DNS-Änderungen können 5-60 Minuten dauern, bis sie aktiv sind.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Domain eintragen und Anfrage senden</h4>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie Ihre Domain ein und senden Sie die Anfrage ab. 
                    Wir aktivieren Ihre Domain innerhalb von 24 Stunden.
                  </p>
                </div>
              </div>
            </div>

            {/* Domain Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Ihre Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="mein-restaurant.de oder café-müller.de"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ohne "https://" oder "www" - nur die reine Domain eingeben. Umlaute (ä, ö, ü, ß) sind erlaubt.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-green-600">
                    ✓ Domain-Anfrage erfolgreich gesendet! Sie werden benachrichtigt, sobald sie aktiviert wurde.
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading || !domain}>
                {loading ? "Wird gesendet..." : "Domain-Anfrage senden"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
