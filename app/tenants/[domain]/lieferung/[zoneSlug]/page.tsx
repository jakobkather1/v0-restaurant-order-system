import { sql } from '@vercel/postgres'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Bike, MapPin, Euro } from 'lucide-react'

export const revalidate = 3600
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; zoneSlug: string }>
}): Promise<Metadata> {
  try {
    const { domain, zoneSlug } = await params
    
    // Try exact domain match first, then without www, then with www
    let restaurantResult = await sql`
      SELECT id, name, city, custom_domain 
      FROM restaurants 
      WHERE custom_domain = ${domain}
    `
    
    if (restaurantResult.rows.length === 0) {
      const cleanDomain = domain.replace(/^www\./, '')
      restaurantResult = await sql`
        SELECT id, name, city, custom_domain 
        FROM restaurants 
        WHERE custom_domain = ${cleanDomain}
      `
    }
    
    if (restaurantResult.rows.length === 0) {
      const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`
      restaurantResult = await sql`
        SELECT id, name, city, custom_domain 
        FROM restaurants 
        WHERE custom_domain = ${wwwDomain}
      `
    }
    
    if (restaurantResult.rows.length === 0) {
      return { title: "Restaurant nicht gefunden" }
    }
    
    const restaurant = restaurantResult.rows[0]
    const decodedZoneSlug = decodeURIComponent(zoneSlug).toLowerCase()
    
    const zoneResult = await sql`
      SELECT name FROM delivery_zones 
      WHERE restaurant_id = ${restaurant.id}
      AND LOWER(REPLACE(name, ' ', '-')) = ${decodedZoneSlug}
    `
    
    const zone = zoneResult.rows[0]
    
    return {
      title: zone ? `Lieferung ${zone.name} - ${restaurant.name}` : `Lieferung - ${restaurant.name}`,
      description: `${restaurant.name} - Ihr Lieferservice in ${restaurant.city}. Jetzt online bestellen!`,
    }
  } catch (error) {
    console.error('[ERROR] Metadata failed:', error)
    return { title: "Lieferzone" }
  }
}

export default async function DeliveryZonePage({
  params,
}: {
  params: Promise<{ domain: string; zoneSlug: string }>
}) {
  try {
    const { domain, zoneSlug } = await params
    const decodedZoneSlug = decodeURIComponent(zoneSlug).toLowerCase()
    
    // Try exact domain match first, then without www, then with www
    let restaurantResult = await sql`
      SELECT * FROM restaurants 
      WHERE custom_domain = ${domain}
    `
    
    if (restaurantResult.rows.length === 0) {
      const cleanDomain = domain.replace(/^www\./, '')
      restaurantResult = await sql`
        SELECT * FROM restaurants 
        WHERE custom_domain = ${cleanDomain}
      `
    }
    
    if (restaurantResult.rows.length === 0) {
      const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`
      restaurantResult = await sql`
        SELECT * FROM restaurants 
        WHERE custom_domain = ${wwwDomain}
      `
    }
    
    if (restaurantResult.rows.length === 0) {
      notFound()
    }
    
    const restaurant = restaurantResult.rows[0]
    
    const zoneResult = await sql`
      SELECT * FROM delivery_zones 
      WHERE restaurant_id = ${restaurant.id}
      AND LOWER(REPLACE(name, ' ', '-')) = ${decodedZoneSlug}
    `
    
    if (zoneResult.rows.length === 0) {
      notFound()
    }
    
    const zone = zoneResult.rows[0]
    const primaryColor = restaurant.primary_color || "#ef4444"
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
              ← Zurück zur Startseite
            </Link>
            <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-xl text-gray-600">Lieferung nach {zone.name}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                <h2 className="text-lg font-semibold">Liefergebiet</h2>
              </div>
              <p className="text-2xl font-bold">{zone.name}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-3">
                <Bike className="w-6 h-6" style={{ color: primaryColor }} />
                <h2 className="text-lg font-semibold">Liefergebühr</h2>
              </div>
              <p className="text-2xl font-bold">
                {zone.price ? `${Number(zone.price).toFixed(2)}€` : 'Kostenlos'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-3">
                <Euro className="w-6 h-6" style={{ color: primaryColor }} />
                <h2 className="text-lg font-semibold">Mindestbestellwert</h2>
              </div>
              <p className="text-2xl font-bold">
                {zone.minimum_order_value ? `${Number(zone.minimum_order_value).toFixed(2)}€` : 'Kein Minimum'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Jetzt bestellen
            </Link>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ERROR] Page failed:', error)
    notFound()
  }
}
