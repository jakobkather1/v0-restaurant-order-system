"use client"

import { useState, useOptimistic, useTransition } from "react"
import { updateRestaurantTheme, updateRestaurantImages } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Palette, ImageIcon, Type, PaintBucket, Loader2 } from "lucide-react"
import type { Restaurant } from "@/lib/types"

interface DesignTabProps {
  restaurant: Restaurant
}

interface ThemeColors {
  primary: string
  background: string
  text: string
}

export function DesignTab({ restaurant }: DesignTabProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // Use restaurant prop as source of truth - updates when page revalidates
  const currentTheme: ThemeColors = {
    primary: restaurant.primary_color || "#0369a1",
    background: restaurant.background_color || "#ffffff",
    text: restaurant.text_color || "#1f2937",
  }

  const initialTheme = currentTheme; // Declare initialTheme variable

  const [optimisticTheme, setOptimisticTheme] = useOptimistic(
    currentTheme,
    (state, newTheme: Partial<ThemeColors>) => ({ ...state, ...newTheme }),
  )

  const [previewColors, setPreviewColors] = useState<ThemeColors>(currentTheme)

  function handleColorChange(colorType: keyof ThemeColors, value: string) {
    setPreviewColors((prev) => ({ ...prev, [colorType]: value }))
  }

  function applyColorScheme(bg: string, text: string) {
    setPreviewColors((prev) => ({ ...prev, background: bg, text }))
  }

  async function handleThemeSubmit(formData: FormData) {
    // Placeholder for handleThemeSubmit logic
  }

  async function handleImagesSubmit(formData: FormData) {
    setImageLoading(true)
    setMessage(null)
    const result = await updateRestaurantImages(formData)
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Bilder aktualisiert" })
    }
    setImageLoading(false)
  }

  const colorSchemes = [
    { name: "Hell", bg: "#ffffff", text: "#1f2937" },
    { name: "Dunkel", bg: "#1f2937", text: "#f9fafb" },
    { name: "Warm", bg: "#fef3c7", text: "#78350f" },
    { name: "Kühl", bg: "#e0f2fe", text: "#0c4a6e" },
    { name: "Elegant", bg: "#faf5ff", text: "#581c87" },
    { name: "Natur", bg: "#ecfdf5", text: "#065f46" },
  ]

  const hasUnsavedChanges =
    previewColors.primary !== currentTheme.primary ||
    previewColors.background !== currentTheme.background ||
    previewColors.text !== currentTheme.text

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Design</h2>
        <p className="text-muted-foreground">Passe das Erscheinungsbild deines Terminals an</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <form action={updateRestaurantTheme} className="space-y-6">
        {/* Hidden inputs - bulletproof with defaultValue */}
        <input 
          type="hidden" 
          name="primaryColor" 
          defaultValue={previewColors.primary || restaurant.primary_color || "#0369a1"}
          key={`primary-${previewColors.primary}`}
        />
        <input 
          type="hidden" 
          name="backgroundColor" 
          defaultValue={previewColors.background || restaurant.background_color || "#ffffff"}
          key={`bg-${previewColors.background}`}
        />
        <input 
          type="hidden" 
          name="textColor" 
          defaultValue={previewColors.text || restaurant.text_color || "#1f2937"}
          key={`text-${previewColors.text}`}
        />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Primärfarbe
              </CardTitle>
              <CardDescription>Die Hauptfarbe für Buttons und Akzente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={previewColors.primary}
                  className="h-16 w-16 p-1 cursor-pointer"
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                />
                <div className="space-y-1">
                  <div className="font-medium">Aktuelle Farbe</div>
                  <code className="text-sm text-muted-foreground">{previewColors.primary}</code>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["#0369a1", "#059669", "#dc2626", "#ea580c", "#7c3aed", "#db2777"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange("primary", color)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PaintBucket className="h-5 w-5" />
                Hintergrund & Schrift
              </CardTitle>
              <CardDescription>Hintergrundfarbe und Schriftfarbe der Website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PaintBucket className="h-4 w-4" />
                    Hintergrund
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={previewColors.background}
                      className="h-12 w-12 p-1 cursor-pointer"
                      onChange={(e) => handleColorChange("background", e.target.value)}
                    />
                    <Input
                      type="text"
                      value={previewColors.background}
                      onChange={(e) => handleColorChange("background", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Schriftfarbe
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={previewColors.text}
                      className="h-12 w-12 p-1 cursor-pointer"
                      onChange={(e) => handleColorChange("text", e.target.value)}
                    />
                    <Input
                      type="text"
                      value={previewColors.text}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schnellauswahl</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.name}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-foreground transition-colors text-sm"
                      style={{ backgroundColor: scheme.bg, color: scheme.text }}
                      onClick={() => applyColorScheme(scheme.bg, scheme.text)}
                    >
                      <span className="font-medium">{scheme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo & Hero-Bild
              </CardTitle>
              <CardDescription>Bilder für Header und Hero-Bereich (separates Formular)</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleImagesSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={restaurant.logo_url || ""} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImageUrl">Hero-Bild URL</Label>
                  <Input
                    id="heroImageUrl"
                    name="heroImageUrl"
                    defaultValue={restaurant.hero_image_url || ""}
                    placeholder="https://..."
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tipp: Lade Bilder auf einen Dienst wie Imgur oder Cloudinary hoch und füge die URL hier ein.
                </p>
                <Button type="submit" disabled={imageLoading}>
                  {imageLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Bilder speichern
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* EMERGENCY DEBUG MODE - MUST BE VISIBLE */}
          <div className="bg-red-600 text-white p-6 rounded-lg border-4 border-red-800">
            <h1 className="text-3xl font-bold mb-4">
              🔴 DEBUG MODE ACTIVE - DB COLOR: {restaurant.primary_color || 'NO DB COLOR FOUND'}
            </h1>
            <div className="space-y-2 text-sm">
              <div>Restaurant ID: {restaurant.id}</div>
              <div>Restaurant Name: {restaurant.name}</div>
              <div>Primary Color from DB: {restaurant.primary_color || '❌ NULL/UNDEFINED'}</div>
              <div>Background Color from DB: {restaurant.background_color || '❌ NULL/UNDEFINED'}</div>
              <div>Text Color from DB: {restaurant.text_color || '❌ NULL/UNDEFINED'}</div>
            </div>
          </div>
          
          <p className="text-lg font-bold bg-yellow-200 text-black p-2">
            Preview State → Primary: <span className="font-mono">{previewColors.primary}</span> | 
            BG: <span className="font-mono">{previewColors.background}</span> | 
            Text: <span className="font-mono">{previewColors.text}</span>
          </p>
          
          <div className="sticky bottom-4 flex flex-col gap-4 bg-black text-white border-4 border-red-600 rounded-lg p-6 shadow-2xl">
            <div className="text-sm space-y-2">
              <div className="font-bold text-xl text-red-400">Werte die gesendet werden:</div>
              <div className="flex gap-4 font-mono text-base">
                <div>Primary: <span className="font-bold text-green-400">{previewColors.primary || "❌ NULL"}</span></div>
                <div>BG: <span className="font-bold text-green-400">{previewColors.background || "❌ NULL"}</span></div>
                <div>Text: <span className="font-bold text-green-400">{previewColors.text || "❌ NULL"}</span></div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!hasUnsavedChanges} 
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white text-2xl font-bold h-20 border-4 border-yellow-400"
            >
              🚨 DB UPDATE TEST [Force Mode] 🚨
            </Button>
          </div>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Live-Vorschau</CardTitle>
          <CardDescription>So sieht dein Terminal mit den aktuellen Farben aus</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: previewColors.background, color: previewColors.text }}
          >
            <div className="h-2" style={{ backgroundColor: previewColors.primary }} />
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                {restaurant.logo_url ? (
                  <img
                    src={restaurant.logo_url || "/placeholder.svg"}
                    alt="Logo"
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: previewColors.primary }}
                  >
                    {restaurant.name.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-lg">{restaurant.name}</span>
              </div>

              <div className="p-3 rounded-lg border" style={{ borderColor: `${previewColors.text}20` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Beispiel-Gericht</h4>
                    <p className="text-sm opacity-70">Leckere Beschreibung des Gerichts</p>
                  </div>
                  <span className="font-bold" style={{ color: previewColors.primary }}>
                    12,90 €
                  </span>
                </div>
              </div>

              <Button style={{ backgroundColor: previewColors.primary }} className="w-full text-white">
                Beispiel-Button
              </Button>

              <p className="text-sm opacity-70 text-center">
                Die Farben werden nach dem Speichern auf deiner Website angewendet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
