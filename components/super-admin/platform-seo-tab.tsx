"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { updatePlatformSettings } from "@/app/super-admin/actions"
import { toast } from "sonner"
import { Search, Globe, Share2, ImageIcon } from "lucide-react"

interface PlatformSeoTabProps {
  settings: Record<string, string>
}

export function PlatformSeoTab({ settings }: PlatformSeoTabProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Debug: Log form data
    console.log("[v0] Submitting SEO settings:", {
      seo_title: formData.get("seo_title"),
      seo_description: formData.get("seo_description"),
      seo_keywords: formData.get("seo_keywords"),
      og_title: formData.get("og_title"),
      og_description: formData.get("og_description"),
      og_image: formData.get("og_image"),
    })
    
    const result = await updatePlatformSettings(formData)

    console.log("[v0] SEO settings save result:", result)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Platform SEO Einstellungen wurden gespeichert")
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Platform SEO Einstellungen</h3>
        <p className="text-sm text-muted-foreground">
          Diese Einstellungen gelten für die Hauptseite order-terminal.de und werden von Suchmaschinen indexiert
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Meta Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Suchmaschinen Meta-Tags
            </CardTitle>
            <CardDescription>Diese Informationen werden in Google und anderen Suchmaschinen angezeigt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title *</Label>
              <Input
                id="meta_title"
                name="seo_title"
                defaultValue={settings.seo_title || ""}
                placeholder="z.B. Order Terminal - Online Bestellsystem für Restaurants"
                maxLength={60}
                required
              />
              <p className="text-xs text-muted-foreground">Empfohlen: 50-60 Zeichen</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description *</Label>
              <Textarea
                id="meta_description"
                name="seo_description"
                defaultValue={settings.seo_description || ""}
                placeholder="Kurze Beschreibung Ihrer Platform für Suchmaschinen..."
                maxLength={160}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">Empfohlen: 150-160 Zeichen</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords (optional)</Label>
              <Input
                id="meta_keywords"
                name="seo_keywords"
                defaultValue={settings.seo_keywords || ""}
                placeholder="z.B. bestellsystem, restaurant, online bestellen"
              />
              <p className="text-xs text-muted-foreground">Komma-getrennte Liste relevanter Suchbegriffe</p>
            </div>
          </CardContent>
        </Card>

        {/* Open Graph Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Media (Open Graph)
            </CardTitle>
            <CardDescription>
              Diese Informationen werden angezeigt, wenn Ihre Seite auf Social Media geteilt wird
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og_title">OG Title</Label>
              <Input
                id="og_title"
                name="og_title"
                defaultValue={settings.og_title || settings.seo_title || ""}
                placeholder="Titel für Social Media Shares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_description">OG Description</Label>
              <Textarea
                id="og_description"
                name="og_description"
                defaultValue={settings.og_description || settings.seo_description || ""}
                placeholder="Beschreibung für Social Media Shares"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">OG Image URL (optional)</Label>
              <Input
                id="og_image"
                name="og_image"
                defaultValue={settings.og_image || ""}
                placeholder="https://order-terminal.de/og-image.jpg"
                type="url"
              />
              <p className="text-xs text-muted-foreground">Empfohlene Größe: 1200x630px</p>
            </div>
          </CardContent>
        </Card>

        {/* SEO Tips */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Globe className="h-5 w-5" />
              SEO Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-900">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Meta Title:</strong> Halten Sie ihn unter 60 Zeichen und platzieren Sie wichtige Keywords am
                  Anfang
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Meta Description:</strong> Schreiben Sie eine überzeugende Beschreibung mit Call-to-Action
                  (max. 160 Zeichen)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>Keywords:</strong> Verwenden Sie relevante Begriffe, die Ihre Zielgruppe tatsächlich sucht
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>OG Image:</strong> Ein ansprechendes Bild erhöht die Klickrate auf Social Media um bis zu 40%
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} size="lg">
          {loading ? "Speichern..." : "SEO Einstellungen speichern"}
        </Button>
      </form>
    </div>
  )
}
