"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  GripVertical,
  Save,
  Search,
  AlertTriangle,
  Layers,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
} from "lucide-react"
import type { Category, MenuItem, ItemVariant, Topping, Allergen } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { MenuScanner } from "@/components/admin/menu-scanner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { getCategoryVariants, getRestaurantAllergens } from "@/app/[slug]/admin/actions"

interface MenuTabProps {
  slug: string
  restaurantId: number
  initialCategories?: Category[]
  initialMenuItems?: MenuItem[]
  initialVariants?: ItemVariant[]
  initialToppings?: Topping[]
}

type CategoryWithVariants = Category & {
  variants?: Array<{ name: string; priceModifier: number; toppingPrice?: number }>
}

type ToppingPriceVariant = {
  id?: number
  variant_name: string
  price: number
}

type ToppingWithCategories = Topping & {
  allowed_category_ids?: number[]
  price_variants?: ToppingPriceVariant[]
}

type ItemVariantType = {
  id?: number
  name: string
  price_modifier: number
  sort_order?: number
}

type MenuItemWithVariants = MenuItem & {
  variants?: ItemVariantType[]
}

type PendingChange =
  | { type: "create_category"; data: Partial<Category> & { variants?: Array<{ name: string; priceModifier: number; toppingPrice?: number }> } }
  | { type: "update_category"; id: number; data: Partial<Category> & { variants?: Array<{ name: string; priceModifier: number; toppingPrice?: number }> } }
  | { type: "delete_category"; id: number }
  | { type: "create_item"; data: Partial<MenuItem>; variants?: ItemVariantType[] }
  | { type: "update_item"; id: number; data: Partial<MenuItem>; variants?: ItemVariantType[] }
  | { type: "delete_item"; id: number }
  | { type: "create_item_variant"; itemId: number; data: ItemVariantType }
  | { type: "update_item_variant"; id: number; itemId: number; data: ItemVariantType }
  | { type: "delete_item_variant"; id: number; itemId: number }
  | { type: "create_topping"; data: Partial<ToppingWithCategories> }
  | { type: "update_topping"; id: number; data: Partial<ToppingWithCategories> }
  | { type: "delete_topping"; id: number }
  | { type: "reorder_categories"; order: number[] }
  | { type: "reorder_items"; categoryId: number; order: number[] }

export function MenuTabV2({
  slug,
  restaurantId,
  initialCategories = [],
  initialMenuItems = [],
  initialVariants = [],
  initialToppings = [],
}: MenuTabProps) {
  const router = useRouter()

  // Local state for all menu data
  const [categories, setCategories] = useState<CategoryWithVariants[]>(initialCategories)
  const [menuItems, setMenuItems] = useState<MenuItemWithVariants[]>(initialMenuItems)
  const [toppings, setToppings] = useState<ToppingWithCategories[]>(initialToppings)
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [itemVariants, setItemVariants] = useState<Record<number, ItemVariantType[]>>({})

  // Pending changes queue
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // UI State
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showToppingDialog, setShowToppingDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithVariants | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingTopping, setEditingTopping] = useState<ToppingWithCategories | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")

  const hasUnsavedChanges = pendingChanges.length > 0

  // Load category variants, allergens, and item variants on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [allergensData, ...categoryVariantsData] = await Promise.all([
          getRestaurantAllergens(),
          ...initialCategories.map(cat => getCategoryVariants(cat.id))
        ])
        
        setAllergens(allergensData as Allergen[])
        
        // Set category variants
        const categoriesWithVariants = initialCategories.map((cat, idx) => ({
          ...cat,
          variants: categoryVariantsData[idx] as Array<{ name: string; priceModifier: number; toppingPrice?: number }>
        }))
        setCategories(categoriesWithVariants)

        // Load item variants for all menu items
        const variantsMap: Record<number, ItemVariantType[]> = {}
        for (const item of initialMenuItems) {
          try {
            const response = await fetch(`/api/admin/${slug}/menu/item/${item.id}/variants`)
            if (response.ok) {
              const variants = await response.json()
              if (Array.isArray(variants)) {
                variantsMap[item.id] = variants
              } else {
                console.warn(`[v0] Invalid variants data for item ${item.id}`)
                variantsMap[item.id] = []
              }
            } else {
              console.warn(`[v0] Failed to load variants for item ${item.id}:`, response.status)
              variantsMap[item.id] = []
            }
          } catch (error) {
            console.error(`[v0] Error loading variants for item ${item.id}:`, error)
            variantsMap[item.id] = []
          }
        }
        setItemVariants(variantsMap)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast.error("Fehler beim Laden der Menüdaten. Bitte Seite neu laden.")
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add change to queue
  const queueChange = (change: PendingChange) => {
    setPendingChanges((prev) => [...prev, change])
  }

  // Get items for a specific category
  const getItemsForCategory = (categoryId: number) => {
    return menuItems
      .filter(item => item.category_id === categoryId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter(cat => {
        if (searchQuery) {
          return cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [categories, searchQuery])

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Save all pending changes
  const handleSaveAll = async () => {
    if (pendingChanges.length === 0) {
      toast.info("Keine Änderungen zum Speichern")
      return
    }
    
    setIsSaving(true)
    try {
      console.log("[v0] Saving changes:", pendingChanges)
      
      const response = await fetch(`/api/admin/${slug}/menu/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          changes: pendingChanges,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
        throw new Error(errorData.error || "Fehler beim Speichern")
      }
      
      const result = await response.json()
      console.log("[v0] Save successful:", result)
      
      // Clear pending changes
      setPendingChanges([])
      
      // Show success message
      toast.success(`${pendingChanges.length} Änderung${pendingChanges.length === 1 ? '' : 'en'} erfolgreich gespeichert!`)
      
      // Soft refresh - only revalidate server components without full page reload
      // This preserves the current state while updating cached data
      router.refresh()
    } catch (error) {
      console.error("[v0] Save error:", error)
      const message = error instanceof Error ? error.message : "Fehler beim Speichern der Änderungen"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  // Discard all changes
  const handleDiscardAll = () => {
    if (pendingChanges.length === 0) return
    
    if (!confirm(`Möchten Sie wirklich alle ${pendingChanges.length} Änderung${pendingChanges.length === 1 ? '' : 'en'} verwerfen?`)) {
      return
    }
    
    setCategories(initialCategories)
    setMenuItems(initialMenuItems)
    setToppings(initialToppings)
    setPendingChanges([])
    toast.info("Änderungen verworfen")
    router.refresh()
  }

  // Category operations
  const handleCreateCategory = (data: { 
    name: string; 
    description?: string; 
    variants: Array<{ name: string; priceModifier: number; toppingPrice?: number }>;
  }) => {
    const tempId = Date.now()
    const newCategory: CategoryWithVariants = {
      id: tempId,
      restaurant_id: restaurantId,
      name: data.name,
      description: data.description || null,
      sort_order: categories.length,
      is_active: true,
      allow_toppings: false,
      variants: data.variants,
    }
    
    setCategories((prev) => [...prev, newCategory])
    queueChange({ 
      type: "create_category", 
      data: { 
        ...newCategory, 
        variants: data.variants
      } 
    })
    setShowCategoryDialog(false)
    toast.success("Kategorie wird beim Speichern erstellt")
  }
  
  const handleUpdateCategory = (id: number, updates: Partial<CategoryWithVariants>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    )
    queueChange({ type: "update_category", id, data: updates })
    toast.success("Änderung wird beim Speichern übernommen")
  }

  const handleDeleteCategory = (id: number) => {
    if (menuItems.some(item => item.category_id === id)) {
      toast.error("Kategorie hat noch Gerichte. Bitte zuerst Gerichte löschen.")
      return
    }
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    queueChange({ type: "delete_category", id })
    toast.success("Kategorie wird beim Speichern gelöscht")
  }

  // Menu item operations
  const handleCreateItem = (itemData: Partial<MenuItem>, variants?: ItemVariantType[]) => {
    const tempId = Date.now()
    const category = categories.find(c => c.id === itemData.category_id)
    const categoryItems = getItemsForCategory(itemData.category_id!)
    
    const newItem: MenuItemWithVariants = {
      id: tempId,
      restaurant_id: restaurantId,
      category_id: itemData.category_id!,
      name: itemData.name!,
      description: itemData.description || null,
      base_price: itemData.base_price!,
      image_url: itemData.image_url || null,
      is_available: true,
      is_featured: false,
      sort_order: categoryItems.length,
      toppings_allowed: false,
      allergen_info: null,
      variants: variants || [],
    }

    setMenuItems((prev) => [...prev, newItem])
    if (variants && variants.length > 0) {
      setItemVariants((prev) => ({ ...prev, [tempId]: variants }))
    }
    queueChange({ type: "create_item", data: newItem, variants })
    setShowItemDialog(false)
    toast.success("Gericht wird beim Speichern erstellt")
  }

  const handleUpdateItem = (id: number, updates: Partial<MenuItem>, variants?: ItemVariantType[]) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
    if (variants !== undefined) {
      setItemVariants((prev) => ({ ...prev, [id]: variants }))
    }
    queueChange({ type: "update_item", id, data: updates, variants })
    toast.success("Änderung wird beim Speichern übernommen")
  }

  const handleDeleteItem = (id: number) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
    setItemVariants((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
    queueChange({ type: "delete_item", id })
    toast.success("Gericht wird beim Speichern gelöscht")
  }

  // Topping operations
  const handleCreateTopping = (toppingData: { name: string; price: number; allowed_category_ids: number[]; price_variants?: ToppingPriceVariant[] }) => {
    const tempId = Date.now()
    const newTopping: ToppingWithCategories = {
      id: tempId,
      restaurant_id: restaurantId,
      name: toppingData.name,
      price: toppingData.price,
      is_available: true,
      allowed_category_ids: toppingData.allowed_category_ids,
      price_variants: toppingData.price_variants,
    }

    setToppings((prev) => [...prev, newTopping])
    queueChange({ type: "create_topping", data: newTopping })
    setShowToppingDialog(false)
    toast.success("Topping wird beim Speichern erstellt")
  }

  const handleUpdateTopping = (id: number, updates: Partial<ToppingWithCategories>) => {
    setToppings((prev) =>
      prev.map((topping) => (topping.id === id ? { ...topping, ...updates } : topping)),
    )
    queueChange({ type: "update_topping", id, data: updates })
    toast.success("Änderung wird beim Speichern übernommen")
  }

  const handleDeleteTopping = (id: number) => {
    setToppings((prev) => prev.filter((topping) => topping.id !== id))
    queueChange({ type: "delete_topping", id })
    toast.success("Topping wird beim Speichern gelöscht")
  }

  // Drag and drop handlers
  const handleDragEndCategory = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setCategories((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      
      // Update sort_order for all categories
      const updatedOrder = newOrder.map((cat, index) => ({
        ...cat,
        sort_order: index
      }))
      
      queueChange({
        type: "reorder_categories",
        order: updatedOrder.map((cat) => cat.id),
      })
      
      return updatedOrder
    })
  }

  const handleDragEndItem = (categoryId: number) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setMenuItems((items) => {
      const categoryItems = items.filter(item => item.category_id === categoryId)
      const oldIndex = categoryItems.findIndex((item) => item.id === active.id)
      const newIndex = categoryItems.findIndex((item) => item.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) return items
      
      const reorderedCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)
      
      // Update sort_order for reordered items
      const updatedCategoryItems = reorderedCategoryItems.map((item, index) => ({
        ...item,
        sort_order: index
      }))
      
      const otherItems = items.filter(item => item.category_id !== categoryId)
      
      queueChange({
        type: "reorder_items",
        categoryId,
        order: updatedCategoryItems.map((item) => item.id),
      })
      
      return [...otherItems, ...updatedCategoryItems].sort((a, b) => {
        if (a.category_id !== b.category_id) return (a.category_id || 0) - (b.category_id || 0)
        return (a.sort_order || 0) - (b.sort_order || 0)
      })
    })
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Speisekarte</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte Kategorien, Gerichte und Toppings. Änderungen werden erst beim Klick auf "Speichern" übernommen.
          </p>
        </div>
        <MenuScanner
          restaurantId={restaurantId}
          onImportComplete={() => {
            // Hard reload to get fresh data from server
            window.location.reload()
          }}
          slug={slug}
        />
      </div>

      {/* Toppings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Toppings</CardTitle>
              <CardDescription>Extras und Beläge für Gerichte</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingTopping(null)
              setShowToppingDialog(true)
            }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Topping hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {toppings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Noch keine Toppings</p>
          ) : (
            <div className="flex flex-wrap gap-2">
                {toppings.map((topping) => {
                  const toppingCategories = topping.allowed_category_ids && topping.allowed_category_ids.length > 0
                    ? categories.filter(cat => topping.allowed_category_ids!.includes(cat.id))
                    : []
                  
                  return (
                    <div key={topping.id} className="flex items-start gap-3 bg-gray-50 rounded-lg border p-3 min-w-[280px]">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{topping.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Standard-Preis: +{Number(topping.price).toFixed(2)}€
                        </p>
                        {toppingCategories.length > 0 ? (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Verfügbar in:</p>
                            <div className="flex flex-wrap gap-1">
                              {toppingCategories.map(cat => (
                                <span key={cat.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-green-600 mt-1">✓ Für alle Kategorien verfügbar</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingTopping(topping)
                          setShowToppingDialog(true)
                        }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTopping(topping.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories with nested items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kategorien & Gerichte</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingCategory(null)
                setShowCategoryDialog(true)
              }} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Kategorie
              </Button>
              <Button onClick={() => setShowItemDialog(true)} size="sm" disabled={categories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Gericht
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kategorien durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndCategory}
          >
            <SortableContext
              items={filteredCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    items={getItemsForCategory(category.id)}
                    sensors={sensors}
                    onEditCategory={() => {
                      setEditingCategory(category)
                      setShowCategoryDialog(true)
                    }}
                    onDeleteCategory={() => handleDeleteCategory(category.id)}
                    onToggleCategoryActive={() =>
                      handleUpdateCategory(category.id, {
                        is_active: !category.is_active,
                      })
                    }
                    onEditItem={(item) => setEditingItem(item)}
                    onDeleteItem={(id) => handleDeleteItem(id)}
                    onToggleItemAvailable={(id, available) =>
                      handleUpdateItem(id, { is_available: available })
                    }
                    onDragEndItem={handleDragEndItem(category.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {filteredCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "Keine Kategorien gefunden" : "Noch keine Kategorien"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Floating Save Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2">
          <Button
            size="lg"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="rounded-full shadow-lg h-12 sm:h-14 px-4 sm:px-6 min-w-[140px] sm:min-w-[160px]"
          >
            <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-bold text-sm sm:text-base">
              {isSaving ? "Speichert..." : "Speichern"}
            </span>
            <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs sm:text-sm">
              {pendingChanges.length}
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDiscardAll}
            disabled={isSaving}
            className="rounded-full shadow-lg text-xs sm:text-sm"
          >
            Verwerfen
          </Button>
        </div>
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={showCategoryDialog || !!editingCategory}
        onClose={() => {
          setShowCategoryDialog(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        toppings={toppings}
        onSave={(data) => {
          if (editingCategory) {
            handleUpdateCategory(editingCategory.id, data)
          } else {
            handleCreateCategory(data)
          }
          setEditingCategory(null)
          setShowCategoryDialog(false)
        }}
      />

      {/* Item Dialog */}
      {(showItemDialog || editingItem) && (
        <ItemDialog
          open={true}
          onClose={() => {
            setShowItemDialog(false)
            setEditingItem(null)
          }}
          item={editingItem}
          categories={categories}
          allergens={allergens}
          itemVariants={editingItem ? itemVariants[editingItem.id] : undefined}
          onSave={(itemData, variants) => {
            if (editingItem) {
              handleUpdateItem(editingItem.id, itemData, variants)
            } else {
              handleCreateItem(itemData, variants)
            }
            setEditingItem(null)
            setShowItemDialog(false)
          }}
        />
      )}

      {/* Topping Dialog */}
      {showToppingDialog && (
        <ToppingDialog
          open={true}
          onClose={() => {
            setShowToppingDialog(false)
            setEditingTopping(null)
          }}
          topping={editingTopping}
          categories={categories}
          onSave={(data) => {
            if (editingTopping) {
              handleUpdateTopping(editingTopping.id, data)
            } else {
              handleCreateTopping(data)
            }
            setEditingTopping(null)
            setShowToppingDialog(false)
          }}
        />
      )}
    </div>
  )
}

// Category Section with nested items
function CategorySection({
  category,
  items,
  sensors,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryActive,
  onEditItem,
  onDeleteItem,
  onToggleItemAvailable,
  onDragEndItem,
}: {
  category: CategoryWithVariants
  items: MenuItem[]
  sensors: any
  onEditCategory: () => void
  onDeleteCategory: () => void
  onToggleCategoryActive: () => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (id: number) => void
  onToggleItemAvailable: (id: number, available: boolean) => void
  onDragEndItem: (event: DragEndEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg overflow-hidden bg-gray-50"
    >
      {/* Category Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{category.name}</p>
            {category.variants && category.variants.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category.variants.length} Varianten
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {items.length} {items.length === 1 ? 'Gericht' : 'Gerichte'}
            </Badge>
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Einklappen
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ausklappen
            </>
          )}
        </Button>
        <Switch checked={category.is_active} onCheckedChange={onToggleCategoryActive} />
        <Button variant="ghost" size="sm" onClick={onEditCategory}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDeleteCategory}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      {/* Category Items */}
      {isExpanded && (
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Noch keine Gerichte in dieser Kategorie
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEndItem}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      category={category}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      onToggleAvailable={() => onToggleItemAvailable(item.id, !item.is_available)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

// Sortable Item Row Component
function ItemRow({
  item,
  category,
  onEdit,
  onDelete,
  onToggleAvailable,
}: {
  item: MenuItem
  category?: CategoryWithVariants
  onEdit: () => void
  onDelete: () => void
  onToggleAvailable: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-12 h-12 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {Number(item.base_price).toFixed(2)}€
          {item.description && ` • ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}`}
        </p>
      </div>
      <Switch checked={item.is_available} onCheckedChange={onToggleAvailable} />
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}

// Category Dialog with Variants
function CategoryDialog({
  open,
  onClose,
  category,
  toppings,
  onSave,
}: {
  open: boolean
  onClose: () => void
  category: CategoryWithVariants | null
  toppings: ToppingWithCategories[]
  onSave: (data: { 
    name: string; 
    description?: string; 
    variants: Array<{ name: string; priceModifier: number; toppingPrice?: number }>;
  }) => void
}) {
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [variants, setVariants] = useState<Array<{ name: string; priceModifier: number; toppingPrice?: number }>>(
    category?.variants || []
  )

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || "")
      setVariants(category.variants || [])
    } else {
      setName("")
      setDescription("")
      setVariants([])
    }
  }, [category])

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: "", priceModifier: 0, toppingPrice: 0 }])
  }

  const updateVariant = (index: number, field: 'name' | 'priceModifier' | 'toppingPrice', value: string) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, [field]: field === 'name' ? value : parseFloat(value) || 0 }
          : v
      )
    )
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
          <DialogDescription>
            Definiere Standard-Varianten, die automatisch auf alle Gerichte dieser Kategorie angewendet werden.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Pizza, Pasta" />
          </div>
          <div>
            <Label>Beschreibung (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung der Kategorie" />
          </div>

          {/* Variants Section */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <Label className="font-medium">Standard-Varianten</Label>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Variante
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Diese Varianten werden auf alle Gerichte dieser Kategorie angewendet. Der Toppingpreis gilt für alle Toppings dieser Variante.
            </p>

            {variants.length > 0 && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-[1fr,110px,110px,40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div>Name der Variante</div>
                  <div>Aufpreis (€)</div>
                  <div>Toppingpreis (€)</div>
                  <div></div>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr,110px,110px,40px] gap-2">
                    <Input
                      placeholder="z.B. Klein"
                      value={v.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={v.priceModifier || ''}
                      onChange={(e) => updateVariant(i, 'priceModifier', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={v.toppingPrice || ''}
                      onChange={(e) => updateVariant(i, 'toppingPrice', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              onSave({ 
                name, 
                description, 
                variants
              })
            }}
            disabled={!name.trim()}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Item Dialog
function ItemDialog({
  open,
  onClose,
  item,
  categories,
  allergens,
  itemVariants,
  onSave,
}: {
  open: boolean
  onClose: () => void
  item: MenuItemWithVariants | null
  categories: CategoryWithVariants[]
  allergens: Allergen[]
  itemVariants?: ItemVariantType[]
  onSave: (data: Partial<MenuItem>, variants?: ItemVariantType[]) => void
}) {
  const [name, setName] = useState(item?.name || "")
  const [categoryId, setCategoryId] = useState<string>(item?.category_id?.toString() || "")
  const [price, setPrice] = useState(item?.base_price?.toString() || "")
  const [description, setDescription] = useState(item?.description || "")
  const [imageUrl, setImageUrl] = useState(item?.image_url || "")
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([])
  const [dishVariants, setDishVariants] = useState<ItemVariantType[]>(itemVariants || item?.variants || [])

  useEffect(() => {
    if (item) {
      setName(item.name)
      setCategoryId(item.category_id?.toString() || "")
      setPrice(item.base_price?.toString() || "")
      setDescription(item.description || "")
      setImageUrl(item.image_url || "")
      // Use item's custom variants if they exist, otherwise use empty
      setDishVariants(itemVariants || item.variants || [])
    } else {
      setName("")
      setCategoryId("")
      setPrice("")
      setDescription("")
      setImageUrl("")
      setDishVariants([])
    }
  }, [item, itemVariants])

  const selectedCategory = categories.find(c => c.id === parseInt(categoryId))

  // When category changes, pre-populate with category's default variants (only for new items or if no custom variants exist)
  useEffect(() => {
    if (categoryId && selectedCategory?.variants) {
      // Only auto-populate if creating a new item or if the dish has no custom variants yet
      if (!item || (itemVariants && itemVariants.length === 0)) {
        const categoryVariants: ItemVariantType[] = selectedCategory.variants.map((v, index) => ({
          name: v.name,
          price_modifier: isNaN(v.priceModifier) ? 0 : v.priceModifier,
          sort_order: index
        }))
        setDishVariants(categoryVariants)
      }
    }
  }, [categoryId, selectedCategory, item, itemVariants])

  const addDishVariant = () => {
    setDishVariants([...dishVariants, { name: "", price_modifier: 0, sort_order: dishVariants.length }])
  }

  const removeDishVariant = (index: number) => {
    setDishVariants(dishVariants.filter((_, i) => i !== index))
  }

  const updateDishVariant = (index: number, field: 'name' | 'price_modifier', value: string | number) => {
    const updated = [...dishVariants]
    if (field === 'price_modifier') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      updated[index][field] = isNaN(numValue) ? 0 : numValue
    } else {
      updated[index][field] = value as string
    }
    setDishVariants(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Gericht bearbeiten" : "Neues Gericht"}</DialogTitle>
          <DialogDescription>
            {selectedCategory?.variants && selectedCategory.variants.length > 0
              ? `Dieses Gericht verwendet die Varianten der Kategorie "${selectedCategory.name}".`
              : "Wähle eine Kategorie mit Varianten aus."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Margherita" />
          </div>
          <div>
            <Label>Kategorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                    {cat.variants && cat.variants.length > 0 && ` (${cat.variants.length} Varianten)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Basispreis (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="z.B. 8.50"
            />
            {selectedCategory?.variants && selectedCategory.variants.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Die Kategorie-Varianten werden automatisch mit den definierten Aufpreisen angewendet.
              </p>
            )}
          </div>
          <div>
            <Label>Beschreibung (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Gerichts"
            />
          </div>
          <div>
            <Label>Bild-URL (optional)</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Dish-Specific Variants Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Gerichtsspezifische Varianten
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Diese Varianten gelten nur für dieses Gericht (z.B. verschiedene Größen oder Zubereitungen).
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDishVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Variante
              </Button>
            </div>

            {dishVariants.length > 0 && (
              <div className="space-y-2">
                {dishVariants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr,120px,40px] gap-2">
                    <Input
                      placeholder="Name (z.B. Klein, Mittel, Groß)"
                      value={v.name}
                      onChange={(e) => updateDishVariant(i, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Aufpreis (€)"
                      value={isNaN(v.price_modifier) ? '' : v.price_modifier}
                      onChange={(e) => updateDishVariant(i, 'price_modifier', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDishVariant(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {allergens.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Allergene & Zusatzstoffe
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {allergens.map((allergen) => (
                  <div key={allergen.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${allergen.id}`}
                      checked={selectedAllergenIds.includes(allergen.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAllergenIds([...selectedAllergenIds, allergen.id])
                        } else {
                          setSelectedAllergenIds(selectedAllergenIds.filter((id) => id !== allergen.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`allergen-${allergen.id}`}
                      className="text-sm cursor-pointer"
                    >
                      <span className="font-mono text-primary">{allergen.code}</span> - {allergen.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              onSave({
                name,
                category_id: parseInt(categoryId),
                base_price: parseFloat(price),
                description: description || null,
                image_url: imageUrl || null,
              }, dishVariants.length > 0 ? dishVariants : undefined)
            }}
            disabled={!name.trim() || !categoryId || !price}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Topping Dialog with category selection and variant pricing
function ToppingDialog({
  open,
  onClose,
  topping,
  categories,
  onSave,
}: {
  open: boolean
  onClose: () => void
  topping: ToppingWithCategories | null
  categories: CategoryWithVariants[]
  onSave: (data: { name: string; price: number; allowed_category_ids: number[]; price_variants?: ToppingPriceVariant[] }) => void
}) {
  const [name, setName] = useState(topping?.name || "")
  const [price, setPrice] = useState(topping?.price?.toString() || "")
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    topping?.allowed_category_ids || []
  )

  useEffect(() => {
    if (topping) {
      setName(topping.name)
      setPrice(topping.price?.toString() || "")
      setSelectedCategories(topping.allowed_category_ids || [])
    } else {
      setName("")
      setPrice("")
      setSelectedCategories([])
    }
  }, [topping])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{topping ? "Topping bearbeiten" : "Neues Topping"}</DialogTitle>
          <DialogDescription>
            Wähle aus, in welchen Kategorien dieses Topping verfügbar sein soll.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Extra Käse" />
          </div>
          <div>
            <Label>Standard-Preis (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="z.B. 1.50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Fallback-Preis. Variantenspezifische Preise werden in den Kategorieeinstellungen festgelegt.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Verfügbar in Kategorien</Label>
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategories.length} ausgewählt
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Wenn keine Kategorie ausgewählt ist, ist das Topping für alle verfügbar.
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <div 
                    key={category.id} 
                    className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white'
                    }`}
                  >
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category.id])
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                        }
                      }}
                    />
                    <label 
                      htmlFor={`cat-${category.id}`} 
                      className={`text-sm cursor-pointer flex-1 ${isSelected ? 'font-medium' : ''}`}
                    >
                      {category.name}
                    </label>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                )
              })}
            </div>
            {selectedCategories.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  Dieses Topping wird für alle Kategorien verfügbar sein
                </p>
              </div>
            )}
          </div>

          {/* Info box about category-based pricing */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Preise werden in Kategorien verwaltet</p>
                <p className="text-xs text-blue-700 mt-1">
                  Variantenspezifische Preise für dieses Topping werden in den Kategorieeinstellungen festgelegt. Der Standard-Preis dient als Fallback.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              onSave({
                name,
                price: parseFloat(price),
                allowed_category_ids: selectedCategories,
              })
            }}
            disabled={!name.trim() || !price}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
