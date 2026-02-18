'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Trash2, Plus, Edit2, X, Check } from 'lucide-react'
import { getQRCodes, createQRCode, deleteQRCode, updateQRCode, type QRCode } from '@/app/actions/qr-codes'
import type { Restaurant } from '@/lib/types'

interface QRCodeTabProps {
  restaurant: Restaurant
}

export function QRCodeTab({ restaurant }: QRCodeTabProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQRCodes()
  }, [restaurant.id])

  const loadQRCodes = async () => {
    setLoading(true)
    try {
      const codes = await getQRCodes(restaurant.id)
      setQrCodes(codes || [])
    } catch (err) {
      setError('Fehler beim Laden der QR-Codes')
      setQrCodes([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newUrl || !newLabel) {
      setError('URL und Bezeichnung sind erforderlich')
      return
    }

    const result = await createQRCode(restaurant.id, newUrl, newLabel)
    
    if (result.success && result.qrCode) {
      setQrCodes([...qrCodes, result.qrCode])
      setNewUrl('')
      setNewLabel('')
      setIsCreating(false)
      setError(null)
    } else {
      setError(result.error || 'Fehler beim Erstellen')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie diesen QR-Code wirklich löschen?')) {
      return
    }

    const result = await deleteQRCode(id, restaurant.id)
    
    if (result.success) {
      setQrCodes(qrCodes.filter(qr => qr.id !== id))
      setError(null)
    } else {
      setError(result.error || 'Fehler beim Löschen')
    }
  }

  const handleStartEdit = (qr: QRCode) => {
    setEditingId(qr.id)
    setEditUrl(qr.url)
    setEditLabel(qr.label)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditUrl('')
    setEditLabel('')
  }

  const handleUpdate = async (id: number) => {
    if (!editUrl || !editLabel) {
      setError('URL und Bezeichnung sind erforderlich')
      return
    }

    const result = await updateQRCode(id, restaurant.id, editUrl, editLabel)
    
    if (result.success && result.qrCode) {
      setQrCodes(qrCodes.map(qr => qr.id === id ? result.qrCode! : qr))
      setEditingId(null)
      setEditUrl('')
      setEditLabel('')
      setError(null)
    } else {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
  }

  const downloadQRCode = (url: string, label: string) => {
    const svgElement = document.querySelector(`[data-qr="${url}"] svg`) as SVGElement
    
    if (!svgElement) {
      console.log('[v0] QR Code SVG not found for URL:', url)
      return
    }

    // Convert SVG to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const link = document.createElement('a')
      link.download = `qr-code-${label.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (loading) {
    return <div className="text-center py-8">Lade QR-Codes...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">QR-Code Generator</h2>
        <p className="text-muted-foreground">
          Erstellen Sie bis zu 3 QR-Codes für verschiedene Zwecke
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Aktive QR-Codes: {qrCodes?.length || 0}/3
          </p>
        </div>
        {(qrCodes?.length || 0) < 3 && !isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer QR-Code
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen QR-Code erstellen</CardTitle>
            <CardDescription>Geben Sie die URL und eine Bezeichnung ein</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-label">Bezeichnung</Label>
                <Input
                  id="new-label"
                  placeholder="z.B. Hauptmenü, Tisch 1, Außenbereich"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-url">URL</Label>
                <Input
                  id="new-url"
                  type="url"
                  placeholder="https://www.beispiel.de"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Geben Sie die vollständige URL ein (z.B. https://www.ihre-domain.de)
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate}>Erstellen</Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false)
                  setNewUrl('')
                  setNewLabel('')
                  setError(null)
                }}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes?.map((qr) => (
          <Card key={qr.id}>
            {editingId === qr.id ? (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`edit-label-${qr.id}`}>Bezeichnung</Label>
                    <Input
                      id={`edit-label-${qr.id}`}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-url-${qr.id}`}>URL</Label>
                    <Input
                      id={`edit-url-${qr.id}`}
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(qr.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Speichern
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">{qr.label}</CardTitle>
                  <CardDescription className="break-all">{qr.url}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center bg-white p-4 rounded-lg border" data-qr={qr.url}>
                    <QRCodeSVG value={qr.url} size={200} level="H" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => downloadQRCode(qr.url, qr.label)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(qr)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(qr.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && !isCreating && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p>Noch keine QR-Codes erstellt.</p>
            <p className="text-sm mt-2">Klicken Sie auf "Neuer QR-Code", um zu beginnen.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Verwendungshinweise</CardTitle>
          <CardDescription>Tipps für die optimale Nutzung Ihrer QR-Codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <p><strong>Druckqualität:</strong> QR-Codes sind für professionelle Druckauflösung optimiert</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <p><strong>Größe:</strong> Mindestgröße 2x2 cm für zuverlässiges Scannen empfohlen</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <p><strong>Platzierung:</strong> Flyer, Speisekarten, Schaufenster, Tischaufsteller</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <p><strong>Test:</strong> Testen Sie jeden QR-Code vor dem Druck mit verschiedenen Smartphones</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <p><strong>Permanenz:</strong> QR-Codes bleiben dauerhaft aktiv, bis Sie sie löschen</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
