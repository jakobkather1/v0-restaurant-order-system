"use client"

import { useState, useEffect } from "react"
import type { MenuItem, ItemVariant, Topping, CartItem, Allergen } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, AlertTriangle, FlaskConical, X, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"

interface ItemDialogProps {
  item: MenuItem
  variants: ItemVariant[]
  toppings: Topping[]
  primaryColor: string
  backgroundColor?: string
  textColor?: string
  editingItem: CartItem | null
  onAdd: (item: CartItem) => void
  onClose: () => void
  allergens?: Allergen[]
  dishAllergens?: Record<number, number[]>
}

function naturalSort(a: string, b: string): number {
  const aNum = Number.parseInt(a, 10)
  const bNum = Number.parseInt(b, 10)
  const aIsNum = !isNaN(aNum) && String(aNum) === a
  const bIsNum = !isNaN(bNum) && String(bNum) === b

  if (aIsNum && bIsNum) {
    return aNum - bNum
  }
  if (aIsNum) return 1
  if (bIsNum) return -1
  return a.localeCompare(b)
}

export function ItemDialog({
  item,
  variants,
  toppings,
  primaryColor,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  editingItem,
  onAdd,
  onClose,
  allergens = [],
  dishAllergens = {},
}: ItemDialogProps) {
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(editingItem?.variant || null)
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>(editingItem?.toppings || [])
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1)
  const [notes, setNotes] = useState(editingItem?.notes || "")
  const [allergensOpen, setAllergensOpen] = useState(false)

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0])
    }
  }, [variants, selectedVariant])

  function getDishAllergenInfo(): { allergenItems: Allergen[]; additiveItems: Allergen[] } {
    const allergenIds = dishAllergens[item.id] || []
    if (allergenIds.length === 0) return { allergenItems: [], additiveItems: [] }

    const allergenItems = allergenIds
      .map((id) => allergens.find((a) => a.id === id))
      .filter((a): a is Allergen => a !== undefined)

    const allergenList = allergenItems
      .filter((a) => a.type === "allergen" || !a.type)
      .sort((a, b) => naturalSort(a.code, b.code))

    const additiveList = allergenItems.filter((a) => a.type === "additive").sort((a, b) => naturalSort(a.code, b.code))

    return { allergenItems: allergenList, additiveItems: additiveList }
  }

  const { allergenItems, additiveItems } = getDishAllergenInfo()
  const hasAllergenInfo = allergenItems.length > 0 || additiveItems.length > 0

  function toggleTopping(topping: Topping) {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id))
    } else {
      setSelectedToppings([...selectedToppings, topping])
    }
  }

  function getToppingPrice(topping: Topping): number {
    if (selectedVariant && topping.price_variants && topping.price_variants.length > 0) {
      const variantPrice = topping.price_variants.find(
        (pv) => pv.variant_name.toLowerCase() === selectedVariant.name.toLowerCase(),
      )
      if (variantPrice) {
        return Number(variantPrice.price)
      }
    }
    return Number(topping.price)
  }

  function calculatePrice() {
    let price = Number(item.base_price)
    if (selectedVariant) {
      price += Number(selectedVariant.price_modifier)
    }
    for (const topping of selectedToppings) {
      price += getToppingPrice(topping)
    }
    return price
  }

  function handleAdd() {
    const toppingPrices: Record<number, number> = {}
    for (const topping of selectedToppings) {
      toppingPrices[topping.id] = getToppingPrice(topping)
    }

    const cartItem: CartItem = {
      menuItem: item,
      variant: selectedVariant,
      toppings: selectedToppings,
      toppingPrices,
      quantity,
      notes,
      totalPrice: calculatePrice(),
    }
    onAdd(cartItem)
  }

  const totalPrice = calculatePrice() * quantity

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:max-w-md max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)] overflow-y-auto p-0 gap-0 rounded-2xl sm:rounded-xl w-[calc(100%-2rem)] sm:w-full shadow-2xl border"
        style={{ backgroundColor, color: textColor }}
      >
        <DialogHeader 
          className="p-4 sm:p-6 pb-2 sm:pb-4 sticky top-0 z-10 border-b rounded-t-2xl sm:rounded-t-xl backdrop-blur-sm"
          style={{ backgroundColor: `color-mix(in srgb, ${backgroundColor} 95%, transparent)` }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl pr-8">{item.name}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Schließen</span>
            </Button>
          </div>
          <DialogDescription className="sr-only">Gericht konfigurieren und zum Warenkorb hinzufügen</DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
          {item.image_url && (
            <div className="relative w-full h-32 sm:h-40 -mt-2">
              <Image
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-cover rounded-lg"
                loading="lazy"
                quality={80}
              />
            </div>
          )}

          {item.description && <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>}

          {hasAllergenInfo && (
            <Collapsible open={allergensOpen} onOpenChange={setAllergensOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full rounded-lg border p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-sm">Allergene & Zusatzstoffe</span>
                    <Badge variant="secondary" className="text-xs">
                      {allergenItems.length + additiveItems.length}
                    </Badge>
                  </div>
                  {allergensOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-3 rounded-lg border p-3 sm:p-4 bg-muted/20">
                  {allergenItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-sm">Allergene</span>
                      </div>
                      <div className="space-y-1">
                        {allergenItems.map((allergen) => (
                          <div key={allergen.id} className="flex items-start gap-2 text-xs sm:text-sm">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                              {allergen.code}
                            </Badge>
                            <span className="text-muted-foreground">{allergen.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {additiveItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Zusatzstoffe</span>
                      </div>
                      <div className="space-y-1">
                        {additiveItems.map((additive) => (
                          <div key={additive.id} className="flex items-start gap-2 text-xs sm:text-sm">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                              {additive.code}
                            </Badge>
                            <span className="text-muted-foreground">{additive.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {variants.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">Größe auswählen</Label>
              <RadioGroup
                value={selectedVariant?.id.toString()}
                onValueChange={(v) => setSelectedVariant(variants.find((x) => x.id === Number.parseInt(v)) || null)}
              >
                {variants.map((variant) => {
                  const price = Number(item.base_price) + Number(variant.price_modifier)
                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between rounded-lg border p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={variant.id.toString()} id={`variant-${variant.id}`} />
                        <Label htmlFor={`variant-${variant.id}`} className="cursor-pointer text-sm sm:text-base">
                          {variant.name}
                        </Label>
                      </div>
                      <span className="font-medium text-sm sm:text-base">{price.toFixed(2)}€</span>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          )}

          {toppings.length > 0 && item.toppings_allowed && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">Extras hinzufügen</Label>
              <div className="space-y-2">
                {toppings
                  .filter((topping) => {
                    // If item has variants, only show toppings that have a price for the selected variant
                    if (variants.length > 0 && selectedVariant) {
                      // If topping has price_variants, check if it has a price for this variant
                      if (topping.price_variants && topping.price_variants.length > 0) {
                        return topping.price_variants.some(
                          (pv) => pv.variant_name.toLowerCase() === selectedVariant.name.toLowerCase()
                        )
                      }
                      // If topping doesn't have price_variants, it can be used with any variant
                      return true
                    }
                    // If item has no variants, show all toppings
                    return true
                  })
                  .map((topping) => {
                    const toppingPrice = getToppingPrice(topping)
                    const isSelected = selectedToppings.some((t) => t.id === topping.id)
                    return (
                      <div
                        key={topping.id}
                        className={`flex items-center justify-between rounded-lg border p-3 sm:p-4 cursor-pointer transition-colors ${
                          isSelected ? "border-2 bg-muted/30" : "hover:bg-muted/50"
                        }`}
                        style={isSelected ? { borderColor: primaryColor } : {}}
                        onClick={() => toggleTopping(topping)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                          <span className="text-sm sm:text-base">{topping.name}</span>
                        </div>
                        <span className="text-muted-foreground text-sm sm:text-base">+{toppingPrice.toFixed(2)}€</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm sm:text-base">
              Anmerkungen (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. ohne Zwiebeln, extra scharf..."
              rows={2}
              className="text-sm sm:text-base resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm sm:text-base font-medium">Menge</Label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 sm:h-9 sm:w-9"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-base sm:text-lg font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 sm:h-9 sm:w-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-4 sm:p-6 pt-4 bg-background border-t rounded-b-2xl sm:rounded-b-xl">
          <Button
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
            style={{ backgroundColor: primaryColor }}
            onClick={handleAdd}
          >
            {editingItem ? "Änderungen speichern" : "Hinzufügen"} • {totalPrice.toFixed(2)}€
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
