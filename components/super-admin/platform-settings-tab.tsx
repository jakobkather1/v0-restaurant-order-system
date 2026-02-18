"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Trash2, ImageIcon, AlertCircle } from "lucide-react"
import { updatePlatformFavicon, deletePlatformFavicon } from "@/app/super-admin/actions"
import { toast } from "sonner"

interface PlatformSettingsTabProps {
  settings: Record<string, string>
}

export function PlatformSettingsTab({ settings }: PlatformSettingsTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(settings.platform_favicon || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/jpeg"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Ungültiges Format. Erlaubt: PNG, ICO, SVG, JPG")
      return
    }

    // Validate file size
    if (file.size > 500 * 1024) {
      toast.error("Datei zu groß. Maximal 500KB erlaubt")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setIsUploading(true)
    const formData = new FormData()
    formData.append("favicon", file)

    const result = await updatePlatformFavicon(formData)
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
      setPreviewUrl(settings.platform_favicon || null)
    } else {
      toast.success("Favicon erfolgreich aktualisiert")
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm("Möchten Sie das Favicon wirklich löschen?")) return

    setIsUploading(true)
    const result = await deletePlatformFavicon()
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Favicon gelöscht")
      setPreviewUrl(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Website Favicon
          </CardTitle>
          <CardDescription>
            Das Favicon erscheint im Browser-Tab. Unterstützte Formate: PNG, ICO, SVG, JPG (max. 500KB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Favicon Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <span className="text-xs text-gray-500">Vorschau</span>
            </div>

            {/* Browser Tab Preview */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-t-lg px-3 py-2 border border-b-0 border-gray-300">
                <div className="w-4 h-4 flex-shrink-0 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl || "/placeholder.svg"} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 rounded" />
                  )}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[100px]">Restaurant Order</span>
              </div>
              <span className="text-xs text-gray-500">Browser-Tab Vorschau</span>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".png,.ico,.svg,.jpg,.jpeg,image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Wird hochgeladen..." : "Favicon hochladen"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isUploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Empfehlungen:</p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                <li>Verwenden Sie ein quadratisches Bild (z.B. 32x32 oder 64x64 Pixel)</li>
                <li>PNG oder SVG für beste Qualität</li>
                <li>Einfaches Design für gute Erkennbarkeit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
