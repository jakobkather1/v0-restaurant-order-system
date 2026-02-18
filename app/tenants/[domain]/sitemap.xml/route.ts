import { NextRequest, NextResponse } from "next/server"
import { getRestaurantByDomain, getMenuForRestaurant } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params

  try {
    const restaurant = await getRestaurantByDomain(domain)

    if (!restaurant) {
      return new NextResponse("Restaurant not found", { status: 404 })
    }

    // Get menu data for sitemap
    const menu = await getMenuForRestaurant(restaurant.id)

    // Build sitemap XML
    const baseUrl = `https://${domain}`
    const now = new Date().toISOString()

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${restaurant.updated_at || now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>${restaurant.hero_image_url && (restaurant.hero_image_url.startsWith('http://') || restaurant.hero_image_url.startsWith('https://')) ? `
    <image:image>
      <image:loc>${restaurant.hero_image_url}</image:loc>
      <image:title>${restaurant.name}</image:title>
    </image:image>` : ""}
  </url>

  <!-- Legal Pages -->
  <url>
    <loc>${baseUrl}/legal/impressum</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/legal/datenschutz</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/legal/agb</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/legal/widerruf</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`

    // Add allergens page if restaurant has allergens
    if (menu.allergens && menu.allergens.length > 0) {
      sitemapXml += `  
  <url>
    <loc>${baseUrl}/allergens</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`
    }

    sitemapXml += `</urlset>`

    return new NextResponse(sitemapXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("[v0] SITEMAP ERROR:", error)
    return new NextResponse("Error generating sitemap", { status: 500 })
  }
}
