"use server"

import { sql } from "@/lib/db"
import {
  verifyPassword,
  setRestaurantAdminSession,
  clearRestaurantAdminSession,
  getRestaurantAdminSession,
  hashPassword,
} from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Restaurant } from "@/lib/types"

export async function loginRestaurantAdmin(restaurantId: number, password: string) {
  console.log("[v0] loginRestaurantAdmin - Starting login for restaurant:", restaurantId)
  
  const result = await sql`SELECT admin_password_hash FROM restaurants WHERE id = ${restaurantId}`
  const restaurant = result[0]

  if (!restaurant?.admin_password_hash) {
    console.log("[v0] loginRestaurantAdmin - No password hash found")
    return { error: "Kein Passwort gesetzt" }
  }

  console.log("[v0] loginRestaurantAdmin - Verifying password...")
  const isValid = await verifyPassword(password, restaurant.admin_password_hash)
  
  if (!isValid) {
    console.log("[v0] loginRestaurantAdmin - Invalid password")
    return { error: "Ungültiges Passwort" }
  }

  console.log("[v0] loginRestaurantAdmin - Password valid, setting session...")
  await setRestaurantAdminSession(restaurantId)
  console.log("[v0] loginRestaurantAdmin - Session set successfully")
  
  return { success: true }
}

export async function logoutRestaurantAdmin(slug: string, isCustomDomain = false) {
  await clearRestaurantAdminSession()
  const redirectPath = isCustomDomain ? "/admin" : `/${slug}/admin`
  redirect(redirectPath)
}

export async function updateRestaurantSettings(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const restaurantId = session.restaurantId
  const name = formData.get("name") as string
  const slogan = formData.get("slogan") as string
  const bannerText = formData.get("bannerText") as string
  const address = formData.get("address") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const ownerName = formData.get("ownerName") as string
  const impressum = formData.get("impressum") as string
  const infoText = formData.get("infoText") as string
  const primaryColor = formData.get("primaryColor") as string
  const checkoutInfoText = formData.get("checkoutInfoText") as string
  const backgroundColor = formData.get("backgroundColor") as string
  const textColor = formData.get("textColor") as string

  // Get the restaurant slug for specific revalidation
  const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${restaurantId}`
  const slug = restaurantResult[0]?.slug

  await sql`
    UPDATE restaurants SET
      name = ${name},
      slogan = ${slogan || null},
      banner_text = ${bannerText || null},
      address = ${address || null},
      email = ${email || null},
      phone = ${phone || null},
      owner_name = ${ownerName || null},
      impressum = ${impressum || null},
      info_text = ${infoText || null},
      primary_color = ${primaryColor || "#0369a1"},
      checkout_info_text = ${checkoutInfoText || null},
      background_color = ${backgroundColor || "#ffffff"},
      text_color = ${textColor || "#1f2937"},
      updated_at = NOW()
    WHERE id = ${restaurantId}
  `

  // Revalidate the specific restaurant page and layout
  if (slug) {
    revalidatePath(`/${slug}`, "page")
    revalidatePath(`/${slug}/admin/dashboard`, "page")
  }
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateRestaurantImages(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const restaurantId = session.restaurantId
  const logoUrl = formData.get("logoUrl") as string
  const heroImageUrl = formData.get("heroImageUrl") as string

  await sql`
    UPDATE restaurants SET
      logo_url = ${logoUrl || null},
      hero_image_url = ${heroImageUrl || null},
      updated_at = NOW()
    WHERE id = ${restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateOpeningHours(hours: Record<string, { open: string; close: string }>) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  // Get the restaurant slug for specific revalidation
  const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${session.restaurantId}`
  const slug = restaurantResult[0]?.slug

  await sql`
    UPDATE restaurants SET
      opening_hours = ${JSON.stringify(hours)},
      updated_at = NOW()
    WHERE id = ${session.restaurantId}
  `

  // Revalidate all pages to show updated opening hours immediately
  revalidatePath("/", "layout")
  if (slug) {
    revalidatePath(`/${slug}`, "page")
    revalidatePath(`/${slug}/admin/dashboard`, "page")
  }
  
  return { success: true }
}

// Category actions
export async function createCategory(formData: FormData) {
  const session = await getRestaurantAdminSession()

  if (!session) return { error: "Nicht autorisiert" }

  const name = formData.get("name") as string

  if (!name) return { error: "Name erforderlich" }

  try {
    const result = await sql`
      INSERT INTO categories (restaurant_id, name, sort_order)
      VALUES (${session.restaurantId}, ${name}, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories WHERE restaurant_id = ${session.restaurantId}))
      RETURNING id
    `

    revalidatePath("/", "layout")
    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("Error creating category:", error)
    return { error: "Datenbankfehler" }
  }
}

export async function updateCategory(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null

  await sql`UPDATE categories SET name = ${name}, description = ${description} WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  
  const slugResult = await sql`SELECT slug FROM restaurants WHERE id = ${session.restaurantId}`
  const restaurantSlug = slugResult[0]?.slug
  
  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}`, "page")
    revalidatePath(`/${restaurantSlug}/admin/dashboard`, "page")
  }
  revalidatePath("/", "layout")
  
  return { success: true }
}

export async function deleteCategory(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM categories WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateCategorySortOrder(categoryIds: number[]) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  for (let i = 0; i < categoryIds.length; i++) {
    await sql`
      UPDATE categories SET sort_order = ${i}
      WHERE id = ${categoryIds[i]} AND restaurant_id = ${session.restaurantId}
    `
  }

  revalidatePath("/", "layout")
  return { success: true }
}

// Category variant management functions
export async function createCategoryVariant(
  categoryId: number,
  name: string,
  priceModifier: number,
  sortOrder: number,
) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const result = await sql`
    INSERT INTO category_variants (category_id, name, price_modifier, sort_order)
    VALUES (${categoryId}, ${name}, ${priceModifier}, ${sortOrder})
    RETURNING id
  `

  revalidatePath("/", "layout")
  return { success: true, id: result[0].id }
}

export async function updateCategoryVariants(
  categoryId: number,
  variants: Array<{ name: string; priceModifier: number }>,
) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  // Delete existing variants for this category
  await sql`DELETE FROM category_variants WHERE category_id = ${categoryId}`

  // Insert new variants
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    await sql`
      INSERT INTO category_variants (category_id, name, price_modifier, sort_order)
      VALUES (${categoryId}, ${variant.name}, ${variant.priceModifier}, ${i})
    `
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function getCategoryVariants(categoryId: number) {
  const result = await sql`
    SELECT * FROM category_variants 
    WHERE category_id = ${categoryId}
    ORDER BY sort_order ASC
  `
  // Map snake_case to camelCase
  return result.map((v: any) => ({
    name: v.name,
    priceModifier: v.price_modifier,
    toppingPrice: v.topping_price
  }))
}

// Menu item actions
export async function createMenuItem(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("categoryId") as string
  const basePrice = Number.parseFloat(formData.get("basePrice") as string)
  const toppingsAllowed = formData.get("toppingsAllowed") === "true"
  const isUpsell = formData.get("isUpsell") === "true"

  if (!name || isNaN(basePrice)) return { error: "Name und Preis erforderlich" }

  const parsedCategoryId = categoryId && categoryId !== "0" ? Number.parseInt(categoryId) : null

  const result = await sql`
    INSERT INTO menu_items (restaurant_id, category_id, name, description, base_price, toppings_allowed, is_upsell, sort_order)
    VALUES (
      ${session.restaurantId}, 
      ${parsedCategoryId}, 
      ${name}, 
      ${description || null}, 
      ${basePrice}, 
      ${toppingsAllowed}, 
      ${isUpsell},
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menu_items WHERE restaurant_id = ${session.restaurantId} AND category_id = ${parsedCategoryId})
    )
    RETURNING id
  `

  const newMenuItemId = result[0].id

  // Add variants if provided
  const variants = formData.get("variants") as string
  if (variants) {
    const variantList = JSON.parse(variants) as Array<{ name: string; priceModifier: number }>
    for (let i = 0; i < variantList.length; i++) {
      const v = variantList[i]
      await sql`
        INSERT INTO item_variants (menu_item_id, name, price_modifier, sort_order)
        VALUES (${newMenuItemId}, ${v.name}, ${v.priceModifier}, ${i})
      `
    }
  }

  revalidatePath("/", "layout")
  return { success: true, id: newMenuItemId }
}

export async function updateMenuItem(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("categoryId") as string
  const basePrice = Number.parseFloat(formData.get("basePrice") as string)
  const toppingsAllowed = formData.get("toppingsAllowed") === "true"
  const isUpsell = formData.get("isUpsell") === "true"
  const isAvailable = formData.get("isAvailable") === "true"

  const parsedCategoryId = categoryId && categoryId !== "0" ? Number.parseInt(categoryId) : null

  await sql`
    UPDATE menu_items SET
      name = ${name},
      description = ${description || null},
      category_id = ${parsedCategoryId},
      base_price = ${basePrice},
      toppings_allowed = ${toppingsAllowed},
      is_upsell = ${isUpsell},
      is_available = ${isAvailable},
      updated_at = NOW()
    WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `

  // Update variants
  const variants = formData.get("variants") as string
  if (variants) {
    await sql`DELETE FROM item_variants WHERE menu_item_id = ${id}`
    const variantList = JSON.parse(variants) as Array<{ name: string; priceModifier: number }>
    for (let i = 0; i < variantList.length; i++) {
      const v = variantList[i]
      await sql`
        INSERT INTO item_variants (menu_item_id, name, price_modifier, sort_order)
        VALUES (${id}, ${v.name}, ${v.priceModifier}, ${i})
      `
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteMenuItem(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM menu_items WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateMenuItemSortOrder(itemIds: number[]) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  for (let i = 0; i < itemIds.length; i++) {
    await sql`
      UPDATE menu_items SET sort_order = ${i}
      WHERE id = ${itemIds[i]} AND restaurant_id = ${session.restaurantId}
    `
  }

  revalidatePath("/", "layout")
  return { success: true }
}

// Topping actions
export async function createTopping(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const name = formData.get("name") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const priceVariantsJson = formData.get("priceVariants") as string

  if (!name) return { error: "Name erforderlich" }

  const result = await sql`
    INSERT INTO toppings (restaurant_id, name, price)
    VALUES (${session.restaurantId}, ${name}, ${price || 0})
    RETURNING id
  `

  if (priceVariantsJson) {
    try {
      const priceVariants = JSON.parse(priceVariantsJson) as Array<{ variantName: string; price: number }>
      for (const pv of priceVariants) {
        if (pv.variantName && pv.price > 0) {
          await sql`
            INSERT INTO topping_price_variants (topping_id, variant_name, price)
            VALUES (${result[0].id}, ${pv.variantName}, ${pv.price})
            ON CONFLICT (topping_id, variant_name) DO UPDATE SET price = ${pv.price}
          `
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateTopping(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const priceVariantsJson = formData.get("priceVariants") as string

  await sql`
    UPDATE toppings SET name = ${name}, price = ${price || 0}
    WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `

  // Update price variants
  if (priceVariantsJson) {
    try {
      // Delete existing variants
      await sql`DELETE FROM topping_price_variants WHERE topping_id = ${id}`

      const priceVariants = JSON.parse(priceVariantsJson) as Array<{ variantName: string; price: number }>
      for (const pv of priceVariants) {
        if (pv.variantName && pv.price > 0) {
          await sql`
            INSERT INTO topping_price_variants (topping_id, variant_name, price)
            VALUES (${id}, ${pv.variantName}, ${pv.price})
          `
        }
      }
    } catch {
      // Ignore errors if table doesn't exist
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteTopping(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM toppings WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

// Delivery zone actions
export async function createDeliveryZone(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const name = formData.get("name") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const minimumOrderValue = Number.parseFloat(formData.get("minimumOrderValue") as string)
  const postalCodes = (formData.get("postalCodes") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (!name) return { error: "Name erforderlich" }

  await sql`
    INSERT INTO delivery_zones (restaurant_id, name, price, postal_codes, minimum_order_value)
    VALUES (${session.restaurantId}, ${name}, ${price || 0}, ${postalCodes}, ${minimumOrderValue || 0})
  `

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateDeliveryZone(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const minimumOrderValue = Number.parseFloat(formData.get("minimumOrderValue") as string)
  const postalCodes = (formData.get("postalCodes") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  await sql`
    UPDATE delivery_zones SET name = ${name}, price = ${price || 0}, postal_codes = ${postalCodes}, minimum_order_value = ${minimumOrderValue || 0}
    WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteDeliveryZone(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM delivery_zones WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

// Delivery times actions
export async function updateDeliveryTimes(
  restaurantId: number,
  times: Array<{ delivery_zone_id: number | null; preparation_minutes: number }>
) {
  try {
    for (const time of times) {
      await sql`
        INSERT INTO delivery_times (restaurant_id, delivery_zone_id, preparation_minutes)
        VALUES (${restaurantId}, ${time.delivery_zone_id}, ${time.preparation_minutes})
        ON CONFLICT (restaurant_id, delivery_zone_id)
        DO UPDATE SET 
          preparation_minutes = ${time.preparation_minutes},
          updated_at = CURRENT_TIMESTAMP
      `
    }
    
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Error updating delivery times:", error)
    throw new Error("Failed to update delivery times")
  }
}

export async function updateRestaurantPreorders(
  restaurantId: number,
  acceptsPreorders: boolean
) {
  try {
    await sql`
      UPDATE restaurants
      SET accepts_preorders = ${acceptsPreorders}
      WHERE id = ${restaurantId}
    `
    
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Error updating preorders setting:", error)
    throw new Error("Failed to update preorders setting")
  }
}

export async function toggleManuallyClosed(
  restaurantId: number,
  manuallyClosed: boolean
) {
  try {
    await sql`
      UPDATE restaurants
      SET manually_closed = ${manuallyClosed}
      WHERE id = ${restaurantId}
    `
    
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Error updating manually closed status:", error)
    throw new Error("Failed to update manually closed status")
  }
}

// Discount code actions
export async function createDiscountCode(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const code = (formData.get("code") as string).toUpperCase()
  const discountType = formData.get("discountType") as "percentage" | "fixed"
  const discountValue = Number.parseFloat(formData.get("discountValue") as string)
  const minimumOrderValue = Number.parseFloat(formData.get("minimumOrderValue") as string) || 0

  if (!code || isNaN(discountValue)) return { error: "Code und Wert erforderlich" }

  try {
    await sql`
      INSERT INTO discount_codes (restaurant_id, code, discount_type, discount_value, minimum_order_value)
      VALUES (${session.restaurantId}, ${code}, ${discountType}, ${discountValue}, ${minimumOrderValue})
    `
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    return { error: "Code existiert bereits" }
  }
}

export async function toggleDiscountCode(id: number, isActive: boolean) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`
    UPDATE discount_codes SET is_active = ${isActive}
    WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deleteDiscountCode(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM discount_codes WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

// Order actions
export async function markOrderCompleted(orderId: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`
    UPDATE orders SET is_completed = true, status = 'completed', updated_at = NOW()
    WHERE id = ${orderId} AND restaurant_id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateOrderStatus(orderId: number, status: string, estimatedTime?: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  if (estimatedTime !== undefined) {
    await sql`
      UPDATE orders SET status = ${status}, estimated_time = ${estimatedTime}, updated_at = NOW()
      WHERE id = ${orderId} AND restaurant_id = ${session.restaurantId}
    `
  } else {
    await sql`
      UPDATE orders SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId} AND restaurant_id = ${session.restaurantId}
    `
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function setOrderEstimatedTime(orderId: number, minutes: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`
    UPDATE orders SET estimated_time = ${minutes}, updated_at = NOW()
    WHERE id = ${orderId} AND restaurant_id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

// Helper to get restaurant data for admin
export async function getRestaurantForAdmin(): Promise<Restaurant | null> {
  const session = await getRestaurantAdminSession()
  if (!session) return null

  const result = await sql`SELECT * FROM restaurants WHERE id = ${session.restaurantId}`
  return result[0] as Restaurant | null
}

// SEO settings update action with robust error handling
export async function updateSeoSettings(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert - bitte erneut einloggen" }
  }

  const seoTitle = (formData.get("seoTitle") as string)?.trim() || ""
  const seoDescription = (formData.get("seoDescription") as string)?.trim() || ""
  const geoLat = formData.get("geoLat") as string
  const geoLng = formData.get("geoLng") as string
  const googleBusinessUrl = (formData.get("googleBusinessUrl") as string)?.trim() || ""
  const priceRange = (formData.get("priceRange") as string) || "$$"
  const cuisineType = (formData.get("cuisineType") as string)?.trim() || ""
  const ogImage = (formData.get("ogImage") as string)?.trim() || ""
  const facebookUrl = (formData.get("facebookUrl") as string)?.trim() || ""
  const instagramUrl = (formData.get("instagramUrl") as string)?.trim() || ""

  const errors: string[] = []
  
  if (seoTitle && seoTitle.length > 70) {
    errors.push("SEO-Titel darf max. 70 Zeichen haben")
  }
  
  if (seoDescription && seoDescription.length > 160) {
    errors.push("Meta-Beschreibung darf max. 160 Zeichen haben")
  }
  
  if (geoLat && (isNaN(Number(geoLat)) || Number(geoLat) < -90 || Number(geoLat) > 90)) {
    errors.push("Breitengrad muss zwischen -90 und 90 liegen")
  }
  
  if (geoLng && (isNaN(Number(geoLng)) || Number(geoLng) < -180 || Number(geoLng) > 180)) {
    errors.push("Längengrad muss zwischen -180 und 180 liegen")
  }

  if (errors.length > 0) {
    return { error: errors.join(". ") }
  }

  try {
  await sql`
  UPDATE restaurants SET
  seo_title = ${seoTitle || null},
  seo_description = ${seoDescription || null},
  google_business_url = ${googleBusinessUrl || null},
  price_range = ${priceRange || "$$"},
  cuisine_type = ${cuisineType || null},
  facebook_url = ${facebookUrl || null},
  instagram_url = ${instagramUrl || null},
  updated_at = NOW()
  WHERE id = ${session.restaurantId}
  `
    
    if (geoLat || geoLng) {
      try {
        await sql`
          UPDATE restaurants SET
            geo_lat = ${geoLat ? Number.parseFloat(geoLat) : null},
            geo_lng = ${geoLng ? Number.parseFloat(geoLng) : null}
          WHERE id = ${session.restaurantId}
        `
      } catch {
        try {
          await sql`
            UPDATE restaurants SET
              latitude = ${geoLat ? Number.parseFloat(geoLat) : null},
              longitude = ${geoLng ? Number.parseFloat(geoLng) : null}
            WHERE id = ${session.restaurantId}
          `
        } catch (geoError) {
          console.error("Could not update geo coordinates:", geoError)
        }
      }
    }
    
    if (ogImage) {
      try {
        await sql`
          UPDATE restaurants SET og_image = ${ogImage || null}
          WHERE id = ${session.restaurantId}
        `
      } catch (ogError) {
        console.error("Could not update og_image:", ogError)
      }
    }
    
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
    console.error("SEO Update Error:", errorMessage, error)
    return { error: `Datenbankfehler: ${errorMessage}` }
  }
}

// AGBs/AVV acceptance
export async function acceptAgbAvv(slug: string) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    throw new Error("Nicht autorisiert")
  }

  try {
    await sql`
      UPDATE restaurants 
      SET 
        agb_accepted_at = NOW(),
        avv_accepted_at = NOW()
      WHERE id = ${session.restaurantId}
    `
    revalidatePath(`/${slug}/admin`, "layout")
    return { success: true }
  } catch (error) {
    console.error("Error accepting AGBs/AVV:", error)
    throw error
  }
}

// Review management actions
export async function getRestaurantReviews() {
  const session = await getRestaurantAdminSession()
  if (!session) return []

  try {
    const reviews = await sql`
      SELECT * FROM reviews 
      WHERE restaurant_id = ${session.restaurantId}
      ORDER BY created_at DESC
    `
    return reviews
  } catch {
    return []
  }
}

export async function approveReview(reviewId: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`
    UPDATE reviews SET is_approved = true
    WHERE id = ${reviewId} AND restaurant_id = ${session.restaurantId}
  `
  revalidatePath("/", "layout")
  return { success: true }
}

// SEO Footer settings update
export async function updateSeoFooterSettings(data: {
  seo_footer_enabled: boolean
  seo_footer_description: string | null
  seo_footer_delivery_areas: string[]
  seo_footer_popular_categories: string[]
  seo_footer_show_social_media: boolean
  seo_footer_show_payment_methods: boolean
}) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  console.log("[v0] Updating SEO footer with data:", data)

  try {
    // Get restaurant slug for revalidation
    const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${session.restaurantId}`
    const slug = restaurantResult[0]?.slug

    await sql`
      UPDATE restaurants SET
        seo_footer_enabled = ${data.seo_footer_enabled},
        seo_footer_description = ${data.seo_footer_description || null},
        seo_footer_delivery_areas = ${JSON.stringify(data.seo_footer_delivery_areas)},
        seo_footer_popular_categories = ${JSON.stringify(data.seo_footer_popular_categories)},
        seo_footer_show_social_media = ${data.seo_footer_show_social_media},
        seo_footer_show_payment_methods = ${data.seo_footer_show_payment_methods},
        updated_at = NOW()
      WHERE id = ${session.restaurantId}
    `

    console.log("[v0] SEO footer updated successfully")

    // Revalidate the specific restaurant page
    if (slug) {
      revalidatePath(`/${slug}`, "page")
      revalidatePath(`/${slug}/admin/dashboard`, "page")
    }
    revalidatePath("/", "layout")
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating SEO footer:", error)
    return { error: "Fehler beim Speichern der SEO Footer Einstellungen" }
  }
}

export async function deleteReview(reviewId: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`
    DELETE FROM reviews
    WHERE id = ${reviewId} AND restaurant_id = ${session.restaurantId}
  `
  revalidatePath("/", "layout")
  return { success: true }
}

// Legal settings update action
export async function updateLegalSettings(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const legalName = formData.get("legalName") as string
  const legalAddress = formData.get("legalAddress") as string
  const legalContact = formData.get("legalContact") as string
  const taxId = formData.get("taxId") as string
  const privacyPolicy = formData.get("privacyPolicy") as string
  const legalDisclaimer = formData.get("legalDisclaimer") as string

  try {
    await sql`
      UPDATE restaurants SET
        legal_name = ${legalName || null},
        legal_address = ${legalAddress || null},
        legal_contact = ${legalContact || null},
        tax_id = ${taxId || null},
        privacy_policy_content = ${privacyPolicy || null},
        legal_disclaimer = ${legalDisclaimer || null},
        updated_at = NOW()
      WHERE id = ${session.restaurantId}
    `
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Legal update error:", error)
    return { error: "Fehler beim Speichern" }
  }
}

// Revenue visibility toggle action
export async function updateRevenueVisibility(allowView: boolean, password: string | null) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  if (allowView) {
    await sql`
      UPDATE restaurants SET
        allow_super_admin_revenue_view = true,
        updated_at = NOW()
      WHERE id = ${session.restaurantId}
    `
    revalidatePath("/", "layout")
    return { success: true }
  }

  if (!password) {
    return { error: "Passwort erforderlich zum Deaktivieren" }
  }

  // Verify password against super_admin_restaurant_password
  const result = await sql`
    SELECT super_admin_restaurant_password FROM restaurants WHERE id = ${session.restaurantId}
  `
  const restaurant = result[0]

  if (!restaurant?.super_admin_restaurant_password) {
    return { error: "Kein Sicherheitspasswort vom Super-Admin gesetzt" }
  }

  // Compare password (stored as plain text by Super-Admin for simplicity)
  if (password !== restaurant.super_admin_restaurant_password) {
    return { error: "Ungültiges Passwort" }
  }

  await sql`
    UPDATE restaurants SET
      allow_super_admin_revenue_view = false,
      updated_at = NOW()
    WHERE id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

// Encrypted admin password action
export async function setEncryptedAdminPassword(password: string) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const hashedPassword = await hashPassword(password)

  await sql`
    UPDATE restaurants SET 
      encrypted_admin_password = ${hashedPassword},
      admin_password_set = true,
      updated_at = NOW()
    WHERE id = ${session.restaurantId}
  `

  revalidatePath("/", "layout")
  return { success: true }
}

// Allergen actions
export async function createAllergen(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const code = (formData.get("code") as string).toUpperCase().trim()
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const type = (formData.get("type") as string) || "allergen"

  try {
    await sql`
      INSERT INTO allergens (restaurant_id, code, name, description, type)
      VALUES (${session.restaurantId}, ${code}, ${name}, ${description || null}, ${type})
    `
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    return { error: "Kürzel existiert bereits" }
  }
}

export async function updateAllergen(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  const id = Number.parseInt(formData.get("id") as string)
  const code = (formData.get("code") as string).toUpperCase().trim()
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const type = (formData.get("type") as string) || "allergen"

  try {
    await sql`
      UPDATE allergens SET code = ${code}, name = ${name}, description = ${description || null}, type = ${type}
      WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
    `
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    return { error: "Kürzel existiert bereits" }
  }
}

export async function deleteAllergen(id: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  await sql`DELETE FROM allergens WHERE id = ${id} AND restaurant_id = ${session.restaurantId}`
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getRestaurantAllergens() {
  const session = await getRestaurantAdminSession()
  if (!session) return []

  try {
    const allergens = await sql`
      SELECT * FROM allergens 
      WHERE restaurant_id = ${session.restaurantId}
      ORDER BY code
    `
    return allergens
  } catch {
    return []
  }
}

export async function bulkCreateAllergens(
  type: "allergen" | "additive",
  items: Array<{ code: string; name: string; description?: string }>
) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  let created = 0
  let skipped = 0

  for (const item of items) {
    const code = item.code.toUpperCase().trim()
    
    // Use INSERT with ON CONFLICT DO NOTHING to skip duplicates silently
    const result = await sql`
      INSERT INTO allergens (restaurant_id, code, name, description, type)
      VALUES (${session.restaurantId}, ${code}, ${item.name}, ${item.description || null}, ${type})
      ON CONFLICT (restaurant_id, code) DO NOTHING
      RETURNING id
    `
    
    if (result.length > 0) {
      created++
    } else {
      skipped++
    }
  }

  revalidatePath("/", "layout")
  return { success: true, created, skipped }
}

export async function updateDishAllergens(menuItemId: number, allergenIds: number[]) {
  const session = await getRestaurantAdminSession()
  if (!session) return { error: "Nicht autorisiert" }

  // Verify the menu item belongs to this restaurant
  const item = await sql`
    SELECT id FROM menu_items WHERE id = ${menuItemId} AND restaurant_id = ${session.restaurantId}
  `
  if (item.length === 0) return { error: "Gericht nicht gefunden" }

  // Delete existing allergens for this dish
  await sql`DELETE FROM dish_allergens WHERE menu_item_id = ${menuItemId}`

  // Insert new allergens
  for (const allergenId of allergenIds) {
    // Verify allergen belongs to this restaurant
    const allergen = await sql`
      SELECT id FROM allergens WHERE id = ${allergenId} AND restaurant_id = ${session.restaurantId}
    `
    if (allergen.length > 0) {
      await sql`
        INSERT INTO dish_allergens (menu_item_id, allergen_id)
        VALUES (${menuItemId}, ${allergenId})
      `
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function getDishAllergenIds(menuItemId: number) {
  const session = await getRestaurantAdminSession()
  if (!session) return []

  try {
    const result = await sql`
      SELECT allergen_id FROM dish_allergens WHERE menu_item_id = ${menuItemId}
    `
    return result.map((r: { allergen_id: number }) => r.allergen_id)
  } catch {
    return []
  }
}

// Dedicated theme update action
export async function updateRestaurantTheme(formData: FormData) {
  const session = await getRestaurantAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const primaryColor = formData.get("primaryColor") as string
  const backgroundColor = formData.get("backgroundColor") as string
  const textColor = formData.get("textColor") as string

  try {
    // Get the restaurant slug for specific revalidation
    const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${session.restaurantId}`
    const slug = restaurantResult[0]?.slug

    await sql`
      UPDATE restaurants SET
        primary_color = ${primaryColor || "#0369a1"},
        background_color = ${backgroundColor || "#ffffff"},
        text_color = ${textColor || "#1f2937"},
        updated_at = NOW()
      WHERE id = ${session.restaurantId}
    `

    // Revalidate all admin pages and restaurant pages
    if (slug) {
      revalidatePath(`/${slug}`, "layout")
      revalidatePath(`/${slug}/admin/dashboard`, "page")
    }
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    console.error("Error updating theme:", error)
    return { error: "Fehler beim Speichern des Themes" }
  }
}
