import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Helper to detect transient errors
function isTransientError(error: unknown): boolean {
  const message = (error as Error)?.message || ""
  return (
    message.includes("Too Many") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("timeout") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("network")
  )
}

// Retry wrapper for database operations
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If it's a transient error and we have retries left, wait and retry
      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = 500 * Math.pow(2, attempt) // 500ms, 1000ms, 2000ms
        console.log(`[v0] Transient error, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Non-transient error or last attempt - throw
      throw error
    }
  }

  throw lastError
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { restaurantId, changes } = await request.json()

    if (!restaurantId || !Array.isArray(changes)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    console.log("[v0] Processing batch changes:", changes.length)

    // Process each change with retry logic
    for (const change of changes) {
      await withRetry(async () => {
        switch (change.type) {
          case "create_category": {
            const result = await sql`
              INSERT INTO categories (restaurant_id, name, description, sort_order, is_active, allow_toppings)
              VALUES (
                ${restaurantId},
                ${change.data.name},
                ${change.data.description || null},
                ${change.data.sort_order || 0},
                ${change.data.is_active !== false},
                ${change.data.allow_toppings || false}
              )
              RETURNING id
            `
            
            const categoryId = result[0].id
            
            // Create category variants if provided
            if (change.data.variants && change.data.variants.length > 0) {
              for (let i = 0; i < change.data.variants.length; i++) {
                const variant = change.data.variants[i]
                await sql`
                  INSERT INTO category_variants (category_id, name, price_modifier, topping_price, sort_order)
                  VALUES (${categoryId}, ${variant.name}, ${variant.priceModifier}, ${variant.toppingPrice || 0}, ${i})
                `
              }
            }
            break
          }

          case "update_category": {
            const updates = []
            const values = []

            if (change.data.name !== undefined) {
              updates.push(`name = $${values.length + 1}`)
              values.push(change.data.name)
            }
            if (change.data.description !== undefined) {
              updates.push(`description = $${values.length + 1}`)
              values.push(change.data.description)
            }
            if (change.data.is_active !== undefined) {
              updates.push(`is_active = $${values.length + 1}`)
              values.push(change.data.is_active)
            }
            if (change.data.sort_order !== undefined) {
              updates.push(`sort_order = $${values.length + 1}`)
              values.push(change.data.sort_order)
            }

            if (updates.length > 0) {
              values.push(change.id)
              values.push(restaurantId)
              await sql.query(
                `UPDATE categories SET ${updates.join(", ")} WHERE id = $${values.length - 1} AND restaurant_id = $${values.length}`,
                values
              )
            }
            
            // Update category variants if provided
            if (change.data.variants !== undefined) {
              // Delete old variants
              await sql`DELETE FROM category_variants WHERE category_id = ${change.id}`
              
              // Insert new variants
              if (change.data.variants.length > 0) {
                for (let i = 0; i < change.data.variants.length; i++) {
                  const variant = change.data.variants[i]
                  await sql`
                    INSERT INTO category_variants (category_id, name, price_modifier, topping_price, sort_order)
                    VALUES (${change.id}, ${variant.name}, ${variant.priceModifier}, ${variant.toppingPrice || 0}, ${i})
                  `
                }
              }
            }
            break
          }

          case "delete_category": {
            await sql`DELETE FROM menu_items WHERE category_id = ${change.id}`
            await sql`DELETE FROM categories WHERE id = ${change.id} AND restaurant_id = ${restaurantId}`
            break
          }

          case "create_item": {
            const result = await sql`
              INSERT INTO menu_items (
                restaurant_id, category_id, name, description, base_price, 
                image_url, is_available, is_featured, sort_order, toppings_allowed
              )
              VALUES (
                ${restaurantId},
                ${change.data.category_id},
                ${change.data.name},
                ${change.data.description || null},
                ${change.data.base_price},
                ${change.data.image_url || null},
                ${change.data.is_available !== false},
                ${change.data.is_featured || false},
                ${change.data.sort_order || 0},
                ${change.data.toppings_allowed || false}
              )
              RETURNING id
            `
            
            // Create variants for the new item
            if (change.variants && change.variants.length > 0) {
              const itemId = result[0].id
              for (let i = 0; i < change.variants.length; i++) {
                const variant = change.variants[i]
                await sql`
                  INSERT INTO item_variants (menu_item_id, name, price_modifier, sort_order)
                  VALUES (${itemId}, ${variant.name}, ${variant.price_modifier}, ${i})
                `
              }
            }
            break
          }

          case "update_item": {
            const updates = []
            const values = []

            if (change.data.name !== undefined) {
              updates.push(`name = $${values.length + 1}`)
              values.push(change.data.name)
            }
            if (change.data.description !== undefined) {
              updates.push(`description = $${values.length + 1}`)
              values.push(change.data.description)
            }
            if (change.data.base_price !== undefined) {
              updates.push(`base_price = $${values.length + 1}`)
              values.push(change.data.base_price)
            }
            if (change.data.is_available !== undefined) {
              updates.push(`is_available = $${values.length + 1}`)
              values.push(change.data.is_available)
            }
            if (change.data.sort_order !== undefined) {
              updates.push(`sort_order = $${values.length + 1}`)
              values.push(change.data.sort_order)
            }

            if (updates.length > 0) {
              values.push(change.id)
              values.push(restaurantId)
              await sql.query(
                `UPDATE menu_items SET ${updates.join(", ")} WHERE id = $${values.length - 1} AND restaurant_id = $${values.length}`,
                values
              )
            }

            // Update variants if provided
            if (change.variants !== undefined) {
              // Delete existing variants
              await sql`DELETE FROM item_variants WHERE menu_item_id = ${change.id}`
              
              // Insert new variants
              if (change.variants.length > 0) {
                for (let i = 0; i < change.variants.length; i++) {
                  const variant = change.variants[i]
                  await sql`
                    INSERT INTO item_variants (menu_item_id, name, price_modifier, sort_order)
                    VALUES (${change.id}, ${variant.name}, ${variant.price_modifier}, ${i})
                  `
                }
              }
            }
            break
          }

          case "delete_item": {
            // Variants are automatically deleted via CASCADE foreign key
            await sql`DELETE FROM menu_items WHERE id = ${change.id} AND restaurant_id = ${restaurantId}`
            break
          }

          case "reorder_categories": {
            console.log("[v0] Reordering categories:", change.order)
            for (let i = 0; i < change.order.length; i++) {
              await sql`
                UPDATE categories 
                SET sort_order = ${i}
                WHERE id = ${change.order[i]} AND restaurant_id = ${restaurantId}
              `
            }
            console.log("[v0] Categories reordered successfully")
            break
          }

          case "reorder_items": {
            console.log("[v0] Reordering items for category:", change.categoryId, change.order)
            for (let i = 0; i < change.order.length; i++) {
              await sql`
                UPDATE menu_items 
                SET sort_order = ${i}
                WHERE id = ${change.order[i]} AND restaurant_id = ${restaurantId}
              `
            }
            console.log("[v0] Items reordered successfully")
            break
          }

          case "create_topping": {
            const result = await sql`
              INSERT INTO toppings (restaurant_id, name, price)
              VALUES (${restaurantId}, ${change.data.name}, ${change.data.price})
              RETURNING id
            `
            
            const toppingId = result[0].id
            
            // Insert category relations if provided
            if (change.data.allowed_category_ids && change.data.allowed_category_ids.length > 0) {
              for (const categoryId of change.data.allowed_category_ids) {
                await sql`
                  INSERT INTO topping_categories (topping_id, category_id)
                  VALUES (${toppingId}, ${categoryId})
                `
              }
            }
            
            // Insert price variants if provided
            if (change.data.price_variants && change.data.price_variants.length > 0) {
              for (const variant of change.data.price_variants) {
                await sql`
                  INSERT INTO topping_price_variants (topping_id, variant_name, price)
                  VALUES (${toppingId}, ${variant.variant_name}, ${variant.price})
                `
              }
            }
            break
          }

          case "update_topping": {
            // Update topping base data
            await sql`
              UPDATE toppings 
              SET name = ${change.data.name}, price = ${change.data.price}
              WHERE id = ${change.id} AND restaurant_id = ${restaurantId}
            `
            
            // Update category relations if provided
            if (change.data.allowed_category_ids !== undefined) {
              // Delete existing relations
              await sql`DELETE FROM topping_categories WHERE topping_id = ${change.id}`
              
              // Insert new relations
              if (change.data.allowed_category_ids.length > 0) {
                for (const categoryId of change.data.allowed_category_ids) {
                  await sql`
                    INSERT INTO topping_categories (topping_id, category_id)
                    VALUES (${change.id}, ${categoryId})
                  `
                }
              }
            }
            
            // Update price variants if provided
            if (change.data.price_variants !== undefined) {
              // Delete existing variants
              await sql`DELETE FROM topping_price_variants WHERE topping_id = ${change.id}`
              
              // Insert new variants
              if (change.data.price_variants.length > 0) {
                for (const variant of change.data.price_variants) {
                  await sql`
                    INSERT INTO topping_price_variants (topping_id, variant_name, price)
                    VALUES (${change.id}, ${variant.variant_name}, ${variant.price})
                  `
                }
              }
            }
            break
          }

          case "delete_topping": {
            // Price variants are automatically deleted via CASCADE
            await sql`DELETE FROM toppings WHERE id = ${change.id} AND restaurant_id = ${restaurantId}`
            break
          }
        }
      })
    }

    // Revalidate the menu page
    revalidatePath(`/${params.slug}`)
    revalidatePath(`/${params.slug}/admin`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Batch save error:", error)
    return NextResponse.json(
      { error: "Failed to save changes" },
      { status: 500 }
    )
  }
}
