import { getRestaurantBySlug } from "@/lib/db-queries"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Clock, Euro } from "lucide-react"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import type { Metadata } from "next"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; zoneSlug: string }>
}): Promise<Metadata> {
  const { slug, zoneSlug } = await params
  
  // Use RPC function for restaurant query
  const restaurant = await getRestaurantBySlug(slug)
  const decodedZoneSlug = decodeURIComponent(zoneSlug).toLowerCase()
  const zoneResult = await sql`
    SELECT name FROM delivery_zones 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE slug = ${slug})
    AND LOWER(REPLACE(name, ' ', '-')) = ${decodedZoneSlug}
  `
  
  const zone = zoneResult[0]
  
  if (!restaurant || !zone) {
    return { title: "Lieferzone nicht gefunden" }
  }
  
  // Dynamic canonical based on current host
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const canonicalUrl = `${protocol}://${host}/${slug}/lieferung/${zoneSlug}`
  
  return {
    title: `Lieferung nach ${zone.name} - ${restaurant.name}`,
    description: `${restaurant.name} liefert nach ${zone.name}. Schnelle Lieferung, frische Gerichte. Jetzt online bestellen!`,
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function DeliveryZonePage({
  params,
}: {
  params: Promise<{ slug: string; zoneSlug: string }>
}) {
  const { slug, zoneSlug } = await params
  const decodedZoneSlug = decodeURIComponent(zoneSlug).toLowerCase()
  
  // Fetch restaurant using RPC function
  const restaurant = await getRestaurantBySlug(slug)
  
  if (!restaurant) {
    notFound()
  }
  
  const zoneResult = await sql`
    SELECT * FROM delivery_zones 
    WHERE restaurant_id = ${restaurant.id}
    AND LOWER(REPLACE(name, ' ', '-')) = ${decodedZoneSlug}
  `
  const zone = zoneResult.rows[0]
  
  if (!zone) {
    notFound()
  }
  
  const primaryColor = restaurant.primary_color || "#ef4444"
  const backgroundColor = restaurant.background_color || "#ffffff"
  
  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DeliveryChargeSpecification",
            appliesToDeliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeDirectDownload",
            eligibleRegion: {
              "@type": "GeoCircle",
              name: zone.name,
            },
            price: zone.price || 0,
            priceCurrency: "EUR",
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
        
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mt-6">
          <div className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
            Lieferung nach {zone.name}
          </div>
          
          <p className="text-lg text-gray-700 mb-8">
            {restaurant.name} liefert frische Gerichte direkt zu Ihnen nach {zone.name}. 
            Bestellen Sie jetzt bequem online!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
              <div>
                <div className="font-semibold mb-1">Liefergebiet</div>
                <p className="text-sm text-gray-600">{zone.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Euro className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
              <div>
                <div className="font-semibold mb-1">Liefergebühr</div>
                <p className="text-sm text-gray-600">
                  {zone.price ? `${Number(zone.price).toFixed(2)}€` : 'Kostenlos'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
              <div>
                <div className="font-semibold mb-1">Mindestbestellwert</div>
                <p className="text-sm text-gray-600">
                  {zone.minimum_order_value ? `${Number(zone.minimum_order_value).toFixed(2)}€` : 'Kein Minimum'}
                </p>
              </div>
            </div>
          </div>
          
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
  )
}
