"use client"

import React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Cookie,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Layers,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Shield,
  BarChart3,
  Target,
  Cog,
} from "lucide-react"
import {
  createCookieCategory,
  updateCookieCategory,
  deleteCookieCategory,
  createCookieDefinition,
  updateCookieDefinition,
  deleteCookieDefinition,
  updateCookieSettings,
  type CookieCategory,
  type CookieDefinition,
  type CookieSettings,
} from "./actions"

interface CookieManagementProps {
  initialCategories: CookieCategory[]
  initialCookies: CookieDefinition[]
  initialSettings: CookieSettings | null
}

const categoryIcons: Record<string, React.ReactNode> = {
  essential: <Shield className="h-4 w-4" />,
  functional: <Cog className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  marketing: <Target className="h-4 w-4" />,
}

export function CookieManagement({
  initialCategories,
  initialCookies,
  initialSettings,
}: CookieManagementProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [cookies, setCookies] = useState(initialCookies)
  const [settings, setSettings] = useState<CookieSettings>(initialSettings || {})
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean
    mode: "create" | "edit"
    data?: CookieCategory
  }>({ open: false, mode: "create" })

  const [cookieDialog, setCookieDialog] = useState<{
    open: boolean
    mode: "create" | "edit"
    data?: CookieDefinition
  }>({ open: false, mode: "create" })

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "category" | "cookie"
    id: number
    name: string
  } | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    display_name: "",
    description: "",
    is_required: false,
    sort_order: 0,
  })

  const [cookieForm, setCookieForm] = useState({
    category_id: "",
    name: "",
    provider: "",
    description: "",
    duration: "",
  })

  // Show message helper
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Category handlers
  const handleOpenCategoryDialog = (mode: "create" | "edit", data?: CookieCategory) => {
    if (mode === "edit" && data) {
      setCategoryForm({
        name: data.name,
        display_name: data.display_name,
        description: data.description || "",
        is_required: data.is_required,
        sort_order: data.sort_order,
      })
    } else {
      setCategoryForm({
        name: "",
        display_name: "",
        description: "",
        is_required: false,
        sort_order: categories.length + 1,
      })
    }
    setCategoryDialog({ open: true, mode, data })
  }

  const handleSaveCategory = () => {
    startTransition(async () => {
      if (categoryDialog.mode === "create") {
        const result = await createCookieCategory(categoryForm)
        if (result.success) {
          showMessage("success", "Kategorie erstellt")
          setCategoryDialog({ open: false, mode: "create" })
          window.location.reload()
        } else {
          showMessage("error", result.error || "Fehler")
        }
      } else if (categoryDialog.data) {
        const result = await updateCookieCategory(categoryDialog.data.id, categoryForm)
        if (result.success) {
          showMessage("success", "Kategorie aktualisiert")
          setCategoryDialog({ open: false, mode: "create" })
          window.location.reload()
        } else {
          showMessage("error", result.error || "Fehler")
        }
      }
    })
  }

  // Cookie handlers
  const handleOpenCookieDialog = (mode: "create" | "edit", data?: CookieDefinition) => {
    if (mode === "edit" && data) {
      setCookieForm({
        category_id: String(data.category_id),
        name: data.name,
        provider: data.provider || "",
        description: data.description || "",
        duration: data.duration || "",
      })
    } else {
      setCookieForm({
        category_id: categories[0]?.id ? String(categories[0].id) : "",
        name: "",
        provider: "",
        description: "",
        duration: "",
      })
    }
    setCookieDialog({ open: true, mode, data })
  }

  const handleSaveCookie = () => {
    startTransition(async () => {
      const formData = {
        ...cookieForm,
        category_id: Number(cookieForm.category_id),
      }
      
      if (cookieDialog.mode === "create") {
        const result = await createCookieDefinition(formData)
        if (result.success) {
          showMessage("success", "Cookie erstellt")
          setCookieDialog({ open: false, mode: "create" })
          window.location.reload()
        } else {
          showMessage("error", result.error || "Fehler")
        }
      } else if (cookieDialog.data) {
        const result = await updateCookieDefinition(cookieDialog.data.id, formData)
        if (result.success) {
          showMessage("success", "Cookie aktualisiert")
          setCookieDialog({ open: false, mode: "create" })
          window.location.reload()
        } else {
          showMessage("error", result.error || "Fehler")
        }
      }
    })
  }

  // Delete handlers
  const handleDelete = () => {
    if (!deleteDialog) return
    
    startTransition(async () => {
      const result = deleteDialog.type === "category"
        ? await deleteCookieCategory(deleteDialog.id)
        : await deleteCookieDefinition(deleteDialog.id)
      
      if (result.success) {
        showMessage("success", `${deleteDialog.type === "category" ? "Kategorie" : "Cookie"} gelöscht`)
        setDeleteDialog(null)
        window.location.reload()
      } else {
        showMessage("error", result.error || "Fehler")
      }
    })
  }

  // Settings handlers
  const handleSaveSettings = () => {
    startTransition(async () => {
      const result = await updateCookieSettings(settings)
      if (result.success) {
        showMessage("success", "Einstellungen gespeichert")
      } else {
        showMessage("error", result.error || "Fehler")
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Cookie className="h-6 w-6 text-amber-600" />
                Cookie-Manager
              </h1>
              <p className="text-gray-600">DSGVO-konforme Cookie-Verwaltung</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="categories">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Kategorien</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" className="gap-2">
              <Cookie className="h-4 w-4" />
              <span className="hidden sm:inline">Cookies</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Banner</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Vorschau</span>
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cookie-Kategorien</CardTitle>
                  <CardDescription>Kategorien für die Einwilligungsverwaltung</CardDescription>
                </div>
                <Button onClick={() => handleOpenCategoryDialog("create")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Kategorie
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Anzeigename</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Pflicht</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {categoryIcons[category.name] || <Cookie className="h-4 w-4" />}
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>{category.display_name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{category.description}</TableCell>
                        <TableCell>
                          {category.is_required ? (
                            <span className="text-green-600 font-medium">Ja</span>
                          ) : (
                            <span className="text-gray-500">Nein</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCategoryDialog("edit", category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: "category",
                                id: category.id,
                                name: category.display_name,
                              })}
                              disabled={category.is_required}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cookies Tab */}
          <TabsContent value="cookies" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cookie-Definitionen</CardTitle>
                  <CardDescription>Alle auf der Website verwendeten Cookies</CardDescription>
                </div>
                <Button onClick={() => handleOpenCookieDialog("create")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cookie
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Anbieter</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Aktiv</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cookies.map((cookie) => (
                      <TableRow key={cookie.id}>
                        <TableCell className="font-medium">{cookie.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                            {cookie.category_display_name || cookie.category_name}
                          </span>
                        </TableCell>
                        <TableCell>{cookie.provider || "-"}</TableCell>
                        <TableCell>{cookie.duration || "-"}</TableCell>
                        <TableCell>
                          {cookie.is_active ? (
                            <span className="text-green-600">Aktiv</span>
                          ) : (
                            <span className="text-gray-500">Inaktiv</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCookieDialog("edit", cookie)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: "cookie",
                                id: cookie.id,
                                name: cookie.name,
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner-Einstellungen</CardTitle>
                <CardDescription>Konfiguriere das Cookie-Consent-Banner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Banner aktiviert</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.banner_enabled === "true"}
                        onCheckedChange={(checked) => setSettings(s => ({...s, banner_enabled: checked ? "true" : "false"}))}
                      />
                      <span className="text-sm text-gray-600">
                        {settings.banner_enabled === "true" ? "Aktiviert" : "Deaktiviert"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={settings.banner_position || "bottom"}
                      onValueChange={(value) => setSettings(s => ({...s, banner_position: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom">Unten</SelectItem>
                        <SelectItem value="top">Oben</SelectItem>
                        <SelectItem value="center">Zentriert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner-Titel</Label>
                  <Input
                    value={settings.banner_title || ""}
                    onChange={(e) => setSettings(s => ({...s, banner_title: e.target.value}))}
                    placeholder="Cookie-Einstellungen"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banner-Beschreibung</Label>
                  <Textarea
                    value={settings.banner_description || ""}
                    onChange={(e) => setSettings(s => ({...s, banner_description: e.target.value}))}
                    placeholder="Wir verwenden Cookies..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Alle akzeptieren</Label>
                    <Input
                      value={settings.accept_all_text || ""}
                      onChange={(e) => setSettings(s => ({...s, accept_all_text: e.target.value}))}
                      placeholder="Alle akzeptieren"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nur notwendige</Label>
                    <Input
                      value={settings.reject_all_text || ""}
                      onChange={(e) => setSettings(s => ({...s, reject_all_text: e.target.value}))}
                      placeholder="Nur notwendige"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Einstellungen</Label>
                    <Input
                      value={settings.settings_text || ""}
                      onChange={(e) => setSettings(s => ({...s, settings_text: e.target.value}))}
                      placeholder="Einstellungen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Speichern</Label>
                    <Input
                      value={settings.save_text || ""}
                      onChange={(e) => setSettings(s => ({...s, save_text: e.target.value}))}
                      placeholder="Auswahl speichern"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Datenschutz-Link</Label>
                    <Input
                      value={settings.privacy_link || ""}
                      onChange={(e) => setSettings(s => ({...s, privacy_link: e.target.value}))}
                      placeholder="/datenschutz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Impressum-Link</Label>
                    <Input
                      value={settings.imprint_link || ""}
                      onChange={(e) => setSettings(s => ({...s, imprint_link: e.target.value}))}
                      placeholder="/impressum"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={isPending} className="w-full">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Einstellungen speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner-Vorschau</CardTitle>
                <CardDescription>So wird das Cookie-Banner angezeigt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white shadow-lg max-w-md mx-auto">
                  <h3 className="font-semibold text-lg mb-2">{settings.banner_title || "Cookie-Einstellungen"}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {settings.banner_description || "Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten."}
                  </p>
                  <div className="space-y-2 mb-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {categoryIcons[cat.name] || <Cookie className="h-4 w-4" />}
                          <span className="text-sm font-medium">{cat.display_name}</span>
                        </div>
                        <Switch checked={cat.is_required} disabled={cat.is_required} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      {settings.reject_all_text || "Nur notwendige"}
                    </Button>
                    <Button size="sm" className="flex-1">
                      {settings.accept_all_text || "Alle akzeptieren"}
                    </Button>
                  </div>
                  <div className="mt-3 text-center">
                    <button className="text-xs text-gray-500 underline">
                      {settings.settings_text || "Einstellungen"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {categoryDialog.mode === "create" ? "Kategorie erstellen" : "Kategorie bearbeiten"}
              </DialogTitle>
              <DialogDescription>
                Cookie-Kategorien gruppieren Cookies nach Zweck
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Technischer Name (slug)</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(f => ({...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}))}
                  placeholder="z.B. analytics"
                />
              </div>
              <div className="space-y-2">
                <Label>Anzeigename</Label>
                <Input
                  value={categoryForm.display_name}
                  onChange={(e) => setCategoryForm(f => ({...f, display_name: e.target.value}))}
                  placeholder="z.B. Statistik"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(f => ({...f, description: e.target.value}))}
                  placeholder="Beschreibung der Kategorie..."
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoryForm.is_required}
                  onCheckedChange={(checked) => setCategoryForm(f => ({...f, is_required: checked}))}
                />
                <Label>Pflicht-Kategorie (kann nicht abgewählt werden)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialog({ open: false, mode: "create" })}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveCategory} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cookie Dialog */}
        <Dialog open={cookieDialog.open} onOpenChange={(open) => setCookieDialog({ ...cookieDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {cookieDialog.mode === "create" ? "Cookie erstellen" : "Cookie bearbeiten"}
              </DialogTitle>
              <DialogDescription>
                Dokumentiere einen auf der Website verwendeten Cookie
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={cookieForm.category_id}
                  onValueChange={(value) => setCookieForm(f => ({...f, category_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cookie-Name</Label>
                <Input
                  value={cookieForm.name}
                  onChange={(e) => setCookieForm(f => ({...f, name: e.target.value}))}
                  placeholder="z.B. _ga"
                />
              </div>
              <div className="space-y-2">
                <Label>Anbieter</Label>
                <Input
                  value={cookieForm.provider}
                  onChange={(e) => setCookieForm(f => ({...f, provider: e.target.value}))}
                  placeholder="z.B. Google Analytics"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung/Zweck</Label>
                <Textarea
                  value={cookieForm.description}
                  onChange={(e) => setCookieForm(f => ({...f, description: e.target.value}))}
                  placeholder="Wofür wird der Cookie verwendet?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Dauer/Ablauf</Label>
                <Input
                  value={cookieForm.duration}
                  onChange={(e) => setCookieForm(f => ({...f, duration: e.target.value}))}
                  placeholder="z.B. 2 Jahre, Session"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCookieDialog({ open: false, mode: "create" })}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveCookie} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Löschen bestätigen</DialogTitle>
              <DialogDescription>
                Bist du sicher, dass du {deleteDialog?.type === "category" ? "die Kategorie" : "den Cookie"} &quot;{deleteDialog?.name}&quot; löschen möchtest?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
