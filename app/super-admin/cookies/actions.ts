"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Types matching actual database schema
export interface CookieCategory {
  id: number
  name: string
  display_name: string
  description: string | null
  is_required: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CookieDefinition {
  id: number
  category_id: number
  name: string
  description: string | null
  provider: string | null
  duration: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category_name?: string
  category_display_name?: string
}

export interface CookieSettings {
  [key: string]: string
}

// ============ Categories ============

export async function getCookieCategories(): Promise<CookieCategory[]> {
  const result = await sql`
    SELECT * FROM cookie_categories 
    ORDER BY sort_order ASC
  `
  return result as CookieCategory[]
}

export async function createCookieCategory(data: {
  name: string
  display_name: string
  description?: string
  is_required?: boolean
  sort_order?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      INSERT INTO cookie_categories (name, display_name, description, is_required, sort_order)
      VALUES (${data.name}, ${data.display_name}, ${data.description || null}, ${data.is_required || false}, ${data.sort_order || 0})
    `
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error creating cookie category:", error)
    return { success: false, error: "Fehler beim Erstellen der Kategorie" }
  }
}

export async function updateCookieCategory(
  id: number,
  data: Partial<{
    name: string
    display_name: string
    description: string
    is_required: boolean
    sort_order: number
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE cookie_categories SET
        name = COALESCE(${data.name}, name),
        display_name = COALESCE(${data.display_name}, display_name),
        description = COALESCE(${data.description}, description),
        is_required = COALESCE(${data.is_required}, is_required),
        sort_order = COALESCE(${data.sort_order}, sort_order),
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error updating cookie category:", error)
    return { success: false, error: "Fehler beim Aktualisieren der Kategorie" }
  }
}

export async function deleteCookieCategory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if it's a required category
    const category = await sql`SELECT is_required FROM cookie_categories WHERE id = ${id}`
    if (category[0]?.is_required) {
      return { success: false, error: "Pflicht-Kategorien können nicht gelöscht werden" }
    }
    
    await sql`DELETE FROM cookie_categories WHERE id = ${id}`
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error deleting cookie category:", error)
    return { success: false, error: "Fehler beim Löschen der Kategorie" }
  }
}

// ============ Cookie Definitions ============

export async function getCookieDefinitions(): Promise<CookieDefinition[]> {
  const result = await sql`
    SELECT 
      cd.*,
      cc.name as category_name,
      cc.display_name as category_display_name
    FROM cookie_definitions cd
    LEFT JOIN cookie_categories cc ON cd.category_id = cc.id
    ORDER BY cc.sort_order ASC, cd.name ASC
  `
  return result as CookieDefinition[]
}

export async function createCookieDefinition(data: {
  category_id: number
  name: string
  description?: string
  provider?: string
  duration?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      INSERT INTO cookie_definitions (category_id, name, description, provider, duration)
      VALUES (${data.category_id}, ${data.name}, ${data.description || null}, ${data.provider || null}, ${data.duration || null})
    `
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error creating cookie definition:", error)
    return { success: false, error: "Fehler beim Erstellen des Cookies" }
  }
}

export async function updateCookieDefinition(
  id: number,
  data: Partial<{
    category_id: number
    name: string
    description: string
    provider: string
    duration: string
    is_active: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE cookie_definitions SET
        category_id = COALESCE(${data.category_id}, category_id),
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        provider = COALESCE(${data.provider}, provider),
        duration = COALESCE(${data.duration}, duration),
        is_active = COALESCE(${data.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error updating cookie definition:", error)
    return { success: false, error: "Fehler beim Aktualisieren des Cookies" }
  }
}

export async function deleteCookieDefinition(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`DELETE FROM cookie_definitions WHERE id = ${id}`
    revalidatePath("/super-admin/cookies")
    return { success: true }
  } catch (error) {
    console.error("Error deleting cookie definition:", error)
    return { success: false, error: "Fehler beim Löschen des Cookies" }
  }
}

// ============ Settings ============

export async function getCookieSettings(): Promise<CookieSettings> {
  const result = await sql`SELECT setting_key, setting_value FROM cookie_settings`
  const settings: CookieSettings = {}
  for (const row of result) {
    settings[row.setting_key] = row.setting_value
  }
  return settings
}

export async function updateCookieSetting(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      INSERT INTO cookie_settings (setting_key, setting_value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = ${value},
        updated_at = NOW()
    `
    revalidatePath("/super-admin/cookies")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating cookie setting:", error)
    return { success: false, error: "Fehler beim Aktualisieren der Einstellung" }
  }
}

export async function updateCookieSettings(
  settings: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await sql`
        INSERT INTO cookie_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${value}, NOW())
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = ${value},
          updated_at = NOW()
      `
    }
    revalidatePath("/super-admin/cookies")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating cookie settings:", error)
    return { success: false, error: "Fehler beim Aktualisieren der Einstellungen" }
  }
}
