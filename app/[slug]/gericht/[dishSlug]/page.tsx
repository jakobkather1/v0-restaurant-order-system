import { getRestaurantBySlug } from "@/lib/db-queries"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import type { Metadata } from "next"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: { slug: string; dishSlug: string }
}): Promise<Metadata> {
  const { slug, dishSlug } = await Promise.resolve(params)
  
  // Use RPC function for restaurant query
  const restaurant = await getRestaurantBySlug(slug)
  const dishResult = await sql`
    SELECT name, description, price FROM menu_items 
    WHERE restaurant_slug = ${slug} AND (slug = ${dishSlug} OR CAST(id AS TEXT) = ${dishSlug})
  `
  
  const dish = dishResult[0]
  
  if (!restaurant || !dish) {
    return { title: "Gericht nicht gefunden" }
  }
  
  // Dynamic canonical based on current host
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const canonicalUrl = `${protocol}://${host}/${slug}/gericht/${dishSlug}`
  
  return {
    title: `${dish.name} - ${restaurant.name}`,
    description: dish.description || `${dish.name} für ${dish.price.toFixed(2)}€ bei ${restaurant.name} online bestellen.`,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function DishPage({
  params,
}: {
  params: { slug: string; dishSlug: string }
}) {
  const { slug, dishSlug } = await Promise.resolve(params)
  
  // Use RPC function for restaurant query
  const restaurant = await getRestaurantBySlug(slug)
  
  if (!restaurant) {
    notFound()
  }
  
  const dishResult = await sql`
    SELECT mi.*, c.name as category_name, c.id as category_id
    FROM menu_items mi
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE mi.restaurant_slug = ${slug} 
    AND (mi.slug = ${dishSlug} OR CAST(mi.id AS TEXT) = ${dishSlug})
  `
  const dish = dishResult.rows[0]
  
  if (!dish) {
    notFound()
  }
  
  // Fetch allergens if available
  const allergensResult = await sql`
    SELECT a.name, a.icon 
    FROM dish_allergens da
    JOIN allergens a ON da.allergen_id = a.id
    WHERE da.dish_id = ${dish.id}
  `
  const allergens = allergensResult.rows
  
  // Fetch variants if available
  const variantsResult = await sql`
    SELECT * FROM variants WHERE menu_item_id = ${dish.id} ORDER BY display_order
  `
  const variants = variantsResult.rows
  
  const primaryColor = restaurant.primary_color || "#ef4444"
  const backgroundColor = restaurant.background_color || "#ffffff"
  const categorySlug = dish.category_name ? dish.category_name.toLowerCase().replace(/\s+/g, '-') : ''
  
  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MenuItem",
            name: dish.name,
            description: dish.description,
            offers: {
              "@type": "Offer",
              price: dish.price,
              priceCurrency: "EUR",
            },
            image: dish.image_url,
          }),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6">
          {dish.image_url && (
            <div className="aspect-video relative">
              <Image
                src={dish.image_url || "/placeholder.svg"}
                alt={`${dish.name} - ${dish.description || 'Gericht'} bei ${restaurant.name}`}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <div className="p-6 sm:p-8">
            <div className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
              {dish.name}
            </div>
            
            {dish.description && (
              <p className="text-gray-700 text-lg mb-6">{dish.description}</p>
            )}
            
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                {dish.price.toFixed(2)}€
              </span>
              {dish.compare_at_price && dish.compare_at_price > dish.price && (
                <span className="text-xl text-gray-400 line-through">
                  {dish.compare_at_price.toFixed(2)}€
                </span>
              )}
            </div>
            
            {variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Verfügbare Varianten:</h3>
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div key={variant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>{variant.name}</span>
                      <span className="font-semibold">+{variant.price_modifier.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {allergens.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Allergene:</h3>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {allergen.icon} {allergen.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Link
              href={`/${slug}`}
              className="inline-block w-full sm:w-auto px-8 py-3 text-center text-white font-semibold rounded-lg shadow hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Jetzt bestellen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
