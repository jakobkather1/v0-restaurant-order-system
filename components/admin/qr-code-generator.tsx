"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Download, RefreshCw } from "lucide-react"

interface QRCodeGeneratorProps {
  restaurantName: string
  restaurantUrl: string
}

export function QRCodeGenerator({ restaurantName, restaurantUrl }: QRCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  // Generate QR code when dialog opens
  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    }
  }, [isOpen, restaurantUrl])

  const generateQRCode = async () => {
    console.log("[v0] Generating QR code for:", restaurantUrl)
    try {
      // Dynamic import to avoid SSR issues
      const QRCode = (await import("qrcode")).default
      const canvas = document.createElement("canvas")
      await QRCode.toCanvas(canvas, restaurantUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        scale: 8,
        width: 256,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      const dataUrl = canvas.toDataURL()
      console.log("[v0] QR code generated successfully")
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error("[v0] Error generating QR code:", error)
    }
  }

  const handleRegenerate = () => {
    setQrDataUrl("")
    generateQRCode()
  }

  const handleDownload = () => {
    if (!qrDataUrl) return

    // Create canvas with white background and padding
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const padding = 40
      canvas.width = img.width + padding * 2
      canvas.height = img.height + padding * 2

      // Fill white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw QR code centered
      ctx.drawImage(img, padding, padding)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}-qr-code.png`
        link.click()
        URL.revokeObjectURL(url)
      })
    }
    img.src = qrDataUrl
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <QrCode className="h-4 w-4" />
          QR-Code generieren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR-Code für {restaurantName}</DialogTitle>
          <DialogDescription>
            Nutzen Sie diesen QR-Code für Flyer, Plakate oder andere Marketingmaterialien.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {qrDataUrl ? (
            <>
              <div className="p-4 bg-white rounded-lg border">
                <img src={qrDataUrl || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{restaurantName}</p>
                <p className="text-xs text-muted-foreground break-all px-4">{restaurantUrl}</p>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                <Button onClick={handleRegenerate} variant="outline" className="gap-2 bg-transparent">
                  <RefreshCw className="h-4 w-4" />
                  Neu generieren
                </Button>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Herunterladen
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">QR-Code wird generiert...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
