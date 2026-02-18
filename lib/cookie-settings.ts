import "server-only"
import { sql } from "@/lib/db"

export interface CookieCategory {
  id: string
  name: string
  slug: string
  description: string
  is_required: boolean
}

export interface CookieSettings {
  id: number
  banner_title: string
  banner_description: string
  accept_all_text: string
  reject_all_text: string
  settings_text: string
  save_settings_text: string
  privacy_policy_url: string | null
  banner_position: "bottom" | "top" | "center"
  banner_style: "bar" | "popup" | "floating"
  show_reject_all: boolean
  is_active: boolean
}

// Cache for 1 hour
let settingsCache: { data: CookieSettings | null; timestamp: number } | null = null
let categoriesCache: { data: CookieCategory[]; timestamp: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Helper function to detect transient errors
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
    message.includes("timeout") ||
    message.includes("does not exist") ||
    message.includes("42P01")
  )
}

// Retry helper for database calls
async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If it's a transient error and we have retries left, wait and try again
      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = 500 * Math.pow(2, attempt) // 500ms, 1000ms
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Otherwise return fallback
      break
    }
  }

  // Return fallback on any error
  return fallback
}

export async function getCookieSettings(): Promise<CookieSettings | null> {
  const now = Date.now()
  
  // Return cached data if still fresh
  if (settingsCache && now - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.data
  }

  return withRetry(async () => {
    const result = await sql`
      SELECT setting_key, setting_value FROM cookie_settings
    `
    
    // Convert key-value pairs to CookieSettings object
    const settingsMap = new Map<string, string>()
    for (const row of result as Array<{ setting_key: string; setting_value: string }>) {
      settingsMap.set(row.setting_key, row.setting_value)
    }
    
    // Check if banner is enabled
    const isEnabled = settingsMap.get('banner_enabled') === 'true'
    
    if (!isEnabled) {
      settingsCache = { data: null, timestamp: now }
      return null
    }
    
    // Build settings object from key-value pairs
    const settings: CookieSettings = {
      id: 1,
      banner_title: settingsMap.get('banner_title') || 'Cookie-Einstellungen',
      banner_description: settingsMap.get('banner_description') || 'Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten.',
      accept_all_text: settingsMap.get('accept_all_text') || 'Alle akzeptieren',
      reject_all_text: settingsMap.get('reject_all_text') || 'Nur notwendige',
      settings_text: settingsMap.get('settings_text') || 'Einstellungen',
      save_settings_text: settingsMap.get('save_text') || 'Auswahl speichern',
      privacy_policy_url: settingsMap.get('privacy_link') || null,
      banner_position: (settingsMap.get('banner_position') || 'bottom') as "bottom" | "top" | "center",
      banner_style: (settingsMap.get('banner_style') || 'bar') as "bar" | "popup" | "floating",
      show_reject_all: settingsMap.get('show_reject_all') !== 'false',
      is_active: isEnabled,
    }
    
    settingsCache = { data: settings, timestamp: now }
    return settings
  }, null)
}

export async function getCookieCategories(): Promise<CookieCategory[]> {
  const now = Date.now()
  
  // Return cached data if still fresh
  if (categoriesCache && now - categoriesCache.timestamp < CACHE_TTL) {
    return categoriesCache.data
  }

  return withRetry(async () => {
    const result = await sql`
      SELECT id, name, display_name, description, is_required, sort_order 
      FROM cookie_categories 
      ORDER BY sort_order ASC, id ASC
    `
    
    // Map database columns to component-expected format
    const categories = (result as Array<{ 
      id: number; 
      name: string;
      display_name: string;
      description: string; 
      is_required: boolean;
      sort_order: number;
    }>).map(cat => ({
      id: String(cat.id),
      name: cat.display_name || cat.name,
      slug: cat.name,
      description: cat.description,
      is_required: cat.is_required,
    }))
    
    categoriesCache = { data: categories, timestamp: now }
    return categories
  }, [])
}

// Clear cache (useful after updates)
export function clearCookieSettingsCache() {
  settingsCache = null
  categoriesCache = null
}
