import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] API SEO: Starting to fetch platform SEO settings...")
    
    // Use COALESCE to handle NULL values and guarantee all fields are returned
    const result = await sql`
      SELECT 
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'seo_title'),
          ''
        ) as seo_title,
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'seo_description'),
          ''
        ) as seo_description,
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'seo_keywords'),
          ''
        ) as seo_keywords,
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'og_title'),
          ''
        ) as og_title,
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'og_description'),
          ''
        ) as og_description,
        COALESCE(
          (SELECT setting_value FROM platform_settings WHERE setting_key = 'og_image'),
          ''
        ) as og_image
    `

    const row = result.rows[0]
    console.log("[v0] API SEO: Query result received")
    console.log("[v0] API SEO: seo_title =", row?.seo_title ? "LOADED" : "EMPTY/NULL")
    console.log("[v0] API SEO: seo_description =", row?.seo_description ? "LOADED" : "EMPTY/NULL")
    console.log("[v0] API SEO: Raw row data:", JSON.stringify(row, null, 2))

    const seo_title = row?.seo_title?.trim() || "Order Terminal - Online Bestellsystem für Restaurants"
    const seo_description = row?.seo_description?.trim() || "Professionelles Online-Bestellsystem für Restaurants. Einfache Verwaltung, flexible Lieferzonen, moderne Bestell-Experience."
    
    console.log("[v0] API SEO: Final values - title:", seo_title.substring(0, 30) + "...")
    console.log("[v0] API SEO: Final values - description:", seo_description.substring(0, 30) + "...")

    return NextResponse.json({
      seo_title,
      seo_description,
      seo_keywords: row?.seo_keywords?.trim() || "",
      og_title: row?.og_title?.trim() || "",
      og_description: row?.og_description?.trim() || "",
      og_image: row?.og_image?.trim() || "",
    })
  } catch (error) {
    console.error("[v0] API SEO: ERROR - Failed to load platform SEO settings:", error)
    console.error("[v0] API SEO: ERROR DETAILS:", (error as Error).message)
    
    return NextResponse.json({
      seo_title: "Order Terminal - Online Bestellsystem für Restaurants",
      seo_description: "Professionelles Online-Bestellsystem für Restaurants. Einfache Verwaltung, flexible Lieferzonen, moderne Bestell-Experience.",
      seo_keywords: "",
      og_title: "",
      og_description: "",
      og_image: "",
    })
  }
}
