import type { Restaurant } from "@/lib/types"

interface SchemaMarkupProps {
  restaurant: Restaurant
  reviewStats?: { avgRating: number; reviewCount: number }
  menuItems?: Array<{ name: string; description: string; price: number; image_url?: string }>
}

export function SchemaMarkup({ restaurant, reviewStats, menuItems }: SchemaMarkupProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"
  const restaurantUrl = restaurant.custom_domain || `${siteUrl}/${restaurant.slug}`

  // LocalBusiness / Restaurant Schema
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${restaurantUrl}#restaurant`,
    name: restaurant.name,
    description: restaurant.seo_description || restaurant.slogan || `Bestelle online bei ${restaurant.name}`,
    image: restaurant.hero_image_url || restaurant.logo_url,
    logo: restaurant.logo_url,
    url: restaurantUrl,
    telephone: restaurant.phone,
    email: restaurant.email,
    address: restaurant.address ? {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      postalCode: restaurant.postal_code,
      addressCountry: "DE"
    } : undefined,
    geo: restaurant.geo_lat && restaurant.geo_lng ? {
      "@type": "GeoCoordinates",
      latitude: restaurant.geo_lat,
      longitude: restaurant.geo_lng
    } : undefined,
    priceRange: restaurant.price_range || "$$",
    servesCuisine: restaurant.cuisine_type || "Restaurant",
    openingHoursSpecification: restaurant.opening_hours ? Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: getDayOfWeek(day),
      opens: hours.open,
      closes: hours.close
    })) : undefined,
    aggregateRating: reviewStats && reviewStats.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: reviewStats.avgRating,
      reviewCount: reviewStats.reviewCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    hasMenu: menuItems && menuItems.length > 0 ? `${restaurantUrl}#menu` : undefined,
    acceptsReservations: "False",
    paymentAccepted: "Cash, Credit Card",
    sameAs: [
      restaurant.facebook_url,
      restaurant.instagram_url,
      restaurant.google_business_url
    ].filter(Boolean)
  }

  // Menu Schema (if menu items provided)
  const menuSchema = menuItems && menuItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${restaurantUrl}#menu`,
    name: `${restaurant.name} Menu`,
    hasMenuSection: {
      "@type": "MenuSection",
      name: "Speisekarte",
      hasMenuItem: menuItems.slice(0, 20).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "EUR"
        },
        image: item.image_url
      }))
    }
  } : null

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: restaurant.name,
        item: restaurantUrl
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      {menuSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

function getDayOfWeek(day: string): string {
  const mapping: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday"
  }
  return mapping[day] || "Monday"
}
