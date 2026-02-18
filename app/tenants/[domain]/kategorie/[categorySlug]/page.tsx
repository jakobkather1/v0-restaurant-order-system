import { getRestaurantByDomain } from "@/lib/db"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SchemaMarkup } from "@/components/seo/schema-markup"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import type { Metadata } from "next"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; categorySlug: string }>
}): Promise<Metadata> {
  const { domain, categorySlug } = await params
  const decodedCategorySlug = decodeURIComponent(categorySlug).toLowerCase()
  
  const restaurant = await getRestaurantByDomain(domain)
  if (!restaurant) {
    return { title: "Kategorie nicht gefunden" }
  }
  
  const categoryResult = await sql`
    SELECT name FROM categories 
    WHERE restaurant_id = ${restaurant.id}
    AND LOWER(REPLACE(name, ' ', '-')) = ${decodedCategorySlug}
  `
  
  const category = categoryResult[0]
  
  if (!category) {
    return { title: "Kategorie nicht gefunden" }
  }
  
  const canonicalUrl = `https://${domain}/kategorie/${categorySlug}`
  
  return {
    title: `${category.name} - ${restaurant.name}`,
    description: `${category.name} bei ${restaurant.name} online bestellen. Frische Gerichte, schnelle Lieferung.`,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ domain: string; categorySlug: string }>
}) {
  const { domain, categorySlug } = await params
  const decodedCategorySlug = decodeURIComponent(categorySlug).toLowerCase()
  
  const restaurant = await getRestaurantByDomain(domain)
  
  if (!restaurant) {
    notFound()
  }
  
  // Fetch category
  const categoryResult = await sql`
    SELECT * FROM categories 
    WHERE restaurant_id = ${restaurant.id}
    AND LOWER(REPLACE(name, ' ', '-')) = ${decodedCategorySlug}
  `
  const category = categoryResult.rows[0]
  
  if (!category) {
    notFound()
  }
  
  // Fetch menu items in this category
  const menuItemsResult = await sql`
    SELECT * FROM menu_items 
    WHERE restaurant_id = ${restaurant.id}
    AND category_id = ${category.id}
    AND is_available = true
    ORDER BY sort_order ASC, name ASC
  `
  const menuItems = menuItemsResult.rows
  
  const primaryColor = restaurant.primary_color || "#ef4444"
  const backgroundColor = restaurant.background_color || "#ffffff"
  
  return (
    <>
      <SchemaMarkup 
        restaurant={restaurant}
        menuItems={menuItems.map(item => ({
          name: item.name,
          description: item.description || '',
          price: item.price,
          image_url: item.image_url || undefined
        }))}
      />
      
      <div className="min-h-screen" style={{ backgroundColor }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
            style={{ color: primaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
          
          {/* Category Header */}
          <div className="mb-8 mt-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
              {category.name}
            </h2>
            {category.description && (
              <p className="text-gray-600">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {menuItems.length} {menuItems.length === 1 ? 'Gericht' : 'Gerichte'}
            </p>
          </div>
          
          {/* Menu Items List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ul className="space-y-3">
              {menuItems.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={`/#category-${category.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium min-w-[2rem]">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-gray-900 group-hover:underline">
                        {item.name}
                      </span>
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {menuItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Gerichte in dieser Kategorie verfügbar.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
