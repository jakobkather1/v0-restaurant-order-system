import "server-only"

import { neon, neonConfig } from "@neondatabase/serverless"
import { Pool } from "@neondatabase/serverless"

// Disable the "Running SQL directly from the browser" warning
// This is safe because all SQL runs on the server only (import "server-only" above)
neonConfig.disableWarningInBrowsers = true

// Suppress fetch warnings - we're using this only on the server
neonConfig.webSocketConstructor = undefined

// Connection pooling for better performance
// Use pooled connection for faster queries
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    cache: 'no-store', // Disable fetch cache for fresh data
  },
})

// Lazy-loaded connection pool - only initialized when needed
let _pool: Pool | null = null
export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  }
  return _pool
}

// Deprecated: Use getPool() instead for better performance
export const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

export { sql }

function isTransientError(error: unknown): boolean {
  const message = (error as Error)?.message || ""
  return (
    message.includes("Failed to fetch") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("network") ||
    message.includes("Too Many") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("timeout")
  )
}

async function withRetry<T>(fn: () => Promise<T>, fallback: T, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      if (isTransientError(error)) {
        return fallback
      }

      return fallback
    }
  }

  if (lastError && isTransientError(lastError)) {
    return fallback
  }

  return fallback
}

export async function getRestaurantByIdentifier(identifier: string) {
  return withRetry(async () => {
    // Decode URL-encoded characters (e.g., %C3%B6 -> ö)
    let decodedIdentifier = identifier
    try {
      decodedIdentifier = decodeURIComponent(identifier)
    } catch (e) {
      // If decoding fails, use original
      decodedIdentifier = identifier
    }
    
    // Normalize identifier (lowercase, trim)
    const normalizedIdentifier = decodedIdentifier.toLowerCase().trim()
    
    // First try to find by domain (priority for custom domains)
    const domainResult = await sql`
      SELECT * FROM restaurants 
      WHERE LOWER(TRIM(domain)) = ${normalizedIdentifier}
      LIMIT 1
    `
    
    if (domainResult[0]) {
      return domainResult[0]
    }
    
    // If not found by domain, try by slug
    const slugResult = await sql`
      SELECT * FROM restaurants 
      WHERE LOWER(TRIM(slug)) = ${normalizedIdentifier}
      LIMIT 1
    `
    
    if (slugResult[0]) {
      return slugResult[0]
    }
    
    return null
  }, null)
}

export async function getRestaurantByDomain(domain: string) {
  return withRetry(async () => {
    console.log("[v0] DB: Looking up restaurant by domain:", domain)
    
    // Normalize domain: remove www., lowercase, trim
    const normalizedDomain = domain.toLowerCase().trim().replace(/^www\./, "")
    
    // Convert Punycode to Unicode (xn--... -> äöü)
    let unicodeDomain = normalizedDomain
    try {
      // Use native URL API to decode punycode
      if (normalizedDomain.includes('xn--')) {
        const url = new URL(`http://${normalizedDomain}`)
        unicodeDomain = url.hostname
        console.log("[v0] DB: Converted Punycode to Unicode:", normalizedDomain, "->", unicodeDomain)
      }
    } catch (e) {
      console.log("[v0] DB: Punycode conversion failed, using original domain")
    }
    
    // Build array of all possible domain variations to search
    const searchDomains = [
      normalizedDomain,
      `www.${normalizedDomain}`,
    ]
    
    // Add Unicode variants if different from Punycode
    if (unicodeDomain !== normalizedDomain) {
      searchDomains.push(unicodeDomain)
      searchDomains.push(`www.${unicodeDomain}`)
    }
    
    console.log("[v0] DB: Searching for domain variants:", searchDomains)
    
    // Search for any of these domain variants
    const result = await sql`
      SELECT * FROM restaurants 
      WHERE LOWER(TRIM(REPLACE(domain, 'www.', ''))) IN (
        ${normalizedDomain},
        ${unicodeDomain}
      )
      LIMIT 1
    `
    
    if (result[0]) {
      console.log("[v0] DB: ✓ Restaurant found by domain:", result[0].name)
      console.log("[v0] DB: Matched domain in DB:", result[0].domain)
      return result[0]
    }
    
    console.log("[v0] DB: ✗ No restaurant found for any domain variant")
    return null
  }, null)
}

// Alias for getRestaurantByDomain - used by custom domain routes
export async function getRestaurantByCustomDomain(domain: string) {
  return getRestaurantByDomain(domain)
}

export async function getRestaurantById(id: number) {
  return withRetry(async () => {
    const result = await sql`
      SELECT * FROM restaurants WHERE id = ${id}
    `
    return result[0] || null
  }, null)
}

export async function getAllRestaurants() {
  return withRetry(async () => {
    return await sql`
      SELECT * FROM restaurants ORDER BY created_at DESC
    `
  }, [])
}

export async function getMenuForRestaurant(restaurantId: number) {
  return withRetry(
    async () => {
      const categories = await sql`
        SELECT * FROM categories 
        WHERE restaurant_id = ${restaurantId} 
        ORDER BY id
      `

      const menuItems = await sql`
        SELECT * FROM menu_items 
        WHERE restaurant_id = ${restaurantId} AND is_available = true
        ORDER BY id
      `

      const itemVariants = await sql`
        SELECT iv.* FROM item_variants iv
        JOIN menu_items mi ON iv.menu_item_id = mi.id
        WHERE mi.restaurant_id = ${restaurantId}
        ORDER BY iv.sort_order
      `

      let categoryVariants: Array<{
        id: number
        category_id: number
        name: string
        price_modifier: number
        sort_order: number
      }> = []
      try {
        categoryVariants = await sql`
          SELECT cv.* FROM category_variants cv
          JOIN categories c ON cv.category_id = c.id
          WHERE c.restaurant_id = ${restaurantId}
          ORDER BY cv.sort_order
        `
      } catch {
        // Table may not exist yet
      }

      const combinedVariants: Array<{
        id: number
        menu_item_id: number
        name: string
        price_modifier: number
        sort_order: number
      }> = [...itemVariants]

      for (const item of menuItems) {
        const hasItemVariants = itemVariants.some((v: { menu_item_id: number }) => v.menu_item_id === item.id)
        if (!hasItemVariants && item.category_id) {
          const catVariants = categoryVariants.filter((cv) => cv.category_id === item.category_id)
          for (const cv of catVariants) {
            combinedVariants.push({
              id: cv.id + 1000000,
              menu_item_id: item.id,
              name: cv.name,
              price_modifier: cv.price_modifier,
              sort_order: cv.sort_order,
            })
          }
        }
      }

      const toppings = await sql`
        SELECT * FROM toppings 
        WHERE restaurant_id = ${restaurantId} AND is_available = true
        ORDER BY name
      `

      const toppingIds = toppings.map((t: { id: number }) => t.id)
      let toppingPriceVariants: Array<{ topping_id: number; variant_name: string; price: number }> = []
      let toppingCategories: Array<{ topping_id: number; category_id: number }> = []
      
      if (toppingIds.length > 0) {
        try {
          toppingPriceVariants = await sql`
            SELECT * FROM topping_price_variants 
            WHERE topping_id = ANY(${toppingIds})
          `
        } catch (error) {
          console.log("[v0] topping_price_variants table not available:", error)
          // Table may not exist yet
        }
        
        try {
          toppingCategories = await sql`
            SELECT * FROM topping_categories 
            WHERE topping_id = ANY(${toppingIds})
          `
        } catch (error) {
          console.log("[v0] topping_categories table not available:", error)
          // Table may not exist yet
        }
      }

      const toppingsWithVariants = toppings.map((topping: { id: number }) => ({
        ...topping,
        price_variants: toppingPriceVariants.filter((pv) => pv.topping_id === topping.id),
        allowed_category_ids: toppingCategories
          .filter((tc) => tc.topping_id === topping.id)
          .map((tc) => tc.category_id),
      }))

      let allergens: Array<{ id: number; code: string; name: string; type: string }> = []
      let dishAllergens: Array<{ menu_item_id: number; allergen_id: number }> = []

      try {
        allergens = await sql`
          SELECT * FROM allergens 
          WHERE restaurant_id = ${restaurantId}
          ORDER BY code
        `

        const menuItemIds = menuItems.map((m: { id: number }) => m.id)
        if (menuItemIds.length > 0) {
          dishAllergens = await sql`
            SELECT * FROM dish_allergens 
            WHERE menu_item_id = ANY(${menuItemIds})
          `
        }
      } catch {
        // Tables may not exist yet
      }

      return {
        categories,
        menuItems,
        variants: combinedVariants,
        toppings: toppingsWithVariants,
        allergens,
        dishAllergens,
      }
    },
    { categories: [], menuItems: [], variants: [], toppings: [], allergens: [], dishAllergens: [] },
  )
}

export async function getDeliveryZones(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT * FROM delivery_zones 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name
    `
  }, [])
}

export async function getActiveOrders(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT o.*, dz.name as delivery_zone_name
      FROM orders o
      LEFT JOIN delivery_zones dz ON o.delivery_zone_id = dz.id
      WHERE o.restaurant_id = ${restaurantId} 
        AND o.is_completed = false 
        AND (o.is_cancelled = false OR o.is_cancelled IS NULL)
      ORDER BY o.created_at DESC
    `
  }, [])
}

export async function getOrderItems(orderId: number) {
  return withRetry(async () => {
    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    `

    const itemIds = items.map((i) => i.id)
    if (itemIds.length === 0) return []

    const toppings = await sql`
      SELECT * FROM order_item_toppings WHERE order_item_id = ANY(${itemIds})
    `

    return items.map((item) => ({
      ...item,
      toppings: toppings.filter((t) => t.order_item_id === item.id),
    }))
  }, [])
}

export async function validateDiscountCode(restaurantId: number, code: string) {
  return withRetry(async () => {
    const result = await sql`
      SELECT * FROM discount_codes 
      WHERE restaurant_id = ${restaurantId} 
      AND code = ${code.toUpperCase()} 
      AND is_active = true
      LIMIT 1
    `
    return result[0] || null
  }, null)
}

export function isRestaurantOpen(openingHours: Record<string, { open: string; close: string }>) {
  if (!openingHours) return false

  const now = new Date()
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const currentDay = days[now.getDay()]
  const todayHours = openingHours[currentDay]

  console.log("[v0] Opening Hours Check:", {
    currentDay,
    currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`,
    todayHours,
    openingHours,
  })

  if (!todayHours || !todayHours.open || !todayHours.close) {
    console.log("[v0] No hours configured for", currentDay)
    return false
  }

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [openHour, openMin] = todayHours.open.split(":").map(Number)
  const [closeHour, closeMin] = todayHours.close.split(":").map(Number)

  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  console.log("[v0] Time Comparison:", {
    currentTime,
    openTime,
    closeTime,
    isAfterMidnight: closeTime < openTime,
  })

  if (closeTime < openTime) {
    const result = currentTime >= openTime || currentTime < closeTime
    console.log("[v0] After midnight case - isOpen:", result)
    return result
  }

  const result = currentTime >= openTime && currentTime < closeTime
  console.log("[v0] Normal case - isOpen:", result)
  return result
}

export async function getMonthlyRevenue(restaurantId: number) {
  return withRetry(async () => {
    // Get base revenue from monthly_revenue table (already adjusted for cancellations)
    return await sql`
      SELECT * FROM monthly_revenue
      WHERE restaurant_id = ${restaurantId}
      ORDER BY month DESC
      LIMIT 12
    `
  }, [])
}

export async function getSuperAdminStats() {
  return withRetry(
    async () => {
      const restaurantCount = await sql`
      SELECT COUNT(*) as count FROM restaurants WHERE is_active = true
    `

      const totalRevenue = await sql`
      SELECT COALESCE(SUM(total_revenue), 0) as total FROM monthly_revenue
    `

      const totalFees = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) as total FROM monthly_revenue
    `

      const pendingDomainRequests = await sql`
      SELECT COUNT(*) as count FROM domain_requests WHERE status = 'pending'
    `

      return {
        activeRestaurants: Number(restaurantCount[0]?.count || 0),
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        totalFees: Number(totalFees[0]?.total || 0),
        pendingDomainRequests: Number(pendingDomainRequests[0]?.count || 0),
      }
    },
    { activeRestaurants: 0, totalRevenue: 0, totalFees: 0, pendingDomainRequests: 0 },
  )
}

export async function getArchivedOrders(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT o.*, dz.name as delivery_zone_name
      FROM orders o
      LEFT JOIN delivery_zones dz ON o.delivery_zone_id = dz.id
      WHERE o.restaurant_id = ${restaurantId} AND o.is_completed = true
      AND o.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY o.created_at DESC
    `
  }, [])
}

export async function getUniqueVariantNames(restaurantId: number) {
  return withRetry(async () => {
    const result = await sql`
      SELECT DISTINCT iv.name 
      FROM item_variants iv
      JOIN menu_items mi ON iv.menu_item_id = mi.id
      WHERE mi.restaurant_id = ${restaurantId}
      ORDER BY iv.name
    `
    return result.map((r: { name: string }) => r.name)
  }, [])
}

export async function getRestaurantReviewStats(restaurantId: number) {
  return withRetry(
    async () => {
      const result = await sql`
      SELECT 
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as review_count
      FROM reviews 
      WHERE restaurant_id = ${restaurantId} AND is_approved = true
    `
      return {
        avgRating: Number(result[0]?.avg_rating || 0),
        reviewCount: Number(result[0]?.review_count || 0),
      }
    },
    { avgRating: 0, reviewCount: 0 },
  )
}

export async function getApprovedReviews(restaurantId: number, limit = 10) {
  return withRetry(async () => {
    return await sql`
      SELECT * FROM reviews 
      WHERE restaurant_id = ${restaurantId} AND is_approved = true
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }, [])
}

export async function getAllActiveRestaurantSlugs() {
  return withRetry(async () => {
    const result = await sql`
      SELECT slug, updated_at FROM restaurants WHERE is_active = true
    `
    return result
  }, [])
}

export async function getPlatformSettings(): Promise<Record<string, string>> {
  try {
    const result = await sql`
      SELECT setting_key, setting_value FROM platform_settings
    `
    const settings: Record<string, string> = {}
    for (const row of result) {
      settings[row.setting_key] = row.setting_value || ""
    }
    return settings
  } catch (error) {
    const message = (error as Error)?.message || ""
    if (message.includes("does not exist") || message.includes("42P01")) {
      return {}
    }
    return {}
  }
}

export async function getPlatformSetting(key: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT setting_value FROM platform_settings WHERE setting_key = ${key} LIMIT 1
    `
    return result[0]?.setting_value || null
  } catch {
    return null
  }
}

export async function updatePlatformSetting(key: string, value: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO platform_settings (setting_key, setting_value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = ${value}, updated_at = NOW()
    `
    return true
  } catch {
    return false
  }
}

export async function getRestaurantBillings(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT * FROM restaurant_billings 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY billing_month DESC
    `
  }, [])
}

export async function getAllergens(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT * FROM allergens 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY code
    `
  }, [])
}

export async function getDishAllergens(restaurantId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT da.* FROM dish_allergens da
      JOIN menu_items mi ON da.menu_item_id = mi.id
      WHERE mi.restaurant_id = ${restaurantId}
    `
  }, [])
}

export async function getAllergensForDish(menuItemId: number) {
  return withRetry(async () => {
    return await sql`
      SELECT a.* FROM allergens a
      JOIN dish_allergens da ON a.id = da.allergen_id
      WHERE da.menu_item_id = ${menuItemId}
      ORDER BY a.code
    `
  }, [])
}
