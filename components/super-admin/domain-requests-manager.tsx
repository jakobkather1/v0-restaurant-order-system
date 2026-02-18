"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, ExternalLink, Copy, Check, Settings, Globe } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DomainRequest {
  id: number
  restaurant_id: number
  requested_domain: string
  status: "pending" | "completed" | "rejected"
  notes: string | null
  created_at: string
  updated_at: string
  restaurant_name: string
  restaurant_slug: string
  restaurant_domain: string | null
}

export function DomainRequestsManager() {
  const [requests, setRequests] = useState<DomainRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<DomainRequest | null>(null)
  const [actionType, setActionType] = useState<"completed" | "rejected" | "edit" | null>(null)
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  // Edit form state
  const [editDomain, setEditDomain] = useState("")
  const [editStatus, setEditStatus] = useState<"pending" | "completed" | "rejected">("pending")

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const res = await fetch("/api/super-admin/domain-requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
      }
    } catch (err) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(request: DomainRequest, action: "completed" | "rejected" | "edit") {
    setSelectedRequest(request)
    setActionType(action)
    if (action === "edit") {
      setEditDomain(request.requested_domain)
      setEditStatus(request.status)
      setNotes(request.notes || "")
    } else {
      setNotes("")
    }
  }

  async function submitAction() {
    if (!selectedRequest || !actionType) return

    setProcessing(true)
    try {
      const res = await fetch("/api/super-admin/domain-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: actionType === "edit" ? editStatus : actionType,
          notes: notes || null,
          domain: actionType === "edit" ? editDomain : undefined,
        }),
      })

      if (res.ok) {
        await fetchRequests()
        setSelectedRequest(null)
        setActionType(null)
        setNotes("")
        setEditDomain("")
        setEditStatus("pending")
      }
    } catch (err) {
      console.error("Error updating request:", err)
    } finally {
      setProcessing(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
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

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const completedRequests = requests.filter((r) => r.status === "completed")
  const rejectedRequests = requests.filter((r) => r.status === "rejected")

  if (loading) {
    return <div>Laden...</div>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ausstehende Anfragen ({pendingRequests.length})</CardTitle>
              <CardDescription>
                Diese Domains müssen in Vercel hinzugefügt werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">So aktivieren Sie eine Domain:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Gehen Sie zu Vercel → Ihr Projekt → Settings → Domains</li>
                      <li>Klicken Sie auf "Add Domain"</li>
                      <li>Fügen Sie die Domain ein und bestätigen Sie</li>
                      <li>Markieren Sie die Anfrage hier als "Abgeschlossen"</li>
                    </ol>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => window.open("https://vercel.com/settings/domains", "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Zu Vercel Domains
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{request.requested_domain}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(request.requested_domain)}
                          >
                            {copied === request.requested_domain ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Restaurant: {request.restaurant_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Angefragt: {new Date(request.created_at).toLocaleString("de-DE")}
                        </p>
                        {!request.restaurant_domain && (
                          <p className="text-xs text-amber-600 font-semibold">
                            ⚠ Domain noch nicht im Restaurant eingetragen
                          </p>
                        )}
                        {request.restaurant_domain && (
                          <p className="text-xs text-green-600 font-semibold">
                            ✓ Domain eingetragen: {request.restaurant_domain}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/super-admin/restaurant/${request.restaurant_id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Restaurant-Einstellungen
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(request, "completed")}
                        disabled={!request.restaurant_domain}
                        title={!request.restaurant_domain ? "Bitte erst Custom Domain im Restaurant eintragen" : ""}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Als Erledigt markieren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(request, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequests.length === 0 && (
          <Alert>
            <AlertDescription>
              Keine ausstehenden Domain-Anfragen.
            </AlertDescription>
          </Alert>
        )}

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Abgeschlossene Anfragen ({completedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{request.requested_domain}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.restaurant_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Abgeschlossen: {new Date(request.updated_at).toLocaleString("de-DE")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(request, "edit")}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(request, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Abgelehnte Anfragen ({rejectedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rejectedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{request.requested_domain}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.restaurant_name}
                      </p>
                      {request.notes && (
                        <p className="text-xs text-red-600">Grund: {request.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Abgelehnt: {new Date(request.updated_at).toLocaleString("de-DE")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(request, "edit")}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(request, "completed")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Wieder öffnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null)
            setActionType(null)
            setNotes("")
            setEditDomain("")
            setEditStatus("pending")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "completed" && "Domain als erledigt markieren"}
              {actionType === "rejected" && "Domain-Anfrage ablehnen"}
              {actionType === "edit" && "Domain-Anfrage bearbeiten"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Domain: <span className="font-mono font-semibold">{selectedRequest.requested_domain}</span>
                  <br />
                  Restaurant: {selectedRequest.restaurant_name}
                  <br />
                  Status: {selectedRequest.status === "completed" ? "Abgeschlossen" : selectedRequest.status === "rejected" ? "Abgelehnt" : "Ausstehend"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === "edit" && (
            <div className="space-y-6">
              {/* Domain Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Domain</Label>
                <Input
                  id="edit-domain"
                  type="text"
                  placeholder="mein-restaurant.de"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Die angeforderte Domain. Ohne "https://" oder "www".
                </p>
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editStatus} onValueChange={(value: "pending" | "completed" | "rejected") => setEditStatus(value)}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Ausstehend</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Abgeschlossen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        <span>Abgelehnt</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ändern Sie den Status der Domain-Anfrage.
                </p>
              </div>

              {/* DNS Instructions Reminder */}
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">DNS-Einstellungen (zur Erinnerung):</p>
                    <div className="space-y-1 text-xs font-mono bg-muted/50 p-2 rounded">
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
                  </div>
                </AlertDescription>
              </Alert>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notizen / Ablehnungsgrund (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="z.B. Domain ist bereits vergeben, DNS-Einstellungen falsch, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Interne Notizen oder Begründung für eine Ablehnung.
                </p>
              </div>

              {/* Restaurant Info */}
              <Alert>
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="font-medium">Restaurant:</span>
                      <span>{selectedRequest?.restaurant_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Slug:</span>
                      <span className="font-mono">{selectedRequest?.restaurant_slug}</span>
                    </div>
                    {selectedRequest?.restaurant_domain && (
                      <div className="flex gap-2">
                        <span className="font-medium">Aktuell eingetragen:</span>
                        <span className="font-mono text-green-600">{selectedRequest.restaurant_domain}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="font-medium">Erstellt:</span>
                      <span>{selectedRequest && new Date(selectedRequest.created_at).toLocaleString("de-DE")}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {actionType === "rejected" && (
            <div className="space-y-2">
              <Label htmlFor="notes">Grund für Ablehnung (optional)</Label>
              <Textarea
                id="notes"
                placeholder="z.B. Domain ist bereits vergeben, DNS-Einstellungen falsch, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {actionType === "completed" && (
            <Alert>
              <AlertDescription>
                Stellen Sie sicher, dass Sie die Domain bereits in Vercel hinzugefügt haben, 
                bevor Sie diese Anfrage als erledigt markieren.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant={actionType === "rejected" ? "destructive" : "default"}
              onClick={submitAction}
              disabled={processing}
            >
              {processing ? "Wird gespeichert..." : actionType === "edit" ? "Speichern" : "Bestätigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
