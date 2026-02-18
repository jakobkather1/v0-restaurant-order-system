"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  logoutSuperAdmin,
  createSuperAdminUser,
  updateSuperAdminUser,
  deleteSuperAdminUser,
} from "@/app/super-admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Building2,
  DollarSign,
  Percent,
  Plus,
  LogOut,
  ExternalLink,
  Settings,
  Scale,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Palette,
  Cookie,
  Search,
  Globe,
} from "lucide-react"
import Link from "next/link"
import type { Restaurant } from "@/lib/types"
import { CreateRestaurantDialog } from "./create-restaurant-dialog"
import { Badge } from "@/components/ui/badge"
import { PlatformLegalTab } from "./platform-legal-tab"
import { PlatformSettingsTab } from "./platform-settings-tab"
import { PlatformSeoTab } from "./platform-seo-tab"
import { PlatformAgbAvvTab } from "./platform-agb-avv-tab"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface SuperAdminUser {
  id: number
  username: string
  display_name: string | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

interface DashboardProps {
  restaurants: Restaurant[]
  stats: {
    activeRestaurants: number
    totalRevenue: number
    totalFees: number
    pendingDomainRequests: number
  }
  platformSettings: Record<string, string>
  superAdminUsers?: SuperAdminUser[]
  currentUser?: { userId: number; username: string }
}

export function SuperAdminDashboard({
  restaurants,
  stats,
  platformSettings,
  superAdminUsers = [],
  currentUser,
}: DashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<SuperAdminUser | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutSuperAdmin()
    } catch {
      router.push("/super-admin")
    }
  }

  async function handleCreateUser(formData: FormData) {
    setIsSubmitting(true)
    const result = await createSuperAdminUser(formData)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Benutzer erstellt")
      setShowCreateUserDialog(false)
      router.refresh()
    }
  }

  async function handleUpdateUser(formData: FormData) {
    setIsSubmitting(true)
    const result = await updateSuperAdminUser(formData)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Benutzer aktualisiert")
      setEditingUser(null)
      router.refresh()
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm("Möchten Sie diesen Benutzer wirklich löschen?")) return

    const formData = new FormData()
    formData.set("id", userId.toString())

    const result = await deleteSuperAdminUser(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Benutzer gelöscht")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold">Super Admin</span>
            {currentUser && (
              <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
                {currentUser.username}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut} className="h-9 px-2 sm:px-3">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isLoggingOut ? "..." : "Abmelden"}</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <Tabs defaultValue="restaurants" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger
              value="restaurants"
              className="flex-1 sm:flex-none flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Restaurants</span>
              <span className="xs:hidden">Rest.</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 sm:flex-none flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Benutzer</span>
              <span className="xs:hidden">User</span>
            </TabsTrigger>
            <TabsTrigger
              value="domains"
              className="flex-1 sm:flex-none flex items-center gap-1 sm:gap-2 text-xs sm:text-sm relative"
            >
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Domains</span>
              <span className="xs:hidden">Dom.</span>
              {stats.pendingDomainRequests > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {stats.pendingDomainRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 sm:flex-none flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Einstellungen</span>
              <span className="xs:hidden">Einst.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Aktive Restaurants</CardTitle>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.activeRestaurants}</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Gesamtumsatz</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalRevenue.toLocaleString("de-DE")} €</div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Eingenommene Gebühren</CardTitle>
                  <Percent className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.totalFees.toLocaleString("de-DE")} €</div>
                </CardContent>
              </Card>
            </div>

            {/* Restaurants List */}
            <Card className="bg-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Restaurants</CardTitle>
                  <CardDescription className="text-sm">Verwalte alle Restaurants im System</CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Restaurant
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {restaurants.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    Noch keine Restaurants vorhanden. Erstelle dein erstes Restaurant!
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {restaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-3 sm:gap-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white shrink-0"
                            style={{ backgroundColor: restaurant.primary_color }}
                          >
                            {restaurant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{restaurant.name}</span>
                              <Badge variant={restaurant.is_active ? "default" : "secondary"} className="text-xs">
                                {restaurant.is_active ? "Aktiv" : "Inaktiv"}
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">
                              /{restaurant.slug}
                              {restaurant.domain && ` • ${restaurant.domain}`}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              Gebühr:{" "}
                              {restaurant.fee_type === "percentage"
                                ? `${restaurant.fee_value}%`
                                : `${restaurant.fee_value} €/Monat`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 bg-transparent"
                          >
                            <Link href={`/${restaurant.slug}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span className="hidden xs:inline">Terminal</span>
                              <span className="xs:hidden">Öffnen</span>
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 bg-transparent"
                          >
                            <Link href={`/super-admin/restaurant/${restaurant.id}`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Verwalten
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="bg-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Super Admin Benutzer</CardTitle>
                  <CardDescription className="text-sm">
                    Verwalte Benutzer mit Zugriff auf das Super Admin Panel
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateUserDialog(true)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Neuer Benutzer
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {superAdminUsers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">Noch keine Benutzer vorhanden.</div>
                ) : (
                  <div className="space-y-3">
                    {superAdminUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.display_name || user.username}</span>
                              <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                                {user.is_active ? "Aktiv" : "Inaktiv"}
                              </Badge>
                              {currentUser?.userId === user.id && (
                                <Badge variant="outline" className="text-xs">
                                  Du
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            {user.last_login_at && (
                              <div className="text-xs text-gray-400">
                                Letzter Login: {new Date(user.last_login_at).toLocaleDateString("de-DE")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="min-h-[44px] sm:min-h-0"
                          >
                            <Edit className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Bearbeiten</span>
                          </Button>
                          {currentUser?.userId !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="min-h-[44px] sm:min-h-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Löschen</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domain-Anfragen
                </CardTitle>
                <CardDescription>
                  Verwalten Sie Custom Domain-Anfragen von Restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/super-admin/domains">
                  <Button className="w-full sm:w-auto">
                    <Globe className="h-4 w-4 mr-2" />
                    Domain-Verwaltung öffnen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Allgemein
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="legal" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Rechtliches
                </TabsTrigger>
                <TabsTrigger value="cookies" className="flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  Cookies
                </TabsTrigger>
                <TabsTrigger value="agb-avv" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  AGBs/AVV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <PlatformSettingsTab settings={platformSettings} />
              </TabsContent>

              <TabsContent value="seo">
                <PlatformSeoTab settings={platformSettings} />
              </TabsContent>

              <TabsContent value="legal">
                <PlatformLegalTab settings={platformSettings} />
              </TabsContent>

              <TabsContent value="agb-avv">
                <PlatformAgbAvvTab settings={platformSettings} />
              </TabsContent>

              <TabsContent value="cookies">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cookie className="h-5 w-5 text-amber-600" />
                      Cookie-Manager
                    </CardTitle>
                    <CardDescription>
                      Verwalte Cookie-Kategorien, Definitionen und Banner-Einstellungen für die DSGVO-konforme Einwilligung
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Der Cookie-Manager ermöglicht es dir, alle auf der Website verwendeten Cookies zu dokumentieren
                        und den Cookie-Consent-Banner für Besucher zu konfigurieren.
                      </p>
                      <div className="flex gap-4">
                        <Link href="/super-admin/cookies">
                          <Button className="gap-2">
                            <Settings className="h-4 w-4" />
                            Cookie-Manager öffnen
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
</Tabs>
      </main>

      <CreateRestaurantDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Super Admin Benutzer</DialogDescription>
          </DialogHeader>
          <form action={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Benutzername</Label>
              <Input id="new-username" name="username" placeholder="benutzername" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-displayName">Anzeigename</Label>
              <Input id="new-displayName" name="displayName" placeholder="Max Mustermann" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Passwort</Label>
              <Input id="new-password" name="password" type="password" placeholder="••••••••" required minLength={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Erstellen..." : "Erstellen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Benutzerinformationen</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form action={handleUpdateUser} className="space-y-4">
              <input type="hidden" name="id" value={editingUser.id} />
              <div className="space-y-2">
                <Label>Benutzername</Label>
                <Input value={editingUser.username} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Anzeigename</Label>
                <Input
                  id="edit-displayName"
                  name="displayName"
                  defaultValue={editingUser.display_name || ""}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Neues Passwort (optional)</Label>
                <Input
                  id="edit-password"
                  name="newPassword"
                  type="password"
                  placeholder="Leer lassen um nicht zu ändern"
                  minLength={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">Aktiv</Label>
                <Switch id="edit-isActive" name="isActive" defaultChecked={editingUser.is_active} value="true" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
