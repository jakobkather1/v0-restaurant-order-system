"use client"

import { useState, useTransition } from "react"
import { updateSeoSettings } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertCircle, CheckCircle, Search, Globe, MapPin, Star, Loader2, 
  Facebook, Instagram, Share2, Tag, TrendingUp, Eye, ImageIcon,
  ExternalLink, CheckCircle2, XCircle
} from "lucide-react"
import type { Restaurant } from "@/lib/types"

// Function declarations removed - SEO score was a non-functional placeholder

// Checklist Item Component
function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${checked ? "bg-green-50" : "bg-gray-50"}`}>
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${checked ? "text-green-700" : "text-gray-600"}`}>{label}</span>
    </div>
  )
}

interface SeoTabProps {
  restaurant: Restaurant
}

export function SeoTab({ restaurant }: SeoTabProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Live preview state
  const [liveTitle, setLiveTitle] = useState(restaurant.seo_title || `${restaurant.name} - Online Bestellen`)
  const [liveDescription, setLiveDescription] = useState(restaurant.seo_description || `Bestelle jetzt bei ${restaurant.name}! Frische Gerichte, schnelle Lieferung.`)
  const [liveOgImage, setLiveOgImage] = useState(restaurant.og_image || "")
  const [titleLength, setTitleLength] = useState((restaurant.seo_title || "").length)
  const [descLength, setDescLength] = useState((restaurant.seo_description || "").length)

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    
    startTransition(async () => {
      try {
        const result = await updateSeoSettings(formData)
        
        if (result?.error) {
          setMessage({ type: "error", text: result.error })
        } else if (result?.success) {
          setMessage({ type: "success", text: "SEO-Einstellungen erfolgreich gespeichert!" })
        } else {
          setMessage({ type: "error", text: "Unbekannte Antwort vom Server" })
        }
      } catch (error) {
        setMessage({ 
          type: "error", 
          text: error instanceof Error ? error.message : "Netzwerkfehler beim Speichern" 
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO-Einstellungen</h2>
        <p className="text-gray-600">Optimiere dein Restaurant für Google und andere Suchmaschinen</p>
      </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meta Tags */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Meta-Tags</CardTitle>
              </div>
              <CardDescription>Titel und Beschreibung für Google-Suchergebnisse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="seoTitle">SEO Titel (max. 70 Zeichen)</Label>
                  <span className={`text-xs ${titleLength > 60 ? "text-amber-600" : "text-gray-500"}`}>
                    {titleLength}/70
                  </span>
                </div>
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  defaultValue={restaurant.seo_title || ""}
                  placeholder={`${restaurant.name} - Online Bestellen`}
                  maxLength={70}
                  onChange={(e) => {
                    setTitleLength(e.target.value.length)
                    setLiveTitle(e.target.value || `${restaurant.name} - Online Bestellen`)
                  }}
                />
                <p className="text-xs text-gray-500">Erscheint als Titel in den Google-Suchergebnissen</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="seoDescription">Meta-Beschreibung (max. 160 Zeichen)</Label>
                  <span className={`text-xs ${descLength > 155 ? "text-amber-600" : "text-gray-500"}`}>
                    {descLength}/160
                  </span>
                </div>
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  defaultValue={restaurant.seo_description || ""}
                  placeholder={`Bestelle jetzt bei ${restaurant.name}! Frische Gerichte, schnelle Lieferung.`}
                  maxLength={160}
                  rows={3}
                  onChange={(e) => {
                    setDescLength(e.target.value.length)
                    setLiveDescription(e.target.value || `Bestelle jetzt bei ${restaurant.name}! Frische Gerichte, schnelle Lieferung.`)
                  }}
                />
                <p className="text-xs text-gray-500">Erscheint unter dem Titel in den Google-Suchergebnissen</p>
              </div>
              
            </CardContent>
          </Card>

          {/* Local Business */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Lokale SEO</CardTitle>
              </div>
              <CardDescription>Standortdaten für Google Maps und lokale Suche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geoLat">Breitengrad</Label>
                  <Input
                    id="geoLat"
                    name="geoLat"
                    type="number"
                    step="any"
                    defaultValue={restaurant.geo_lat || ""}
                    placeholder="52.520008"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geoLng">Längengrad</Label>
                  <Input
                    id="geoLng"
                    name="geoLng"
                    type="number"
                    step="any"
                    defaultValue={restaurant.geo_lng || ""}
                    placeholder="13.404954"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Koordinaten findest du bei Google Maps (Rechtsklick → "Was ist hier?")
              </p>
              <div className="space-y-2">
                <Label htmlFor="googleBusinessUrl">Google Business Profile URL</Label>
                <Input
                  id="googleBusinessUrl"
                  name="googleBusinessUrl"
                  type="url"
                  defaultValue={restaurant.google_business_url || ""}
                  placeholder="https://g.page/dein-restaurant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceRange">Preisklasse</Label>
                <select
                  id="priceRange"
                  name="priceRange"
                  defaultValue={restaurant.price_range || "$$"}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="$">$ - Günstig</option>
                  <option value="$$">$$ - Moderat</option>
                  <option value="$$$">$$$ - Gehoben</option>
                  <option value="$$$$">$$$$ - Luxus</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Küche / Kategorie</Label>
                <Input
                  id="cuisineType"
                  name="cuisineType"
                  defaultValue={restaurant.cuisine_type || ""}
                  placeholder="Italienisch, Pizza, Pasta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media / Open Graph */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Social Media & Open Graph</CardTitle>
              </div>
              <CardDescription>Vorschau beim Teilen auf Facebook, WhatsApp etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ogImage">Vorschaubild URL</Label>
                <Input
                  id="ogImage"
                  name="ogImage"
                  type="url"
                  defaultValue={restaurant.og_image || ""}
                  placeholder="https://example.com/vorschau.jpg"
                  onChange={(e) => setLiveOgImage(e.target.value)}
                />
                <p className="text-xs text-gray-500">Empfohlen: 1200x630 Pixel, wird beim Teilen angezeigt</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    id="facebookUrl"
                    name="facebookUrl"
                    type="url"
                    defaultValue={restaurant.facebook_url || ""}
                    placeholder="facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    type="url"
                    defaultValue={restaurant.instagram_url || ""}
                    placeholder="instagram.com/..."
                  />
                </div>
              </div>
              
              {/* Social Media Preview */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Vorschau beim Teilen
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {/* Preview Image */}
                  <div className="aspect-[1.91/1] bg-gray-200 flex items-center justify-center">
                    {liveOgImage ? (
                      <img 
                        src={liveOgImage || "/placeholder.svg"} 
                        alt="Social Media Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Kein Bild angegeben</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 uppercase">
                      {restaurant.custom_domain || `yourdomain.com`}
                    </p>
                    <p className="font-semibold text-gray-900 mt-1 line-clamp-2">{liveTitle}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{liveDescription}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Google Preview */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">Google Vorschau (Live)</CardTitle>
              </div>
              <CardDescription>So erscheint dein Restaurant in den Google-Suchergebnissen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                {/* Google Search Result Preview */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {restaurant.custom_domain || `yourdomain.com/${restaurant.slug}`}
                  </p>
                  <p className="text-xl text-blue-800 hover:underline cursor-pointer font-normal leading-tight">
                    {liveTitle}
                  </p>
                  <p className="text-sm text-gray-600 leading-snug">
                    {liveDescription}
                  </p>
                </div>
                
                {/* Rich Snippet Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="ml-1">4.5 (120 Bewertungen)</span>
                    </div>
                    <span>{restaurant.price_range || "$$"}</span>
                    <span>{restaurant.cuisine_type || "Restaurant"}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{restaurant.address || "Adresse in Einstellungen angeben"}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Tipp:</strong> Die Vorschau aktualisiert sich live während du tippst. 
                  Der tatsächliche Titel sollte unter 60 Zeichen bleiben für optimale Darstellung.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* SEO Checklist */}
          <Card className="bg-white border-gray-200 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-gray-900">SEO-Checkliste</CardTitle>
              </div>
              <CardDescription>Verbessere deinen SEO-Score mit diesen Empfehlungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Title checks */}
                <ChecklistItem 
                  checked={liveTitle.length >= 30 && liveTitle.length <= 60}
                  label="Titel hat 30-60 Zeichen"
                />
                <ChecklistItem 
                  checked={liveTitle.includes(restaurant.name)}
                  label="Titel enthält Restaurant-Name"
                />
                <ChecklistItem 
                  checked={liveTitle.toLowerCase().includes("bestellen") || liveTitle.toLowerCase().includes("lieferung")}
                  label="Titel enthält Call-to-Action"
                />
                
                {/* Description checks */}
                <ChecklistItem 
                  checked={liveDescription.length >= 120 && liveDescription.length <= 160}
                  label="Beschreibung hat 120-160 Zeichen"
                />
                <ChecklistItem 
                  checked={liveDescription.includes(restaurant.name)}
                  label="Beschreibung enthält Name"
                />
                
                {/* Local SEO checks */}
                <ChecklistItem 
                  checked={!!restaurant.address}
                  label="Adresse angegeben"
                />
                <ChecklistItem 
                  checked={!!(restaurant.geo_lat && restaurant.geo_lng)}
                  label="Geo-Koordinaten gesetzt"
                />
                <ChecklistItem 
                  checked={!!restaurant.google_business_url}
                  label="Google Business verknüpft"
                />
                
                {/* Social checks */}
                <ChecklistItem 
                  checked={!!liveOgImage}
                  label="Social Media Bild gesetzt"
                />
                <ChecklistItem 
                  checked={!!restaurant.facebook_url || !!restaurant.instagram_url}
                  label="Social Media Profile verknüpft"
                />
                <ChecklistItem 
                  checked={!!restaurant.cuisine_type}
                  label="Küchen-Kategorie definiert"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end sticky bottom-4">
          <Button type="submit" disabled={isPending} className="bg-sky-600 hover:bg-sky-700">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              "SEO-Einstellungen speichern"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
