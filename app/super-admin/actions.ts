"use server"

import { sql } from "@/lib/db"
import {
  verifySuperAdmin,
  setSuperAdminSession,
  clearSuperAdminSession,
  getSuperAdminSession,
  hashPassword,
} from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginSuperAdmin(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const user = await verifySuperAdmin(username, password)
  if (!user) {
    return { error: "Ungültige Anmeldedaten" }
  }

  await setSuperAdminSession(user.id, user.username)
  redirect("/super-admin")
}

export async function logoutSuperAdmin() {
  await clearSuperAdminSession()
  redirect("/super-admin")
}

export async function createSuperAdminUser(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const displayName = formData.get("displayName") as string

  if (!username || !password) {
    return { error: "Benutzername und Passwort sind erforderlich" }
  }

  if (password.length < 6) {
    return { error: "Passwort muss mindestens 6 Zeichen lang sein" }
  }

  try {
    const passwordHash = await hashPassword(password)
    await sql`
      INSERT INTO super_admin_users (username, password_hash, display_name)
      VALUES (${username.toLowerCase()}, ${passwordHash}, ${displayName || username})
    `
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    if (message.includes("duplicate") || message.includes("unique")) {
      return { error: "Benutzername bereits vergeben" }
    }
    return { error: "Fehler beim Erstellen des Benutzers" }
  }
}

export async function updateSuperAdminUser(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)
  const displayName = formData.get("displayName") as string
  const isActive = formData.get("isActive") === "true"
  const newPassword = formData.get("newPassword") as string

  try {
    if (newPassword && newPassword.length >= 6) {
      const passwordHash = await hashPassword(newPassword)
      await sql`
        UPDATE super_admin_users 
        SET display_name = ${displayName}, is_active = ${isActive}, password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE super_admin_users 
        SET display_name = ${displayName}, is_active = ${isActive}, updated_at = NOW()
        WHERE id = ${id}
      `
    }
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating super admin user:", error)
    return { error: "Fehler beim Aktualisieren" }
  }
}

export async function deleteSuperAdminUser(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)

  // Prevent deleting yourself
  if (session.userId === id) {
    return { error: "Sie können sich nicht selbst löschen" }
  }

  // Prevent deleting the last user
  try {
    const count = await sql`SELECT COUNT(*) as count FROM super_admin_users WHERE is_active = true`
    if (count[0].count <= 1) {
      return { error: "Der letzte aktive Benutzer kann nicht gelöscht werden" }
    }

    await sql`DELETE FROM super_admin_users WHERE id = ${id}`
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error deleting super admin user:", error)
    return { error: "Fehler beim Löschen" }
  }
}

export async function createRestaurant(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const domain = formData.get("domain") as string
  const feeType = formData.get("feeType") as "percentage" | "fixed"
  const feeValue = Number.parseFloat(formData.get("feeValue") as string) || 0
  const adminPassword = formData.get("adminPassword") as string

  if (!name || !slug) {
    return { error: "Name und Slug sind erforderlich" }
  }

  const passwordHash = adminPassword ? await hashPassword(adminPassword) : null

  try {
    await sql`
      INSERT INTO restaurants (name, slug, domain, fee_type, fee_value, admin_password_hash)
      VALUES (${name}, ${slug.toLowerCase()}, ${domain || null}, ${feeType}, ${feeValue}, ${passwordHash})
    `
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    if (message.includes("duplicate")) {
      return { error: "Slug oder Domain bereits vergeben" }
    }
    return { error: "Fehler beim Erstellen des Restaurants" }
  }
}

export async function updateRestaurant(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const domain = formData.get("domain") as string
  const feeType = formData.get("feeType") as "percentage" | "fixed"
  const feeValue = Number.parseFloat(formData.get("feeValue") as string) || 0
  const isActive = formData.get("isActive") === "true"
  const superAdminRestaurantPassword = formData.get("superAdminRestaurantPassword") as string

  try {
    if (superAdminRestaurantPassword) {
      await sql`
        UPDATE restaurants 
        SET name = ${name}, slug = ${slug.toLowerCase()}, domain = ${domain || null}, 
            fee_type = ${feeType}, fee_value = ${feeValue}, is_active = ${isActive},
            super_admin_restaurant_password = ${superAdminRestaurantPassword},
            updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE restaurants 
        SET name = ${name}, slug = ${slug.toLowerCase()}, domain = ${domain || null}, 
            fee_type = ${feeType}, fee_value = ${feeValue}, is_active = ${isActive},
            updated_at = NOW()
        WHERE id = ${id}
      `
    }
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    if (message.includes("duplicate")) {
      return { error: "Slug oder Domain bereits vergeben" }
    }
    return { error: "Fehler beim Aktualisieren" }
  }
}

export async function updateRestaurantPassword(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)
  const password = formData.get("password") as string

  if (!password || password.length < 6) {
    return { error: "Passwort muss mindestens 6 Zeichen lang sein" }
  }

  const passwordHash = await hashPassword(password)

  await sql`
    UPDATE restaurants SET admin_password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath("/super-admin")
  return { success: true }
}

export async function deleteRestaurant(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)

  await sql`DELETE FROM restaurants WHERE id = ${id}`
  revalidatePath("/super-admin")
  return { success: true }
}

// Update platform SEO settings (meta tags, OG tags)
export async function updatePlatformSettings(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    console.log("[v0] SEO settings save failed: Not authorized")
    return { error: "Nicht autorisiert" }
  }

  const { updatePlatformSetting } = await import("@/lib/db")

  const settings = [
    "seo_title",
    "seo_description",
    "seo_keywords",
    "og_title",
    "og_description",
    "og_image",
  ]

  console.log("[v0] Starting SEO settings update...")
  const settingsData: Record<string, string> = {}
  
  try {
    for (const key of settings) {
      const value = (formData.get(key) as string) || ""
      settingsData[key] = value
      console.log(`[v0] Saving ${key}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`)
      
      const result = await updatePlatformSetting(key, value)
      console.log(`[v0] Save result for ${key}:`, result)
    }
    
    console.log("[v0] All SEO settings saved successfully to database")
    console.log("[v0] Revalidating paths...")
    revalidatePath("/")
    revalidatePath("/super-admin")
    console.log("[v0] Paths revalidated")
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating platform SEO settings:", error)
    console.error("[v0] Failed settings data:", settingsData)
    return { error: "Fehler beim Speichern der Einstellungen" }
  }
}

export async function updatePlatformLegalSettings(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const { updatePlatformSetting } = await import("@/lib/db")

  const settings = [
    "platform_name",
    "platform_legal_name",
    "platform_legal_address",
    "platform_legal_contact",
    "platform_tax_id",
    "platform_imprint",
    "platform_privacy_policy",
    "platform_terms_of_service",
  ]

  try {
    for (const key of settings) {
      const value = (formData.get(key) as string) || ""
      await updatePlatformSetting(key, value)
    }
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating platform settings:", error)
    return { error: "Fehler beim Speichern der Einstellungen" }
  }
}

export async function getRestaurantBillings(restaurantId: number) {
  try {
    const billings = await sql`
      SELECT * FROM restaurant_billings 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY billing_month DESC
    `
    return billings
  } catch (error) {
    console.error("Error fetching billings:", error)
    return []
  }
}

export async function updateBillingStatus(billingId: number, newStatus: "open" | "paid", confirmationWord?: string) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  if (newStatus === "paid" && confirmationWord?.toLowerCase() !== "bezahlt") {
    return { error: "Bitte geben Sie 'bezahlt' ein um die Zahlung zu bestätigen" }
  }

  try {
    const now = new Date().toISOString()
    await sql`
      UPDATE restaurant_billings 
      SET payment_status = ${newStatus},
          payment_confirmed_at = ${newStatus === "paid" ? now : null},
          payment_date = ${newStatus === "paid" ? now : null},
          updated_at = NOW()
      WHERE id = ${billingId}
    `
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating billing:", error)
    return { error: "Fehler beim Aktualisieren" }
  }
}

export async function addBillingNote(billingId: number, note: string) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  try {
    await sql`
      UPDATE restaurant_billings 
      SET notes = ${note}, updated_at = NOW()
      WHERE id = ${billingId}
    `
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error adding note:", error)
    return { error: "Fehler beim Speichern" }
  }
}

export async function updateRestaurantPermissions(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const id = Number.parseInt(formData.get("id") as string)
  const canEditMenu = formData.get("can_edit_menu") === "true"
  const canEditSettings = formData.get("can_edit_settings") === "true"
  const canViewAnalytics = formData.get("can_view_analytics") === "true"
  const canManageOrders = formData.get("can_manage_orders") === "true"
  const aiAssistantEnabled = formData.get("ai_assistant_enabled") === "true"

  try {
    await sql`
      UPDATE restaurants 
      SET can_edit_menu = ${canEditMenu},
          can_edit_settings = ${canEditSettings},
          can_view_analytics = ${canViewAnalytics},
          can_manage_orders = ${canManageOrders},
          ai_assistant_enabled = ${aiAssistantEnabled},
          updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/super-admin")
    revalidatePath(`/super-admin/restaurant/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating permissions:", error)
    return { error: "Fehler beim Aktualisieren der Berechtigungen" }
  }
}

export async function updatePlatformFavicon(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const { updatePlatformSetting } = await import("@/lib/db")

  const faviconFile = formData.get("favicon") as File

  if (!faviconFile || faviconFile.size === 0) {
    return { error: "Keine Datei ausgewählt" }
  }

  // Validate file type
  const allowedTypes = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/jpeg"]
  if (!allowedTypes.includes(faviconFile.type)) {
    return { error: "Ungültiges Format. Erlaubt: PNG, ICO, SVG, JPG" }
  }

  // Validate file size (max 500KB)
  if (faviconFile.size > 500 * 1024) {
    return { error: "Datei zu groß. Maximal 500KB erlaubt" }
  }

  try {
    // Convert to Base64
    const arrayBuffer = await faviconFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${faviconFile.type};base64,${base64}`

    await updatePlatformSetting("platform_favicon", dataUrl)

    revalidatePath("/")
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error uploading favicon:", error)
    return { error: "Fehler beim Hochladen des Favicons" }
  }
}

export async function deletePlatformFavicon() {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const { updatePlatformSetting } = await import("@/lib/db")

  try {
    await updatePlatformSetting("platform_favicon", "")
    revalidatePath("/")
    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Error deleting favicon:", error)
    return { error: "Fehler beim Löschen des Favicons" }
  }
}

export async function resetRestaurantRevenue(restaurantId: number) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  try {
    // Get restaurant slug first
    const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${restaurantId}`
    const restaurantSlug = restaurantResult[0]?.slug

    // Delete all orders for this restaurant
    await sql`DELETE FROM orders WHERE restaurant_id = ${restaurantId}`
    
    // Delete all billing records for this restaurant
    await sql`DELETE FROM restaurant_billings WHERE restaurant_id = ${restaurantId}`
    
    // Delete all monthly revenue records for this restaurant
    // This ensures the total revenue in super-admin dashboard is also updated
    await sql`DELETE FROM monthly_revenue WHERE restaurant_id = ${restaurantId}`
    
    // Revalidate all relevant paths
    revalidatePath("/super-admin", "layout")
    revalidatePath("/super-admin", "page")
    revalidatePath(`/super-admin/restaurant/${restaurantId}`, "page")
    revalidatePath(`/super-admin/dashboard/${restaurantId}`, "page")
    
    // Revalidate restaurant admin dashboard
    if (restaurantSlug) {
      revalidatePath(`/${restaurantSlug}/admin`, "layout")
      revalidatePath(`/${restaurantSlug}/admin/dashboard`, "page")
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error resetting restaurant revenue:", error)
    return { error: "Fehler beim Zurücksetzen der Umsatzdaten" }
  }
}

// Platform AGBs/AVV management
export async function updatePlatformAgbAvv(formData: FormData) {
  const session = await getSuperAdminSession()
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const agbs = formData.get("agbs") as string
  const avv = formData.get("avv") as string

  try {
    await sql`
      INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
      VALUES ('platform_agbs', ${agbs}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = ${agbs}, updated_at = NOW()
    `

    await sql`
      INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
      VALUES ('platform_avv', ${avv}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = ${avv}, updated_at = NOW()
    `

    revalidatePath("/super-admin", "layout")
    return { success: true }
  } catch (error) {
    console.error("Error updating platform AGBs/AVV:", error)
    return { error: "Fehler beim Aktualisieren" }
  }
}
