"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import type { Category, MenuItem, ItemVariant, Allergen, Restaurant, Topping } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"
import Image from "next/image"

interface MenuSectionProps {
  categories: Category[]
  menuItems: MenuItem[]
  variants: ItemVariant[]
  toppings: Topping[]
  restaurant: Restaurant
  primaryColor: string
  onSelectItem: (item: MenuItem) => void
  allergens?: Allergen[]
  dishAllergens?: Record<number, number[]>
  onCategoryBarStateChange?: (state: {
    categories: Category[]
    activeCategory: number | null
    scrollToCategory: (id: number) => void
    searchSectionRef: React.RefObject<HTMLDivElement>
    hasSearchQuery: boolean
  }) => void
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

export function CategoryBar({
  categories,
  activeCategory,
  primaryColor,
  restaurant,
  onScrollToCategory,
}: {
  categories: Category[]
  activeCategory: number | null
  primaryColor: string
  restaurant: Restaurant
  onScrollToCategory: (id: number) => void
}) {
  return (
    <div className="container mx-auto px-2 sm:px-3 md:px-4">
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 sm:-mx-3 sm:px-3 md:mx-0 md:px-0">
        <div className="flex gap-1.5 sm:gap-2 md:gap-2.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id
            const txtColor = restaurant.text_color || "#1f2937"
            
            return (
              <button
                key={cat.id}
                onClick={() => onScrollToCategory(cat.id)}
                className="flex-shrink-0 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-2 rounded-full text-xs sm:text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200 active:scale-95 touch-manipulation border shadow-sm"
                style={
                  isActive
                    ? { 
                        backgroundColor: primaryColor, 
                        color: "#ffffff",
                        borderColor: primaryColor 
                      }
                    : { 
                        backgroundColor: "#e5e7eb",
                        color: txtColor,
                        borderColor: "#d1d5db"
                      }
                }
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export interface MenuSectionHandle {
  extendedCategories: Category[]
  activeCategory: number | null
  scrollToCategory: (id: number) => void
  searchQuery: string
}

export function MenuSection({
  categories,
  menuItems,
  variants,
  toppings,
  restaurant,
  primaryColor,
  onSelectItem,
  allergens = [],
  dishAllergens = {},
  onCategoryBarStateChange,
}: MenuSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const getItemVariants = (itemId: number): ItemVariant[] => {
    return variants.filter((v) => v.menu_item_id === itemId)
  }

  const uncategorizedItems = menuItems.filter((item) => item.category_id === null || item.category_id === undefined)
  const hasUncategorized = uncategorizedItems.length > 0

  const extendedCategories = hasUncategorized
    ? [...categories, { id: -1, name: "Sonstiges", restaurant_id: 0, sort_order: 999 }]
    : categories

  const [activeCategory, setActiveCategory] = useState<number | null>(extendedCategories[0]?.id || null)
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const searchSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-category-id"))
            setActiveCategory(id)
          }
        })
      },
      { rootMargin: "-100px 0px -70% 0px" },
    )

    categoryRefs.current.forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [extendedCategories])

  function scrollToCategory(categoryId: number) {
    const el = categoryRefs.current.get(categoryId)
    if (el) {
      // Calculate dynamic offset based on actual CategoryBar height
      const categoryBarElement = document.querySelector('[data-category-bar="true"]')
      const categoryBarHeight = categoryBarElement?.getBoundingClientRect().height || 60
      const offset = categoryBarHeight + 16 // +16px for spacing
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

  // Expose category bar state to parent
  useEffect(() => {
    if (onCategoryBarStateChange) {
      onCategoryBarStateChange({
        categories: extendedCategories,
        activeCategory,
        scrollToCategory,
        searchSectionRef,
        hasSearchQuery: searchQuery.trim().length > 0,
      })
    }
  }, [extendedCategories, activeCategory, searchQuery, onCategoryBarStateChange])

  function getMinPrice(item: MenuItem) {
    const itemVariants = getItemVariants(item.id)
    if (itemVariants.length === 0) return Number(item.base_price)
    const minModifier = Math.min(...itemVariants.map((v) => Number(v.price_modifier)))
    return Number(item.base_price) + minModifier
  }

  function getCategoryItems(categoryId: number) {
    if (categoryId === -1) {
      return uncategorizedItems
    }
    return menuItems.filter((item) => item.category_id === categoryId)
  }

  function filterItems(items: MenuItem[]) {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.id.toString().includes(query),
    )
  }

  const visibleCategories = searchQuery.trim()
    ? extendedCategories.filter((cat) => filterItems(getCategoryItems(cat.id)).length > 0)
    : extendedCategories

  const totalResults = searchQuery.trim()
    ? visibleCategories.reduce((sum, cat) => sum + filterItems(getCategoryItems(cat.id)).length, 0)
    : 0

  function getDishAllergenCodes(itemId: number): { allergenCodes: string; additiveCodes: string } {
    const allergenIds = dishAllergens[itemId] || []
    if (allergenIds.length === 0) return { allergenCodes: "", additiveCodes: "" }

    const allergenItems = allergenIds
      .map((id) => allergens.find((a) => a.id === id))
      .filter((a): a is Allergen => a !== undefined)

    const allergenCodes = allergenItems
      .filter((a) => a.type === "allergen" || !a.type)
      .map((a) => a.code)
      .sort(naturalSort)
      .join(", ")

    const additiveCodes = allergenItems
      .filter((a) => a.type === "additive")
      .map((a) => a.code)
      .sort(naturalSort)
      .join(", ")

    return { allergenCodes, additiveCodes }
  }

  return (
    <section id="menu" className="relative">
      {/* Header Section: Search */}
      <div ref={searchSectionRef} className="pb-4 sm:pb-6">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-4 sm:mb-6 max-w-2xl mx-auto mt-4 sm:mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Gerichte durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-12 text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
                {totalResults} {totalResults === 1 ? "Ergebnis" : "Ergebnisse"} gefunden
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Section: Menu Items */}
      <div className="pb-6 sm:pb-8 md:pb-12 pt-4 sm:pt-6">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Menu Items */}
          <div className="space-y-8 sm:space-y-10">
            {visibleCategories.map((category) => {
              const categoryItems = filterItems(getCategoryItems(category.id))
              if (categoryItems.length === 0) return null

              return (
                <div
                  key={category.id}
                  ref={(el) => {
                    if (el) categoryRefs.current.set(category.id, el)
                  }}
                  data-category-id={category.id}
                >
        <div className="mb-3 sm:mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: primaryColor }}>
              {category.name}
                        {searchQuery.trim() && (
                          <span className="ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
                ({categoryItems.length})
              </span>
            )}
            </h2>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
          </div>
                  </div>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryItems.map((item) => {
                      const itemVariants = getItemVariants(item.id)
                      const minPrice = getMinPrice(item)

                      return (
                        <Card
                          key={item.id}
                          className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden active:scale-[0.98]"
                          onClick={() => onSelectItem(item)}
                          style={{ color: restaurant.text_color }}
                        >
                          {item.image_url && (
                <div className="aspect-[16/10] sm:aspect-video relative">
                  <Image
                    src={item.image_url || "/placeholder.svg"}
                    alt={`${item.name} - ${item.description || 'Gericht'} bei ${restaurant.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                    quality={70}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                              />
                            </div>
                          )}
                          <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base sm:text-lg">{item.name}</div>
                                {item.description && (
                                  <p className="text-[13px] sm:text-[15px] mt-1 line-clamp-2 opacity-70">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {itemVariants.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                      {itemVariants.length} Varianten
                                    </Badge>
                                  )}
                                  {item.toppings_allowed && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                      + Extras
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-sm sm:text-base" style={{ color: primaryColor }}>
                                  {itemVariants.length > 0 ? "ab " : ""}
                                  {minPrice.toFixed(2)}€
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {searchQuery.trim() && totalResults === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Search className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-4" />
            <p className="text-base sm:text-lg font-medium mb-2">Keine Gerichte gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Versuche es mit einem anderen Suchbegriff</p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Suche zurücksetzen
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
