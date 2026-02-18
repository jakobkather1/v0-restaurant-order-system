import { getAllActiveRestaurantSlugs, sql } from "@/lib/db"
import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"

  // Get all active restaurants
  const restaurants = await getAllActiveRestaurantSlugs()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  // Restaurant pages
  const restaurantPages: MetadataRoute.Sitemap = restaurants.map(
    (restaurant: { id: number; slug: string; updated_at: Date | string }) => ({
      url: `${baseUrl}/${restaurant.slug}`,
      lastModified: new Date(restaurant.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }),
  )

  // Fetch all categories, menu items, and delivery zones for all restaurants
  const allPages: MetadataRoute.Sitemap = []

  for (const restaurant of restaurants) {
    const slug = restaurant.slug

    // Categories (using restaurant_id instead of restaurant_slug)
    const categoriesResult = await sql`
      SELECT name, created_at FROM categories WHERE restaurant_id = ${restaurant.id}
    `
    for (const category of categoriesResult.rows) {
      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-')
      allPages.push({
        url: `${baseUrl}/${slug}/kategorie/${categorySlug}`,
        lastModified: new Date(category.created_at || restaurant.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })
    }

    // Menu Items (using restaurant_id and is_available instead of available)
    const menuItemsResult = await sql`
      SELECT id, name, updated_at FROM menu_items 
      WHERE restaurant_id = ${restaurant.id} AND is_available = true
    `
    for (const item of menuItemsResult.rows) {
      const dishSlug = item.name.toLowerCase().replace(/\s+/g, '-')
      allPages.push({
        url: `${baseUrl}/${slug}/gericht/${dishSlug}`,
        lastModified: new Date(item.updated_at || restaurant.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })
    }

    // Delivery Zones
    const zonesResult = await sql`
      SELECT name FROM delivery_zones WHERE restaurant_id = ${restaurant.id}
    `
    for (const zone of zonesResult.rows) {
      const zoneSlug = zone.name.toLowerCase().replace(/\s+/g, '-')
      allPages.push({
        url: `${baseUrl}/${slug}/lieferung-${zoneSlug}`,
        lastModified: new Date(restaurant.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })
    }
  }

  return [...staticPages, ...restaurantPages, ...allPages]
}
