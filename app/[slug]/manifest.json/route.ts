import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    console.log("[v0] MANIFEST: Generating for slug:", slug)
    
    // Fetch restaurant info for custom branding - only use columns that exist
    const restaurants = await sql`
      SELECT name
      FROM restaurants
      WHERE slug = ${slug}
      LIMIT 1
    `
    
    const restaurant = restaurants[0]
    
    if (!restaurant) {
      console.warn("[v0] MANIFEST: Restaurant not found for slug:", slug)
      // Return generic manifest for non-existent restaurants
      return NextResponse.json({
        name: "Restaurant",
        short_name: "Restaurant",
        start_url: `/${slug}`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0c4a6e",
        scope: `/${slug}/`,
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      })
    }

    const manifest = {
      name: restaurant.name,
      short_name: restaurant.name.substring(0, 12),
      description: `Online bestellen bei ${restaurant.name}`,
      start_url: `/${slug}`,
      scope: `/${slug}/`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0c4a6e",
      orientation: "portrait-primary",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      categories: ["food", "business"],
      shortcuts: [
        {
          name: "Speisekarte",
          short_name: "Menü",
          description: "Speisekarte anzeigen",
          url: `/${slug}`,
          icons: [{ src: "/icon-192.png", sizes: "192x192" }]
        }
      ]
    }

    console.log("[v0] MANIFEST: Generated for", restaurant.name)

    return new NextResponse(JSON.stringify(manifest), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    })
  } catch (error) {
    console.error("[v0] MANIFEST: Error generating manifest:", error)
    
    // Return minimal fallback manifest
    return NextResponse.json({
      name: "Restaurant",
      short_name: "Restaurant",
      start_url: "/",
      display: "standalone",
      icons: []
    })
  }
}
