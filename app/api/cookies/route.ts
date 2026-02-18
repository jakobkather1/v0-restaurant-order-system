import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const [settingsResult, categoriesResult] = await Promise.all([
      sql`SELECT * FROM cookie_settings WHERE is_active = true LIMIT 1`,
      sql`SELECT * FROM cookie_categories WHERE is_active = true ORDER BY display_order ASC`
    ])

    const settings = settingsResult[0] || null
    const categories = categoriesResult || []

    return NextResponse.json({ settings, categories })
  } catch (error) {
    console.error("Error fetching cookie data:", error)
    return NextResponse.json({ settings: null, categories: [] })
  }
}
