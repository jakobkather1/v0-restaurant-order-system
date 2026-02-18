"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, AlertTriangle, CheckCircle2, Camera, X } from "lucide-react"
import { toast } from "sonner"

interface MenuScannerProps {
  slug: string
  restaurantId: number
  onImportComplete: () => void
}

interface ScannedMenuItem {
  name: string
  description?: string
  prices: Array<{ size: string; price: number }>
  toppingsAllowed: boolean
  allergens?: string[]
}

interface ScannedCategory {
  name: string
  description?: string
  items: ScannedMenuItem[]
}

interface ScannedTopping {
  name: string
  price: number
}

interface ScannedMenuData {
  categories: ScannedCategory[]
  toppings: ScannedTopping[]
}

export function MenuScanner({ slug, restaurantId, onImportComplete }: MenuScannerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedMenuData | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the limit
    const totalFiles = uploadedImages.length + files.length
    if (totalFiles > 5) {
      toast.error(`Sie können maximal 5 Bilder hochladen. Sie haben bereits ${uploadedImages.length} Bild(er).`)
      e.target.value = "" // Reset file input
      return
    }

    // Validate all files
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} ist kein Bild`)
        e.target.value = "" // Reset file input
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß. Max: 10MB`)
        e.target.value = "" // Reset file input
        return
      }
    }

    setIsUploading(true)

    try {
      console.log(`[v0] Uploading ${files.length} menu image(s)...`)
      
      const newImageUrls: string[] = []
      const newFileNames: string[] = []
      
      // Upload all images
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("slug", slug)

        const uploadResponse = await fetch("/api/admin/upload-menu-image", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || "Upload failed")
        }

        const { url: imageUrl } = await uploadResponse.json()
        newImageUrls.push(imageUrl)
        newFileNames.push(file.name)
      }
      
      // Add new images to existing ones
      setUploadedImages(prev => [...prev, ...newImageUrls])
      setUploadedFileNames(prev => [...prev, ...newFileNames])
      
      const totalCount = uploadedImages.length + newImageUrls.length
      toast.success(`${newImageUrls.length} Bild(er) erfolgreich hochgeladen! (${totalCount}/5)`)
      
      // Reset the file input so the same files can be selected again if needed
      e.target.value = ""
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Hochladen")
    } finally {
      setIsUploading(false)
    }
  }

  const handleScan = async () => {
    if (uploadedImages.length === 0) return

    setIsScanning(true)
    setScannedData(null)

    try {
      console.log(`[v0] Scanning ${uploadedImages.length} image(s) with AI...`)

      // Scan all images with AI
      const response = await fetch("/api/admin/scan-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploadedImages }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Analysieren der Speisekarte")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Analyse fehlgeschlagen")
      }

      setScannedData(result.data)
      toast.success(`${uploadedImages.length} Bild(er) erfolgreich analysiert!`)
    } catch (error) {
      console.error("[v0] Error scanning menu:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Scannen")
    } finally {
      setIsScanning(false)
    }
  }

  const handleImport = async () => {
    if (!scannedData) return

    setIsImporting(true)

    try {
      const response = await fetch("/api/admin/import-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          restaurantId,
          menuData: scannedData,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Importieren der Speisekarte")
      }

      const result = await response.json()
      
      if (result.imported?.updated > 0) {
        toast.success(
          `Speisekarte importiert! ${result.imported.items} neue Gerichte hinzugefügt, ${result.imported.updated} existierende aktualisiert.`
        )
      } else {
        toast.success(`Speisekarte erfolgreich importiert! ${result.imported.items} Gerichte hinzugefügt.`)
      }
      
      setScannedData(null)
      setUploadedImages([])
      
      // Trigger data refresh
      onImportComplete()
    } catch (error) {
      console.error("[v0] Error importing menu:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Importieren")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <CardTitle>KI-Speisekarten-Scanner</CardTitle>
        </div>
        <CardDescription>
          Laden Sie ein Foto Ihrer Speisekarte hoch und lassen Sie die KI automatisch alle Gerichte,
          Kategorien, Preise und Toppings extrahieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Hinweis:</strong> Die KI-Analyse ist nicht 100% genau. Bitte überprüfen Sie alle
            extrahierten Daten nach dem Import und korrigieren Sie bei Bedarf.
          </AlertDescription>
        </Alert>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button 
                asChild 
                variant="outline" 
                disabled={isUploading || isScanning || uploadedImages.length >= 5} 
                className="relative"
              >
                <label className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lade hoch...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadedImages.length > 0 ? "Weitere Bilder hinzufügen" : "Bilder auswählen"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading || isScanning || uploadedImages.length >= 5}
                  />
                </label>
              </Button>
              <Badge variant={uploadedImages.length >= 5 ? "destructive" : "secondary"} className="text-xs">
                {uploadedImages.length}/5 Bilder
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {uploadedImages.length >= 5 
                ? "Maximale Anzahl erreicht. Entfernen Sie Bilder, um neue hinzuzufügen."
                : `Sie können noch ${5 - uploadedImages.length} Bild(er) hinzufügen. Die KI analysiert alle Bilder nacheinander.`
              }
            </p>
          </div>

          {/* Show uploaded files */}
          {uploadedImages.length > 0 && !scannedData && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {uploadedImages.length} Bild(er) hochgeladen
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bereit zur Analyse
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadedImages([])
                    setUploadedFileNames([])
                    toast.info("Dateien entfernt")
                  }}
                  disabled={isScanning}
                >
                  Entfernen
                </Button>
              </div>

              {/* File list */}
              <div className="space-y-1">
                {uploadedFileNames.map((fileName, idx) => (
                  <div key={idx} className="text-xs bg-white rounded px-3 py-2 flex items-center gap-2 group">
                    <Camera className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{fileName}</span>
                    <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <button
                      onClick={() => {
                        setUploadedImages(prev => prev.filter((_, i) => i !== idx))
                        setUploadedFileNames(prev => prev.filter((_, i) => i !== idx))
                        toast.info(`${fileName} entfernt`)
                      }}
                      disabled={isScanning}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Scan button */}
              <Button 
                onClick={handleScan} 
                disabled={isScanning}
                className="w-full"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analysiere Speisekarte...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    KI-Analyse starten
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {scannedData && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Analyseergebnisse</h3>
                <p className="text-sm text-muted-foreground">
                  {scannedData.categories.length} Kategorien,{" "}
                  {scannedData.categories.reduce((sum, cat) => sum + cat.items.length, 0)} Gerichte,{" "}
                  {scannedData.toppings.length} Toppings gefunden
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {scannedData.categories.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription className="text-xs">{category.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {category.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex justify-between gap-4">
                          <span className="flex-1">{item.name}</span>
                          <span className="text-muted-foreground shrink-0">
                            {item.prices.length > 1
                              ? `${item.prices[0].price}€ - ${item.prices[item.prices.length - 1].price}€`
                              : `${item.prices[0].price}€`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setScannedData(null)
                  setUploadedImages([])
                  setUploadedFileNames([])
                }}
              >
                Abbrechen
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  "Speisekarte importieren"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
