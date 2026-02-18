"use client"

import { useState } from "react"
import { updateBillingStatus, addBillingNote } from "@/app/super-admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Check, Clock } from "lucide-react"
import type { Restaurant, RestaurantBilling } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BillingTabProps {
  restaurant: Restaurant
  billings: RestaurantBilling[]
}

export function BillingTab({ restaurant, billings }: BillingTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(billings[0]?.id.toString() || "")
  const [confirmationWord, setConfirmationWord] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const selectedBilling = billings.find((b) => b.id.toString() === selectedMonth)

  async function handleStatusChange(newStatus: "open" | "paid") {
    if (!selectedBilling) return

    if (newStatus === "paid" && !confirmationWord) {
      setError("Bitte geben Sie 'bezahlt' ein")
      return
    }

    setLoading(true)
    setError(null)
    const result = await updateBillingStatus(selectedBilling.id, newStatus, confirmationWord)
    if (result?.error) {
      setError(result.error)
    } else {
      setConfirmationWord("")
    }
    setLoading(false)
  }

  async function handleAddNote() {
    if (!selectedBilling || !notes) return
    setLoading(true)
    setError(null)
    const result = await addBillingNote(selectedBilling.id, notes)
    if (result?.error) {
      setError(result.error)
    } else {
      setNotes("")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Abrechnungsübersicht</CardTitle>
          <CardDescription>{restaurant.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month-select">Monat auswählen</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Wählen Sie einen Monat" />
              </SelectTrigger>
              <SelectContent>
                {billings.map((billing) => (
                  <SelectItem key={billing.id} value={billing.id.toString()}>
                    {new Date(billing.billing_month).toLocaleDateString("de-DE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedBilling && (
        <>
          {/* Billing Details */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtumsatz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedBilling.total_revenue.toLocaleString("de-DE")} €</div>
                <p className="text-xs text-muted-foreground mt-1">{selectedBilling.total_orders} Bestellungen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gebührenart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedBilling.fee_type === "percentage"
                    ? `${selectedBilling.fee_value}%`
                    : `${selectedBilling.fee_value} €/Mo`}
                </div>
                <Badge variant="outline" className="mt-2">
                  {selectedBilling.fee_type === "percentage" ? "Prozentual" : "Fixbetrag"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gebühren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedBilling.fee_amount.toLocaleString("de-DE")} €</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={selectedBilling.payment_status === "paid" ? "default" : "secondary"} className="mt-1">
                  {selectedBilling.payment_status === "paid" ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Bezahlt
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 h-3 w-3" />
                      Offen
                    </>
                  )}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Management */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Zahlungsstatus
              </CardTitle>
              <CardDescription>Sicherheitsprüfung erforderlich zur Änderung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-100 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {selectedBilling.payment_status === "open" && (
                <div className="space-y-4 rounded-lg border border-yellow-300 bg-white p-4">
                  <p className="text-sm text-gray-600">
                    Um die Zahlung zu bestätigen, geben Sie bitte das Wort <strong>"bezahlt"</strong> ein:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder='Geben Sie "bezahlt" ein'
                      value={confirmationWord}
                      onChange={(e) => setConfirmationWord(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      onClick={() => handleStatusChange("paid")}
                      disabled={loading || confirmationWord.toLowerCase() !== "bezahlt"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Bestätigen
                    </Button>
                  </div>
                </div>
              )}

              {selectedBilling.payment_status === "paid" && selectedBilling.payment_date && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    ✓ Zahlung bestätigt am{" "}
                    {new Date(selectedBilling.payment_date).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Button
                    onClick={() => handleStatusChange("open")}
                    disabled={loading}
                    variant="ghost"
                    className="mt-2 text-sm"
                  >
                    Zurück auf "Offen" setzen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notizen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Interne Notizen hinzufügen</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="z.B. Zahlung erhalten, Verzögerung, etc."
                  className="min-h-[100px] w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <Button onClick={handleAddNote} disabled={loading || !notes}>
                Notiz speichern
              </Button>
              {selectedBilling.notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-700">Letzte Notiz:</p>
                  <p className="mt-1 text-gray-600">{selectedBilling.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* All Billings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abrechnung aller Monate</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead className="text-right">Bestellungen</TableHead>
                <TableHead className="text-right">Umsatz</TableHead>
                <TableHead className="text-right">Gebühren</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billings.map((billing) => (
                <TableRow
                  key={billing.id}
                  className={billing.payment_status === "open" ? "bg-yellow-50" : ""}
                  onClick={() => setSelectedMonth(billing.id.toString())}
                >
                  <TableCell>
                    {new Date(billing.billing_month).toLocaleDateString("de-DE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">{billing.total_orders}</TableCell>
                  <TableCell className="text-right">{billing.total_revenue.toLocaleString("de-DE")} €</TableCell>
                  <TableCell className="text-right font-medium">
                    {billing.fee_amount.toLocaleString("de-DE")} €
                  </TableCell>
                  <TableCell>
                    <Badge variant={billing.payment_status === "paid" ? "default" : "secondary"}>
                      {billing.payment_status === "paid" ? "Bezahlt" : "Offen"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
