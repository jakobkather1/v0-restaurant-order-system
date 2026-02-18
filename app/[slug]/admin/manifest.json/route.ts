import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    console.log("[v0] ADMIN-MANIFEST: Generating manifest for slug:", slug)

    // Fetch restaurant info for custom branding
    const restaurants = await sql`
      SELECT name
      FROM restaurants
      WHERE slug = ${slug}
      LIMIT 1
    `

    const restaurant = restaurants[0]

    if (!restaurant) {
      console.warn("[v0] ADMIN-MANIFEST: Restaurant not found for slug:", slug)
      return NextResponse.json({
        name: "Admin Dashboard",
        short_name: "Admin",
        start_url: `/${slug}/admin/dashboard`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0c4a6e",
        scope: `/${slug}/admin/`,
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
      name: `${restaurant.name} - Admin`,
      short_name: `${restaurant.name.substring(0, 8)} Admin`,
      description: `Admin Dashboard für ${restaurant.name}`,
      start_url: `/${slug}/admin/dashboard`,
      scope: `/${slug}/admin/`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0c4a6e",
      orientation: "portrait",
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
      categories: ["business", "productivity"],
      prefer_related_applications: false
    }

    console.log("[v0] ADMIN-MANIFEST: Generated successfully with start_url:", manifest.start_url)

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600"
      }
    })
  } catch (error) {
    console.error("[v0] ADMIN-MANIFEST: Error generating manifest:", error)
    
    // Return fallback manifest on error
    return NextResponse.json({
      name: "Admin Dashboard",
      short_name: "Admin",
      start_url: `/${slug}/admin/dashboard`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0c4a6e",
      scope: `/${slug}/admin/`,
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    })
  }
}
