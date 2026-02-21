"use client"

import { useState } from "react"
import {
  updateRestaurant,
  updateRestaurantPassword,
  deleteRestaurant,
  updateRestaurantPermissions,
  resetRestaurantRevenue,
} from "@/app/super-admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, AlertCircle, Trash2, ExternalLink, Key, Eye, EyeOff, Shield, Lock, Bot } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Restaurant, MonthlyRevenue, RestaurantBilling } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BillingTab } from "./billing-tab"
import { RestaurantUsernameSettings } from "./restaurant-username-settings"

interface RestaurantDetailProps {
  restaurant: Restaurant
  revenue: MonthlyRevenue[]
  billings?: RestaurantBilling[]
}

export function RestaurantDetail({ restaurant, revenue, billings = [] }: RestaurantDetailProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [feeType, setFeeType] = useState(restaurant.fee_type)
  const [isActive, setIsActive] = useState(restaurant.is_active)
  const [newPassword, setNewPassword] = useState("")
  const [superAdminRestaurantPassword, setSuperAdminRestaurantPassword] = useState("")
  const [showRevenuePassword, setShowRevenuePassword] = useState(false)

  const [permissions, setPermissions] = useState({
    can_edit_menu: restaurant.can_edit_menu ?? true,
    can_edit_settings: restaurant.can_edit_settings ?? true,
    can_view_analytics: restaurant.can_view_analytics ?? true,
    can_manage_orders: restaurant.can_manage_orders ?? true,
    ai_assistant_enabled: restaurant.ai_assistant_enabled ?? false,
  })
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [permissionSuccess, setPermissionSuccess] = useState<string | null>(null)

  async function handleUpdateRestaurant(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    formData.set("id", restaurant.id.toString())
    formData.set("feeType", feeType)
    formData.set("isActive", isActive.toString())
    if (superAdminRestaurantPassword) {
      formData.set("superAdminRestaurantPassword", superAdminRestaurantPassword)
    }
    const result = await updateRestaurant(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Restaurant aktualisiert")
      setSuperAdminRestaurantPassword("")
    }
    setLoading(false)
  }

  async function handleUpdatePassword() {
    if (!newPassword || newPassword.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein")
      return
    }
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.set("id", restaurant.id.toString())
    formData.set("password", newPassword)
    const result = await updateRestaurantPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Passwort aktualisiert")
      setNewPassword("")
    }
    setLoading(false)
  }

  async function handleDelete() {
    const formData = new FormData()
    formData.set("id", restaurant.id.toString())
    await deleteRestaurant(formData)
    router.push("/super-admin")
  }

  async function handleResetRevenue() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const result = await resetRestaurantRevenue(restaurant.id)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Umsatzdaten erfolgreich zurückgesetzt")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleUpdatePermissions() {
    setPermissionLoading(true)
    setPermissionSuccess(null)
    setError(null)
    const formData = new FormData()
    formData.set("id", restaurant.id.toString())
    formData.set("can_edit_menu", permissions.can_edit_menu.toString())
    formData.set("can_edit_settings", permissions.can_edit_settings.toString())
    formData.set("can_view_analytics", permissions.can_view_analytics.toString())
    formData.set("can_manage_orders", permissions.can_manage_orders.toString())
    formData.set("ai_assistant_enabled", permissions.ai_assistant_enabled.toString())
    const result = await updateRestaurantPermissions(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setPermissionSuccess("Berechtigungen aktualisiert")
    }
    setPermissionLoading(false)
  }

  const canViewRevenue = restaurant.allow_super_admin_revenue_view

  const chartData = revenue
    .map((r) => ({
      month: new Date(r.month).toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      revenue: Number(r.total_revenue),
      fees: Number(r.fee_amount),
    }))
    .reverse()

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super-admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground">Restaurant verwalten</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="security">Sicherheit</TabsTrigger>
            <TabsTrigger value="billing">Abrechnung & Gebühren</TabsTrigger>
            <TabsTrigger value="analytics">Umsatz & Gebühren</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Einstellungen</CardTitle>
                <CardDescription>Grundeinstellungen des Restaurants</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleUpdateRestaurant} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" defaultValue={restaurant.name} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL-Slug</Label>
                    <Input id="slug" name="slug" defaultValue={restaurant.slug} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Custom Domain</Label>
                    <Input 
                      id="domain" 
                      name="domain" 
                      defaultValue={restaurant.domain || ""} 
                      placeholder="restaurant.de"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Eigene Domain für besseres SEO (nur Hostname ohne https://)
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Gebührenart</Label>
                      <Select value={feeType} onValueChange={(v) => setFeeType(v as "percentage" | "fixed")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Prozentual</SelectItem>
                          <SelectItem value="fixed">Fixbetrag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feeValue">{feeType === "percentage" ? "Prozent (%)" : "Betrag (€)"}</Label>
                      <Input
                        id="feeValue"
                        name="feeValue"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={restaurant.fee_value}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Restaurant aktiv</Label>
                      <p className="text-sm text-muted-foreground">Deaktivierte Restaurants sind nicht erreichbar</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      <Label htmlFor="superAdminRestaurantPassword">Umsatz-Freigabe Passwort</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dieses Passwort muss das Restaurant eingeben, um die Umsatz-Einsicht für den Super-Admin zu
                      aktivieren/deaktivieren.
                    </p>
                    <div className="relative">
                      <Input
                        id="superAdminRestaurantPassword"
                        type={showRevenuePassword ? "text" : "password"}
                        value={superAdminRestaurantPassword}
                        onChange={(e) => setSuperAdminRestaurantPassword(e.target.value)}
                        placeholder={restaurant.super_admin_restaurant_password ? "••••••••" : "Neues Passwort setzen"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowRevenuePassword(!showRevenuePassword)}
                      >
                        {showRevenuePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {restaurant.super_admin_restaurant_password && (
                      <p className="text-xs text-green-600">Passwort ist gesetzt</p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Speichere..." : "Änderungen speichern"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password & Actions */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Admin-Passwort
                  </CardTitle>
                  <CardDescription>Setze das Passwort für das Restaurant-Admin-Panel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button onClick={handleUpdatePassword} disabled={loading || !newPassword}>
                    Passwort setzen
                  </Button>
                </CardContent>
              </Card>

              <RestaurantUsernameSettings 
                restaurantId={restaurant.id} 
                currentUsername={restaurant.admin_username || ""} 
              />

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <Link href={`/${restaurant.slug}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Kunden-Terminal öffnen
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <Link href={`/${restaurant.slug}/admin`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Admin-Panel öffnen
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Umsatzdaten zurücksetzen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Umsatzdaten zurücksetzen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dies löscht alle Bestellungen und Abrechnungen für dieses Restaurant unwiderruflich.
                          Menü, Einstellungen und andere Daten bleiben erhalten.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetRevenue}
                          className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Umsatzdaten zurücksetzen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full justify-start">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Restaurant löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restaurant löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dies löscht das Restaurant und alle zugehörigen Daten (Bestellungen, Menüs, etc.)
                          unwiderruflich.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Endgültig löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Restaurant-Berechtigungen
                </CardTitle>
                <CardDescription>Verwalte, welche Funktionen das Restaurant-Admin nutzen kann</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                {permissionSuccess && (
                  <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                    {permissionSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold">KI Bestell-Berater</Label>
                        <p className="text-sm text-muted-foreground">
                          Aktiviert den KI-Assistenten im Bestellterminal des Restaurants
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={permissions.ai_assistant_enabled}
                      onCheckedChange={(v) => setPermissions({ ...permissions, ai_assistant_enabled: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Menü bearbeiten</Label>
                      <p className="text-sm text-muted-foreground">Restaurant kann Kategorien und Gerichte verwalten</p>
                    </div>
                    <Switch
                      checked={permissions.can_edit_menu}
                      onCheckedChange={(v) => setPermissions({ ...permissions, can_edit_menu: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Einstellungen bearbeiten</Label>
                      <p className="text-sm text-muted-foreground">
                        Restaurant kann Design, SEO und andere Einstellungen ändern
                      </p>
                    </div>
                    <Switch
                      checked={permissions.can_edit_settings}
                      onCheckedChange={(v) => setPermissions({ ...permissions, can_edit_settings: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Analytics anzeigen</Label>
                      <p className="text-sm text-muted-foreground">
                        Restaurant kann Umsatzstatistiken und Analysen sehen
                      </p>
                    </div>
                    <Switch
                      checked={permissions.can_view_analytics}
                      onCheckedChange={(v) => setPermissions({ ...permissions, can_view_analytics: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Bestellungen verwalten</Label>
                      <p className="text-sm text-muted-foreground">
                        Restaurant kann Bestellungen bearbeiten und abschließen
                      </p>
                    </div>
                    <Switch
                      checked={permissions.can_manage_orders}
                      onCheckedChange={(v) => setPermissions({ ...permissions, can_manage_orders: v })}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdatePermissions} disabled={permissionLoading}>
                  {permissionLoading ? "Speichere..." : "Berechtigungen speichern"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            {billings && billings.length > 0 ? (
              <BillingTab restaurant={restaurant} billings={billings} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Noch keine Abrechnungsdaten vorhanden
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {/* Revenue Analytics - Only show if restaurant allows */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Umsatz & Gebühren (letzte 12 Monate)</span>
                  {!canViewRevenue && (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Vom Restaurant gesperrt
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!canViewRevenue ? (
                  <div className="py-12 text-center">
                    <EyeOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-medium">Umsatzeinsicht nicht freigegeben</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Das Restaurant hat die Umsatz-Einsicht für den Super-Admin nicht aktiviert.
                    </p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">Noch keine Umsatzdaten vorhanden</div>
                ) : (
                  <>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              `${value.toLocaleString("de-DE")} €`,
                              name === "revenue" ? "Umsatz" : "Gebühren",
                            ]}
                          />
                          <Legend formatter={(value) => (value === "revenue" ? "Umsatz" : "Gebühren")} />
                          <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="fees" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Monat</TableHead>
                          <TableHead className="text-right">Bestellungen</TableHead>
                          <TableHead className="text-right">Umsatz</TableHead>
                          <TableHead className="text-right">Gebühren</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenue.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              {new Date(r.month).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                            </TableCell>
                            <TableCell className="text-right">{r.total_orders}</TableCell>
                            <TableCell className="text-right">
                              {Number(r.total_revenue).toLocaleString("de-DE")} €
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(r.fee_amount).toLocaleString("de-DE")} €
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
