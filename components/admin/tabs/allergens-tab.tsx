"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, AlertTriangle, FlaskConical, Sparkles } from "lucide-react"
import { createAllergen, updateAllergen, deleteAllergen, getRestaurantAllergens, bulkCreateAllergens } from "@/app/[slug]/admin/actions"
import { toast } from "sonner"
import type { Allergen } from "@/lib/types"

// 14 EU Hauptallergene
const EU_ALLERGENS = [
  { code: "A", name: "Gluten", description: "Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer, Dinkel, Kamut)" },
  { code: "B", name: "Krebstiere", description: "Krebstiere und daraus gewonnene Erzeugnisse" },
  { code: "C", name: "Eier", description: "Eier und daraus gewonnene Erzeugnisse" },
  { code: "D", name: "Fisch", description: "Fisch und daraus gewonnene Erzeugnisse" },
  { code: "E", name: "Erdnüsse", description: "Erdnüsse und daraus gewonnene Erzeugnisse" },
  { code: "F", name: "Soja", description: "Sojabohnen und daraus gewonnene Erzeugnisse" },
  { code: "G", name: "Milch/Laktose", description: "Milch und daraus gewonnene Erzeugnisse (einschließlich Laktose)" },
  { code: "H", name: "Schalenfrüchte", description: "Schalenfrüchte (Mandeln, Haselnüsse, Walnüsse, Cashewnüsse, Pecannüsse, Paranüsse, Pistazien, Macadamianüsse)" },
  { code: "I", name: "Sellerie", description: "Sellerie und daraus gewonnene Erzeugnisse" },
  { code: "J", name: "Senf", description: "Senf und daraus gewonnene Erzeugnisse" },
  { code: "K", name: "Sesam", description: "Sesamsamen und daraus gewonnene Erzeugnisse" },
  { code: "L", name: "Sulfite", description: "Schwefeldioxid und Sulphite in Konzentrationen über 10 mg/kg oder 10 mg/l" },
  { code: "M", name: "Lupinen", description: "Lupinen und daraus gewonnene Erzeugnisse" },
  { code: "N", name: "Weichtiere", description: "Weichtiere und daraus gewonnene Erzeugnisse" },
]

// 20 gängige Zusatzstoffe
const COMMON_ADDITIVES = [
  { code: "1", name: "mit Farbstoff", description: "Lebensmittel enthält Farbstoffe" },
  { code: "2", name: "mit Konservierungsstoff", description: "Lebensmittel enthält Konservierungsstoffe" },
  { code: "3", name: "mit Antioxidationsmittel", description: "Lebensmittel enthält Antioxidationsmittel" },
  { code: "4", name: "mit Geschmacksverstärker", description: "Lebensmittel enthält Geschmacksverstärker" },
  { code: "5", name: "geschwefelt", description: "Lebensmittel ist geschwefelt" },
  { code: "6", name: "geschwärzt", description: "Lebensmittel ist geschwärzt" },
  { code: "7", name: "gewachst", description: "Lebensmittel ist gewachst" },
  { code: "8", name: "mit Phosphat", description: "Lebensmittel enthält Phosphat" },
  { code: "9", name: "mit Süßungsmittel", description: "Lebensmittel enthält Süßungsmittel" },
  { code: "10", name: "enthält Phenylalaninquelle", description: "Lebensmittel enthält eine Phenylalaninquelle" },
  { code: "11", name: "koffeinhaltig", description: "Lebensmittel ist koffeinhaltig" },
  { code: "12", name: "chininhaltig", description: "Lebensmittel ist chininhaltig" },
  { code: "13", name: "mit Nitritpökelsalz", description: "Lebensmittel enthält Nitritpökelsalz" },
  { code: "14", name: "mit Milcheiweiß", description: "Lebensmittel enthält Milcheiweiß" },
  { code: "15", name: "gentechnisch verändert", description: "Lebensmittel wurde gentechnisch verändert" },
  { code: "16", name: "mit Taurin", description: "Lebensmittel enthält Taurin" },
  { code: "17", name: "mit Säuerungsmittel", description: "Lebensmittel enthält Säuerungsmittel" },
  { code: "18", name: "mit Stabilisator", description: "Lebensmittel enthält Stabilisatoren" },
  { code: "19", name: "mit Emulgator", description: "Lebensmittel enthält Emulatoren" },
  { code: "20", name: "mit Trennmittel", description: "Lebensmittel enthält Trennmittel" },
]

function naturalSort(a: string, b: string): number {
  const aNum = Number.parseInt(a, 10)
  const bNum = Number.parseInt(b, 10)

  // Both are numbers - sort numerically
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum
  }

  // Both are letters/strings - sort alphabetically
  if (isNaN(aNum) && isNaN(bNum)) {
    return a.localeCompare(b)
  }

  // Numbers come after letters (Allergene A-N, then Zusatzstoffe 1-12)
  if (isNaN(aNum)) return -1
  return 1
}

interface AllergensTabProps {
  restaurantId: number
}

export function AllergensTab({ restaurantId }: AllergensTabProps) {
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"allergen" | "additive">("allergen")

  useEffect(() => {
    loadAllergens()
  }, [])

  async function loadAllergens() {
    setLoading(true)
    const data = await getRestaurantAllergens()
    setAllergens(data as Allergen[])
    setLoading(false)
  }

  const allergensOnly = allergens.filter((a) => a.type === "allergen").sort((a, b) => naturalSort(a.code, b.code))
  const additivesOnly = allergens.filter((a) => a.type === "additive").sort((a, b) => naturalSort(a.code, b.code))

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    formData.set("type", activeTab)

    if (editingAllergen) {
      formData.set("id", editingAllergen.id.toString())
      const result = await updateAllergen(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(activeTab === "allergen" ? "Allergen aktualisiert" : "Zusatzstoff aktualisiert")
      }
    } else {
      const result = await createAllergen(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(activeTab === "allergen" ? "Allergen erstellt" : "Zusatzstoff erstellt")
      }
    }

    await loadAllergens()
    setShowDialog(false)
    setEditingAllergen(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const itemType = activeTab === "allergen" ? "Allergen" : "Zusatzstoff"
    if (confirm(`${itemType} löschen? Es wird auch von allen Gerichten entfernt.`)) {
      await deleteAllergen(id)
      toast.success(`${itemType} gelöscht`)
      await loadAllergens()
    }
  }

  async function handleBulkCreate(type: "allergen" | "additive") {
    const data = type === "allergen" ? EU_ALLERGENS : COMMON_ADDITIVES
    const itemName = type === "allergen" ? "Allergene" : "Zusatzstoffe"
    
    if (!confirm(`Alle ${data.length} Standard-${itemName} hinzufügen? Bereits vorhandene werden übersprungen.`)) {
      return
    }

    setSaving(true)
    const result = await bulkCreateAllergens(type, data)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${result.created} ${itemName} hinzugefügt, ${result.skipped} bereits vorhanden`)
    }
    
    await loadAllergens()
    setSaving(false)
  }

  function openAddDialog(type: "allergen" | "additive") {
    setActiveTab(type)
    setEditingAllergen(null)
    setShowDialog(true)
  }

  function openEditDialog(item: Allergen) {
    setActiveTab(item.type)
    setEditingAllergen(item)
    setShowDialog(true)
  }

  function renderTable(items: Allergen[], type: "allergen" | "additive") {
    const isAllergen = type === "allergen"
    const emptyIcon = isAllergen ? (
      <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
    ) : (
      <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
    )
    const emptyText = isAllergen ? "Noch keine Allergene definiert" : "Noch keine Zusatzstoffe definiert"
    const addText = isAllergen ? "Erstes Allergen hinzufügen" : "Ersten Zusatzstoff hinzufügen"

    if (loading) {
      return <p className="text-center text-muted-foreground py-4">Laden...</p>
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          {emptyIcon}
          <p className="text-muted-foreground mb-4">{emptyText}</p>
          <Button variant="outline" onClick={() => openAddDialog(type)}>
            <Plus className="mr-2 h-4 w-4" />
            {addText}
          </Button>
        </div>
      )
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Kürzel</th>
              <th className="text-left p-3 font-medium">Bezeichnung</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Beschreibung</th>
              <th className="text-right p-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <span
                    className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 font-mono font-bold rounded ${
                      isAllergen
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {item.code}
                  </span>
                </td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{item.description || "-"}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Allergene & Zusatzstoffe</h2>
        <p className="text-muted-foreground">
          Verwalte Allergene (Pflichtangaben) und Zusatzstoffe getrennt für deine Gerichte
        </p>
      </div>

      <Tabs defaultValue="allergen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="allergen" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Allergene ({allergensOnly.length})
          </TabsTrigger>
          <TabsTrigger value="additive" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Zusatzstoffe ({additivesOnly.length})
          </TabsTrigger>
        </TabsList>

        {/* Allergene Tab */}
        <TabsContent value="allergen">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Allergene (Pflichtangaben)
                </CardTitle>
                <CardDescription>
                  Allergene gemäß EU-Verordnung 1169/2011 - müssen auf der Speisekarte gekennzeichnet werden
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkCreate("allergen")} disabled={saving}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Alle 14 hinzufügen
                </Button>
                <Button size="sm" onClick={() => openAddDialog("allergen")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Einzeln hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderTable(allergensOnly, "allergen")}

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-400">
                  14 Hauptallergene (EU-Verordnung):
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <span>A - Gluten</span>
                  <span>B - Krebstiere</span>
                  <span>C - Eier</span>
                  <span>D - Fisch</span>
                  <span>E - Erdnüsse</span>
                  <span>F - Soja</span>
                  <span>G - Milch/Laktose</span>
                  <span>H - Schalenfrüchte</span>
                  <span>I - Sellerie</span>
                  <span>J - Senf</span>
                  <span>K - Sesam</span>
                  <span>L - Sulfite</span>
                  <span>M - Lupinen</span>
                  <span>N - Weichtiere</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zusatzstoffe Tab */}
        <TabsContent value="additive">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                  Zusatzstoffe
                </CardTitle>
                <CardDescription>
                  Zusatzstoffe gemäß Zusatzstoff-Zulassungsverordnung - werden üblicherweise mit Nummern gekennzeichnet
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkCreate("additive")} disabled={saving}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Alle 20 hinzufügen
                </Button>
                <Button size="sm" onClick={() => openAddDialog("additive")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Einzeln hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderTable(additivesOnly, "additive")}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-400">Gängige Zusatzstoffe (1-20):</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span>1 - mit Farbstoff</span>
                  <span>2 - mit Konservierungsstoff</span>
                  <span>3 - mit Antioxidationsmittel</span>
                  <span>4 - mit Geschmacksverstärker</span>
                  <span>5 - geschwefelt</span>
                  <span>6 - geschwärzt</span>
                  <span>7 - gewachst</span>
                  <span>8 - mit Phosphat</span>
                  <span>9 - mit Süßungsmittel</span>
                  <span>10 - enthält Phenylalaninquelle</span>
                  <span>11 - koffeinhaltig</span>
                  <span>12 - chininhaltig</span>
                  <span>13 - mit Nitritpökelsalz</span>
                  <span>14 - mit Milcheiweiß</span>
                  <span>15 - gentechnisch verändert</span>
                  <span>16 - mit Taurin</span>
                  <span>17 - mit Säuerungsmittel</span>
                  <span>18 - mit Stabilisator</span>
                  <span>19 - mit Emulgator</span>
                  <span>20 - mit Trennmittel</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeTab === "allergen" ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  {editingAllergen ? "Allergen bearbeiten" : "Neues Allergen"}
                </>
              ) : (
                <>
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                  {editingAllergen ? "Zusatzstoff bearbeiten" : "Neuer Zusatzstoff"}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "allergen"
                ? "Definiere ein Kürzel (z.B. A-N) und eine Bezeichnung für das Allergen."
                : "Definiere ein Kürzel (z.B. 1-12) und eine Bezeichnung für den Zusatzstoff."}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kürzel *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingAllergen?.code || ""}
                  placeholder={activeTab === "allergen" ? "A, B, ..." : "1, 2, ..."}
                  maxLength={20}
                  required
                  className="font-mono uppercase"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Bezeichnung *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingAllergen?.name || ""}
                  placeholder={activeTab === "allergen" ? "z.B. Gluten" : "z.B. mit Farbstoff"}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingAllergen?.description || ""}
                placeholder="Zusätzliche Informationen..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Speichern..." : editingAllergen ? "Aktualisieren" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
