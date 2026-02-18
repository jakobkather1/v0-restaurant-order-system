import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

interface MenuItem {
  name: string
  description?: string
  prices: Array<{ size: string; price: number }>
  toppingsAllowed: boolean
  allergens?: string[]
}

interface Category {
  name: string
  description?: string
  items: MenuItem[]
}

interface Topping {
  name: string
  price: number
}

interface MenuData {
  categories: Category[]
  toppings: Topping[]
}

export async function POST(req: Request) {
  try {
    const { restaurantId, menuData } = (await req.json()) as {
      restaurantId: number
      menuData: MenuData
    }

    if (!restaurantId || !menuData) {
      return NextResponse.json(
        { error: "Restaurant ID und Menu Daten sind erforderlich" },
        { status: 400 }
      )
    }

    console.log("[v0] Starting menu import for restaurant:", restaurantId)

    // Import toppings first - get existing toppings
    const toppingMap = new Map<string, number>()
    
    const existingToppingsResult = await sql`
      SELECT id, name FROM toppings WHERE restaurant_id = ${restaurantId}
    `
    const existingToppings = new Map<string, number>()
    for (const t of existingToppingsResult) {
      existingToppings.set(t.name.toLowerCase(), t.id)
    }

    for (const topping of menuData.toppings) {
      const existingToppingId = existingToppings.get(topping.name.toLowerCase())
      
      if (existingToppingId) {
        // Update existing topping
        await sql`
          UPDATE toppings 
          SET price = ${topping.price}
          WHERE id = ${existingToppingId}
        `
        toppingMap.set(topping.name, existingToppingId)
      } else {
        // Insert new topping
        const result = await sql`
          INSERT INTO toppings (restaurant_id, name, price, is_available)
          VALUES (${restaurantId}, ${topping.name}, ${topping.price}, true)
          RETURNING id
        `
        if (result[0]) {
          toppingMap.set(topping.name, result[0].id)
        }
      }
    }

    console.log("[v0] Imported", toppingMap.size, "toppings")

    // Get existing categories for this restaurant
    const existingCategoriesResult = await sql`
      SELECT id, name FROM categories WHERE restaurant_id = ${restaurantId}
    `
    const existingCategories = new Map<string, number>()
    for (const cat of existingCategoriesResult) {
      existingCategories.set(cat.name.toLowerCase(), cat.id)
    }

    console.log("[v0] Found", existingCategories.size, "existing categories")

    // Import categories and menu items
    let totalItems = 0
    let newCategories = 0
    let skippedDuplicates = 0
    
    for (let catIndex = 0; catIndex < menuData.categories.length; catIndex++) {
      const category = menuData.categories[catIndex]
      let categoryId: number

      // Check if category already exists
      const existingCategoryId = existingCategories.get(category.name.toLowerCase())

      if (existingCategoryId) {
        // Use existing category
        categoryId = existingCategoryId
        console.log("[v0] Reusing existing category:", category.name)

        // Update description and sort_order to match the scanned menu
        await sql`
          UPDATE categories 
          SET 
            description = ${category.description || null},
            sort_order = ${catIndex}
          WHERE id = ${categoryId}
        `
      } else {
        // Create new category
        const catResult = await sql`
          INSERT INTO categories (restaurant_id, name, sort_order, description)
          VALUES (${restaurantId}, ${category.name}, ${catIndex}, ${category.description || null})
          RETURNING id
        `

        if (!catResult[0]) continue

        categoryId = catResult[0].id
        newCategories++
        console.log("[v0] Created new category:", category.name)
      }

      // Intelligent variant analysis
      if (category.items.length > 0) {
        // Analyze all items to find all unique variants and their usage
        const allVariants = new Set<string>()
        const itemVariantMap = new Map<string, Set<string>>() // item name -> set of variant names
        
        for (const item of category.items) {
          const itemVariants = new Set<string>()
          for (const priceInfo of item.prices) {
            const variantName = priceInfo.size || "Standard"
            allVariants.add(variantName)
            itemVariants.add(variantName)
          }
          itemVariantMap.set(item.name, itemVariants)
        }

        // Check if all items have the same variants
        const firstItemVariants = Array.from(itemVariantMap.values())[0]
        const allItemsHaveSameVariants = Array.from(itemVariantMap.values()).every(variants => {
          if (variants.size !== firstItemVariants.size) return false
          return Array.from(variants).every(v => firstItemVariants.has(v))
        })

        console.log(`[v0] Category "${category.name}": ${allVariants.size} unique variants found, all items identical: ${allItemsHaveSameVariants}`)

        if (allVariants.size > 1 || (allVariants.size === 1 && !allVariants.has("Standard"))) {
          // Delete existing category variants
          await sql`DELETE FROM category_variants WHERE category_id = ${categoryId}`
          
          // Create category variants for ALL unique variants found
          const variantArray = Array.from(allVariants).sort()
          const firstItem = category.items[0]
          
          // Use first item's prices to calculate base price and modifiers
          const basePrice = Math.min(...firstItem.prices.map((p) => p.price))
          
          for (let varIndex = 0; varIndex < variantArray.length; varIndex++) {
            const variantName = variantArray[varIndex]
            
            // Find a price example for this variant from any item
            let priceModifier = 0
            for (const item of category.items) {
              const priceInfo = item.prices.find(p => (p.size || "Standard") === variantName)
              if (priceInfo) {
                const itemBasePrice = Math.min(...item.prices.map((p) => p.price))
                priceModifier = priceInfo.price - itemBasePrice
                break
              }
            }
            
            await sql`
              INSERT INTO category_variants (category_id, name, price_modifier, sort_order)
              VALUES (${categoryId}, ${variantName}, ${priceModifier}, ${varIndex})
            `
          }
          
          console.log(`[v0] Created ${variantArray.length} category variants for ${category.name}`)
        }
      }

      // Get existing menu items in this category with their IDs and current max sort_order
      const existingItemsResult = await sql`
        SELECT id, name, sort_order FROM menu_items 
        WHERE restaurant_id = ${restaurantId} AND category_id = ${categoryId}
        ORDER BY sort_order ASC
      `
      const existingItemsMap = new Map<string, { id: number; sort_order: number }>()
      let maxSortOrder = -1
      
      for (const item of existingItemsResult) {
        existingItemsMap.set(item.name.toLowerCase(), { id: item.id, sort_order: item.sort_order })
        if (item.sort_order > maxSortOrder) {
          maxSortOrder = item.sort_order
        }
      }

      // Create or update menu items for this category
      for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
        const item = category.items[itemIndex]
        const existingItem = existingItemsMap.get(item.name.toLowerCase())

        // Use the lowest price as base_price
        const basePrice = Math.min(...item.prices.map((p) => p.price))

        // Process allergens - convert string to array or null
        const allergensString = item.allergens && item.allergens.trim() !== "" 
          ? item.allergens 
          : null

        if (existingItem) {
          // Item exists - update it with new information from scan, keep existing sort_order
          console.log("[v0] Updating existing item:", item.name)
          
          await sql`
            UPDATE menu_items 
            SET 
              description = COALESCE(${item.description || null}, description),
              base_price = ${basePrice},
              toppings_allowed = ${item.toppingsAllowed}
            WHERE id = ${existingItem.id}
          `

          // Delete any old item_variants (they should use category_variants now)
          await sql`DELETE FROM item_variants WHERE menu_item_id = ${existingItem.id}`

          // Update variant usage for this item
          // Delete old usage records
          await sql`DELETE FROM item_variant_usage WHERE menu_item_id = ${existingItem.id}`
          
          // Add new variant usage records
          if (item.prices.length > 0) {
            const categoryVariantsResult = await sql`
              SELECT id, name FROM category_variants WHERE category_id = ${categoryId}
            `
            
            if (categoryVariantsResult.length > 0) {
              for (const priceInfo of item.prices) {
                const variantName = priceInfo.size || "Standard"
                const categoryVariant = categoryVariantsResult.find((cv: any) => cv.name === variantName)
                
                if (categoryVariant) {
                  await sql`
                    INSERT INTO item_variant_usage (menu_item_id, category_variant_id)
                    VALUES (${existingItem.id}, ${categoryVariant.id})
                    ON CONFLICT (menu_item_id, category_variant_id) DO NOTHING
                  `
                }
              }
            }
          }

          skippedDuplicates++
          continue
        }

        // Item doesn't exist - create it at the end (maxSortOrder + 1)
        maxSortOrder++
        const itemResult = await sql`
          INSERT INTO menu_items (
            restaurant_id, 
            category_id, 
            name, 
            description, 
            base_price, 
            toppings_allowed, 
            is_available, 
            sort_order
          )
          VALUES (
            ${restaurantId},
            ${categoryId},
            ${item.name},
            ${item.description || null},
            ${basePrice},
            ${item.toppingsAllowed},
            true,
            ${maxSortOrder}
          )
          RETURNING id
        `

        if (!itemResult[0]) continue

        const menuItemId = itemResult[0].id

        // Store which variants this specific item uses (if category has multiple variant types)
        if (item.prices.length > 0) {
          // Get all category variants for this category
          const categoryVariantsResult = await sql`
            SELECT id, name FROM category_variants WHERE category_id = ${categoryId}
          `
          
          if (categoryVariantsResult.length > 0) {
            // Map item's price variants to category variant IDs
            for (const priceInfo of item.prices) {
              const variantName = priceInfo.size || "Standard"
              const categoryVariant = categoryVariantsResult.find((cv: any) => cv.name === variantName)
              
              if (categoryVariant) {
                // Store that this item uses this specific variant
                await sql`
                  INSERT INTO item_variant_usage (menu_item_id, category_variant_id)
                  VALUES (${menuItemId}, ${categoryVariant.id})
                  ON CONFLICT (menu_item_id, category_variant_id) DO NOTHING
                `
              }
            }
            
            console.log(`[v0] Item "${item.name}" uses ${item.prices.length} of ${categoryVariantsResult.length} available variants`)
          }
        }

        totalItems++
      }
    }

    console.log("[v0] Menu import complete:", {
      newCategories,
      totalItems,
      toppings: toppingMap.size,
      updatedDuplicates: skippedDuplicates,
    })

    return NextResponse.json({
      success: true,
      imported: {
        categories: newCategories,
        items: totalItems,
        toppings: toppingMap.size,
        updated: skippedDuplicates,
      },
    })
  } catch (error) {
    console.error("[v0] Error importing menu:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Importieren der Speisekarte",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
