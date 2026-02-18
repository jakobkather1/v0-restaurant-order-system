"use client"

import React from "react"

import { useState } from "react"
import {
  updateRestaurantSettings,
  updateOpeningHours,
  updateSeoSettings,
  updateLegalSettings,
  updateRestaurantTheme,
  updateSeoFooterSettings,
} from "@/app/[slug]/admin/actions"
import { uploadRestaurantImage } from "@/app/[slug]/admin/upload-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  CheckCircle,
  Palette,
  ImageIcon,
  Settings,
  Clock,
  Mail,
  FileText,
  Search,
  PaintBucket,
  Type,
  Loader2,
} from "lucide-react"
import type { Restaurant, Category, DeliveryZone } from "@/lib/types"
import { SeoTab } from "@/components/admin/tabs/seo-tab"
import { SeoFooterTab } from "@/components/admin/tabs/seo-footer-tab"
import { DomainSetupSection } from "@/components/admin/domain-setup-section"
import { QRCodeTab } from "@/components/admin/tabs/qr-code-tab"

interface WebsiteSettingsSectionProps {
  restaurant: Restaurant
  activeTab: "general" | "design" | "legal" | "seo" | "domain" | "qr-code"
  categories?: Category[]
  deliveryZones?: DeliveryZone[]
}

const DAYS = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
] as const

const COLOR_PRESETS = [
  { name: "Hell (Standard)", bg: "#ffffff", text: "#1f2937" },
  { name: "Dunkel", bg: "#1f2937", text: "#f9fafb" },
  { name: "Warm", bg: "#fffbeb", text: "#78350f" },
  { name: "Kühl", bg: "#f0f9ff", text: "#0c4a6e" },
  { name: "Elegant", bg: "#18181b", text: "#fafafa" },
  { name: "Natur", bg: "#f0fdf4", text: "#14532d" },
]

export function WebsiteSettingsSection({ restaurant, activeTab, categories = [], deliveryZones = [] }: WebsiteSettingsSectionProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(restaurant.opening_hours || {})
  const [primaryColor, setPrimaryColor] = useState(restaurant.primary_color || "#0369a1")
  const [backgroundColor, setBackgroundColor] = useState(restaurant.background_color || "#ffffff")
  const [textColor, setTextColor] = useState(restaurant.text_color || "#1f2937")
  const [colorLoading, setColorLoading] = useState(false)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // General Settings Handler
  async function handleGeneralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("primaryColor", restaurant.primary_color)
    formData.set("address", restaurant.address || "")
    formData.set("email", restaurant.email || "")
    formData.set("phone", restaurant.phone || "")
    formData.set("ownerName", restaurant.owner_name || "")
    formData.set("impressum", restaurant.impressum || "")
    const result = await updateRestaurantSettings(formData)
    showMessage(result?.error ? "error" : "success", result?.error || "Einstellungen gespeichert")
    setLoading(false)
  }

  // Design Handlers
  async function handleAllColorsSubmit() {
    setColorLoading(true)
    try {
      // Update primary color via settings
      const settingsFormData = new FormData()
      settingsFormData.set("name", restaurant.name)
      settingsFormData.set("slogan", restaurant.slogan || "")
      settingsFormData.set("bannerText", restaurant.banner_text || "")
      settingsFormData.set("address", restaurant.address || "")
      settingsFormData.set("email", restaurant.email || "")
      settingsFormData.set("phone", restaurant.phone || "")
      settingsFormData.set("ownerName", restaurant.owner_name || "")
      settingsFormData.set("impressum", restaurant.impressum || "")
      settingsFormData.set("checkoutInfoText", restaurant.checkout_info_text || "")
      await updateRestaurantSettings(settingsFormData)

      // Update theme colors - ALL THREE colors go to updateRestaurantTheme
      const themeFormData = new FormData()
      themeFormData.set("primaryColor", primaryColor)
      themeFormData.set("backgroundColor", backgroundColor)
      themeFormData.set("textColor", textColor)
      
      await updateRestaurantTheme(themeFormData)

      showMessage("success", "Alle Farben gespeichert")
    } catch (error) {
      showMessage("error", "Fehler beim Speichern der Farben")
    }
    setColorLoading(false)
  }

  function applyPreset(preset: (typeof COLOR_PRESETS)[0]) {
    setBackgroundColor(preset.bg)
    setTextColor(preset.text)
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedLogoFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleHeroSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedHeroFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeroPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveImages() {
    console.log("[v0] Setting imageUploading to true")
    setImageUploading(true)

    // Upload logo if selected
    if (selectedLogoFile) {
      console.log("[v0] Uploading logo file:", selectedLogoFile.name)
      const logoFormData = new FormData()
      logoFormData.set("file", selectedLogoFile)
      logoFormData.set("imageType", "logo")
      
      console.log("[v0] Calling uploadRestaurantImage for logo...")
      const logoResult = await uploadRestaurantImage(logoFormData)
      console.log("[v0] Logo upload result:", logoResult)
      
      if (logoResult.error) {
        console.log("[v0] Logo upload error:", logoResult.error)
        showMessage("error", logoResult.error)
        setImageUploading(false)
        return
      }
    }

    // Upload hero if selected
    if (selectedHeroFile) {
      console.log("[v0] Uploading hero file:", selectedHeroFile.name)
      const heroFormData = new FormData()
      heroFormData.set("file", selectedHeroFile)
      heroFormData.set("imageType", "hero")
      
      console.log("[v0] Calling uploadRestaurantImage for hero...")
      const heroResult = await uploadRestaurantImage(heroFormData)
      console.log("[v0] Hero upload result:", heroResult)
      
      if (heroResult.error) {
        console.log("[v0] Hero upload error:", heroResult.error)
        showMessage("error", heroResult.error)
        setImageUploading(false)
        return
      }
    }

    console.log("[v0] ✅ All uploads completed successfully")
    showMessage("success", "Bilder erfolgreich gespeichert")
    
    // Reload page to show new images
    setTimeout(() => {
      console.log("[v0] Reloading page...")
      window.location.reload()
    }, 1000)
  }

  // Hours Handler
  async function handleHoursSubmit() {
    setLoading(true)
    try {
      const result = await updateOpeningHours(hours)
      showMessage(result?.error ? "error" : "success", result?.error || "Öffnungszeiten gespeichert")
    } catch (error) {
      console.error("Error in handleHoursSubmit:", error)
      showMessage("error", "Fehler beim Speichern der Öffnungszeiten")
    }
    setLoading(false)
  }

  // Contact Handler
  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("name", restaurant.name)
    formData.set("slogan", restaurant.slogan || "")
    formData.set("bannerText", restaurant.banner_text || "")
    formData.set("ownerName", restaurant.owner_name || "")
    formData.set("impressum", restaurant.impressum || "")
    formData.set("primaryColor", restaurant.primary_color)
    formData.set("checkoutInfoText", restaurant.checkout_info_text || "")
    const result = await updateRestaurantSettings(formData)
    showMessage(result?.error ? "error" : "success", result?.error || "Kontaktdaten gespeichert")
    setLoading(false)
  }

  // Legal Handler
  async function handleLegalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateLegalSettings(formData)
    showMessage(result?.error ? "error" : "success", result?.error || "Rechtliche Angaben gespeichert")
    setLoading(false)
  }

  // SEO Handler
  async function handleSeoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateSeoSettings(formData)
    showMessage(result?.error ? "error" : "success", result?.error || "SEO-Einstellungen gespeichert")
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Website Einstellungen</h2>
        <p className="text-gray-600">Verwalte das Erscheinungsbild und die Inhalte deines Terminals</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Allgemeine Informationen</CardTitle>
              </div>
              <CardDescription>Name, Slogan und Werbebanner</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input id="name" name="name" defaultValue={restaurant.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input
                    id="slogan"
                    name="slogan"
                    defaultValue={restaurant.slogan || ""}
                    placeholder="Willkommen bei uns!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerText">Werbebanner</Label>
                  <Input
                    id="bannerText"
                    name="bannerText"
                    defaultValue={restaurant.banner_text || ""}
                    placeholder="z.B. 10% Rabatt bei Abholung!"
                  />
                  <p className="text-xs text-gray-500">Erscheint als Laufband oben im Terminal</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkoutInfoText">Kassen-Hinweistext</Label>
                  <Textarea
                    id="checkoutInfoText"
                    name="checkoutInfoText"
                    defaultValue={restaurant.checkout_info_text || ""}
                    placeholder="z.B. Bitte klingeln Sie bei Ankunft..."
                    rows={2}
                  />
                  <p className="text-xs text-gray-500">Wird im Bestellprozess bei der Adresseingabe angezeigt</p>
                </div>
                <Button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                  Speichern
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information - Merged into General */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Kontaktdaten</CardTitle>
              </div>
              <CardDescription>Adresse und Erreichbarkeit</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={restaurant.address || ""}
                    placeholder="Musterstr. 1, 12345 Stadt"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" name="phone" defaultValue={restaurant.phone || ""} placeholder="+49 123 456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={restaurant.email || ""}
                      placeholder="info@restaurant.de"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                  Speichern
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === "design" && (
        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Farbkonfiguration</CardTitle>
              </div>
              <CardDescription>Verwalte alle Farben deines Terminals an einem Ort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Alle drei Farben in einer Reihe */}
                <div className="grid gap-6 sm:grid-cols-3">
                  {/* Primärfarbe */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium">
                      <Palette className="h-4 w-4 text-sky-600" />
                      Primärfarbe
                    </Label>
                    <p className="text-xs text-gray-500">Für Buttons und Akzente</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-12 w-12 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#0369a1"
                      />
                    </div>
                    {/* Primärfarbe Schnellauswahl */}
                    <div className="flex gap-1 flex-wrap">
                      {["#0369a1", "#059669", "#dc2626", "#ea580c", "#7c3aed", "#db2777"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-6 w-6 rounded-full border-2 transition-all ${
                            primaryColor === color
                              ? "border-gray-800 scale-110"
                              : "border-transparent hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setPrimaryColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Hintergrundfarbe */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium">
                      <PaintBucket className="h-4 w-4 text-sky-600" />
                      Hintergrundfarbe
                    </Label>
                    <p className="text-xs text-gray-500">Für den Terminal-Hintergrund</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-12 w-12 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Schriftfarbe */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium">
                      <Type className="h-4 w-4 text-sky-600" />
                      Schriftfarbe
                    </Label>
                    <p className="text-xs text-gray-500">Für alle Texte</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-12 w-12 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                </div>

                {/* Farbschemata Schnellauswahl */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="font-medium">Farbschemata</Label>
                  <p className="text-xs text-gray-500">Klicke, um Hintergrund- und Schriftfarbe anzuwenden</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          backgroundColor === preset.bg && textColor === preset.text
                            ? "border-sky-500 ring-2 ring-sky-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: preset.bg }}
                      >
                        <span className="text-xs font-medium block truncate" style={{ color: preset.text }}>
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live-Vorschau */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="font-medium">Live-Vorschau</Label>
                  <div
                    className="p-6 rounded-xl border-2 border-gray-200 transition-colors"
                    style={{ backgroundColor, color: textColor }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {restaurant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{restaurant.name}</h4>
                        <p className="text-sm opacity-70">{restaurant.slogan || "Dein Restaurant-Slogan"}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-4">
                      So sieht der Text auf dem gewählten Hintergrund aus. Die Lesbarkeit ist wichtig!
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" className="text-white" style={{ backgroundColor: primaryColor }}>
                        Primär-Button
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Outline-Button
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Speichern Button */}
                <Button
                  type="button"
                  onClick={handleAllColorsSubmit}
                  disabled={colorLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 h-12 text-base"
                >
                  {colorLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Farben werden gespeichert...
                    </>
                  ) : (
                    <>
                      <Palette className="h-5 w-5 mr-2" />
                      Alle Farben speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logo & Hero-Bild - Blob Upload */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Logo & Hero-Bild</CardTitle>
              </div>
              <CardDescription>Bilder hochladen (max 4.5MB pro Bild)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Form */}
              <form className="space-y-3">
                <Label htmlFor="logoFile">Restaurant Logo</Label>
                {restaurant.logo_url && (
                  <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img src={restaurant.logo_url || "/placeholder.svg"} alt="Current Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                {logoPreview && (
                  <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img src={logoPreview || "/placeholder.svg"} alt="Logo Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <Input
                  id="logoFile"
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="cursor-pointer"
                  onChange={handleLogoSelect}
                />
                <input type="hidden" name="imageType" value="logo" />
                <input type="hidden" name="restaurantSlug" value={restaurant.slug} />
                <p className="text-xs text-gray-500">Empfohlen: quadratisches Format (z.B. 512x512px)</p>
                <Button type="button" onClick={handleSaveImages} className="w-full bg-sky-600 hover:bg-sky-700">
                  Logo hochladen
                </Button>
              </form>

              {/* Hero Image Upload Form */}
              <form className="space-y-3 pt-4 border-t">
                <Label htmlFor="heroFile">Hero-Bild</Label>
                {restaurant.hero_image_url && (
                  <div className="relative w-full h-40 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img src={restaurant.hero_image_url || "/placeholder.svg"} alt="Current Hero" className="w-full h-full object-cover" />
                  </div>
                )}
                {heroPreview && (
                  <div className="relative w-full h-40 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img src={heroPreview || "/placeholder.svg"} alt="Hero Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input
                  id="heroFile"
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="cursor-pointer"
                  onChange={handleHeroSelect}
                />
                <input type="hidden" name="imageType" value="hero" />
                <input type="hidden" name="restaurantSlug" value={restaurant.slug} />
                <p className="text-xs text-gray-500">Empfohlen: Querformat 16:9 oder 2:1 (z.B. 1920x1080px)</p>
                <Button type="button" onClick={handleSaveImages} className="w-full bg-sky-600 hover:bg-sky-700">
                  Hero-Bild hochladen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Legal Tab */}
      {activeTab === "legal" && (
        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Impressum-Daten</CardTitle>
              </div>
              <CardDescription>Strukturierte Angaben für das Impressum</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLegalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Betreiber / Inhaber</Label>
                    <Input
                      id="legalName"
                      name="legalName"
                      defaultValue={restaurant.legal_name || ""}
                      placeholder="z.B. Max Mustermann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalAddress">Geschäftsadresse</Label>
                    <Input
                      id="legalAddress"
                      name="legalAddress"
                      defaultValue={restaurant.legal_address || ""}
                      placeholder="Musterstr. 1, 12345 Stadt"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Steuernummer / USt-IdNr.</Label>
                    <Input id="taxId" name="taxId" defaultValue={restaurant.tax_id || ""} placeholder="DE123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Handelsregister-Nr.</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      defaultValue={restaurant.registration_number || ""}
                      placeholder="HRB 12345"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privacyPolicy">Datenschutzerklärung</Label>
                  <Textarea
                    id="privacyPolicy"
                    name="privacyPolicy"
                    defaultValue={restaurant.privacy_policy || ""}
                    placeholder="Ihre Datenschutzerklärung..."
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsOfService">AGB</Label>
                  <Textarea
                    id="termsOfService"
                    name="termsOfService"
                    defaultValue={restaurant.terms_of_service || ""}
                    placeholder="Ihre Allgemeinen Geschäftsbedingungen..."
                    rows={8}
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                  Speichern
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

  {/* SEO Tab - Merged with SEO Footer */}
  {activeTab === "seo" && (
    <div className="space-y-6">
      <SeoTab restaurant={restaurant} />
      <SeoFooterTab 
        restaurant={restaurant}
        categories={categories}
        deliveryZones={deliveryZones}
        onUpdate={async (data) => {
          const result = await updateSeoFooterSettings(data)
          if (result.error) {
            throw new Error(result.error)
          }
        }}
      />
    </div>
  )}

  {/* Domain Tab - Custom Domain Setup */}
  {activeTab === "domain" && <DomainSetupSection />}

  {/* QR Code Tab */}
      {activeTab === "qr-code" && <QRCodeTab restaurant={restaurant} />}
    </div>
  )
}
