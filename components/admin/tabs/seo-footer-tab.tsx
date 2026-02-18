"use client"

import { useState } from "react"
import type { Restaurant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Plus, X, Save, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Category, DeliveryZone } from "@/lib/types"

interface SeoFooterTabProps {
  restaurant: Restaurant
  categories?: Category[]
  deliveryZones?: DeliveryZone[]
  onUpdate: (data: Partial<Restaurant>) => Promise<void>
}

export function SeoFooterTab({ restaurant, categories = [], deliveryZones = [], onUpdate }: SeoFooterTabProps) {
  const [enabled, setEnabled] = useState(restaurant.seo_footer_enabled ?? false)
  const [description, setDescription] = useState(restaurant.seo_footer_description ?? "")
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>(restaurant.seo_footer_delivery_areas ?? [])
  const [popularCategories, setPopularCategories] = useState<string[]>(restaurant.seo_footer_popular_categories ?? [])
  const [showSocialMedia, setShowSocialMedia] = useState(restaurant.seo_footer_show_social_media ?? true)
  const [showPaymentMethods, setShowPaymentMethods] = useState(restaurant.seo_footer_show_payment_methods ?? true)
  const [showSocialLinks, setShowSocialLinks] = useState(restaurant.seo_footer_show_social_links ?? true) // Declared variable
  const [newDeliveryArea, setNewDeliveryArea] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingComplete, setIsGeneratingComplete] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleAddDeliveryArea = () => {
    if (newDeliveryArea.trim()) {
      setDeliveryAreas([...deliveryAreas, newDeliveryArea.trim()])
      setNewDeliveryArea("")
    }
  }

  const handleRemoveDeliveryArea = (index: number) => {
    setDeliveryAreas(deliveryAreas.filter((_, i) => i !== index))
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setPopularCategories([...popularCategories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const handleRemoveCategory = (index: number) => {
    setPopularCategories(popularCategories.filter((_, i) => i !== index))
  }

  const handleGenerateDescription = async () => {
    setIsGenerating(true)
    setSaveMessage(null)

    try {
      const response = await fetch("/api/admin/generate-seo-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          cuisine: restaurant.cuisine,
          city: restaurant.city,
          specialties: popularCategories.join(", "),
          deliveryAreas: deliveryAreas,
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setDescription(data.description)
      setSaveMessage({ type: "success", text: "Beschreibung erfolgreich generiert!" })
    } catch (error) {
      console.error("[v0] Error generating description:", error)
      setSaveMessage({ type: "error", text: "Fehler beim Generieren der Beschreibung." })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateCompleteFooter = async () => {
    setIsGeneratingComplete(true)
    setSaveMessage(null)

    console.log("[v0] Starting footer generation with data:", {
      categoriesCount: categories.length,
      deliveryZonesCount: deliveryZones.length,
      categoryNames: categories.map(c => c.name),
      zoneNames: deliveryZones.map(z => z.name),
    })

    try {
      const response = await fetch("/api/admin/generate-seo-footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          cuisine: restaurant.cuisine,
          city: restaurant.city,
          address: restaurant.address,
          phone: restaurant.phone,
          categories: categories.map((c) => c.name),
          deliveryZones: deliveryZones,
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      
      // Update all fields
      setDescription(data.description || "")
      setDeliveryAreas(data.deliveryAreas || [])
      setPopularCategories(data.popularCategories || [])
      
      setSaveMessage({ type: "success", text: "SEO Footer komplett generiert! Bitte überprüfen und speichern." })
    } catch (error) {
      console.error("[v0] Error generating complete footer:", error)
      setSaveMessage({ type: "error", text: "Fehler beim Generieren des SEO Footers." })
    } finally {
      setIsGeneratingComplete(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      await onUpdate({
        seo_footer_enabled: enabled,
        seo_footer_description: description,
        seo_footer_delivery_areas: deliveryAreas,
        seo_footer_popular_categories: popularCategories,
        seo_footer_show_social_media: showSocialMedia,
        seo_footer_show_payment_methods: showPaymentMethods,
      })
      setSaveMessage({ type: "success", text: "SEO Footer erfolgreich gespeichert!" })
    } catch (error) {
      setSaveMessage({ type: "error", text: "Fehler beim Speichern. Bitte versuchen Sie es erneut." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>SEO Footer Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie den SEO-optimierten Footer für Ihre Webseite. Der Footer hilft bei der Suchmaschinenoptimierung und bietet zusätzliche Informationen für Kunden.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="default"
              onClick={handleGenerateCompleteFooter}
              disabled={isGeneratingComplete || !enabled}
              className="shrink-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGeneratingComplete ? "Generiere..." : "Gesamten Footer generieren"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Footer */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="footer-enabled">SEO Footer aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Zeigt einen erweiterten Footer mit SEO-relevanten Informationen am Ende der Seite an
              </p>
            </div>
            <Switch
              id="footer-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">SEO Beschreibung</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generiere..." : "Beschreibung generieren"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ausführliche Beschreibung Ihres Restaurants (100-150 Wörter empfohlen für SEO). HTML-Tags sind erlaubt.
                </p>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreiben Sie Ihr Restaurant, Ihre Spezialitäten, Geschichte, Philosophie..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Aktuelle Wortanzahl: {description.split(/\s+/).filter(Boolean).length}
                </p>
              </div>

              {/* Delivery Areas */}
              <div className="space-y-2">
                <Label>Liefergebiete</Label>
                <p className="text-sm text-muted-foreground">
                  Listen Sie alle Stadtteile und Gebiete auf, in die Sie liefern
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newDeliveryArea}
                    onChange={(e) => setNewDeliveryArea(e.target.value)}
                    placeholder="z.B. Berlin-Mitte"
                    onKeyDown={(e) => e.key === "Enter" && handleAddDeliveryArea()}
                  />
                  <Button onClick={handleAddDeliveryArea} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {deliveryAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {deliveryAreas.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-md"
                      >
                        <span className="text-sm">{area}</span>
                        <button
                          onClick={() => handleRemoveDeliveryArea(index)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Categories */}
              <div className="space-y-2">
                <Label>Beliebte Kategorien</Label>
                <p className="text-sm text-muted-foreground">
                  Heben Sie beliebte Menükategorien für schnellen Zugriff hervor
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="z.B. Pizza, Pasta, Salate"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {popularCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {popularCategories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-md"
                      >
                        <span className="text-sm">{category}</span>
                        <button
                          onClick={() => handleRemoveCategory(index)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Options */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Anzeigeoptionen</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-social">Social Media Links anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Zeigt Facebook und Instagram Links im Footer (falls konfiguriert)
                    </p>
                  </div>
                  <Switch
                    id="show-social"
                    checked={showSocialMedia}
                    onCheckedChange={setShowSocialMedia}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-payment">Zahlungsmethoden anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Zeigt verfügbare Zahlungsmethoden im Footer
                    </p>
                  </div>
                  <Switch
                    id="show-payment"
                    checked={showPaymentMethods}
                    onCheckedChange={setShowPaymentMethods}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>SEO Tipp:</strong> Eine ausführliche Beschreibung (300+ Wörter) mit relevanten Keywords, 
                  kombinierten mit Liefergebieten und Kategorien, verbessert Ihre Suchmaschinen-Rankings erheblich.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Speichern..." : "Änderungen speichern"}
            </Button>

            {saveMessage && (
              <Alert variant={saveMessage.type === "error" ? "destructive" : "default"} className="flex-1">
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
