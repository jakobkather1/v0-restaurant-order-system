import {
  getRestaurantByIdentifier,
  getMenuForRestaurant,
  getDeliveryZones,
  isRestaurantOpen,
  getRestaurantReviewStats,
  getApprovedReviews,
  getAllergens,
} from "@/lib/db"
import {
  MOCK_RESTAURANT,
  MOCK_CATEGORIES,
  MOCK_MENU_ITEMS,
  MOCK_VARIANTS,
  MOCK_TOPPINGS,
  MOCK_DELIVERY_ZONES,
  MOCK_REVIEW_STATS,
  MOCK_REVIEWS,
  MOCK_ALLERGENS,
} from "@/lib/mock-data"
import { OrderTerminal } from "@/components/terminal/order-terminal"
import { NotFoundPage } from "@/components/not-found-page"
import { DbErrorPage } from "@/components/db-error-page"
import { SchemaMarkup } from "@/components/seo/schema-markup"
import type { Metadata } from "next"

// ISR: Cache pages for 60 seconds, then revalidate in background
export const revalidate = 60

const STATIC_ROUTES = ["super-admin", "admin", "platform-legal", "legal"]
const RESERVED_PATHS = ["api", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]

interface Props {
  params: Promise<{ slug: string }>
}

function isMockSlug(slug: string): boolean {
  return slug.toLowerCase() === "bella-marina"
}

async function getRestaurantData(slug: string) {
  let useMockData = false
  let restaurant = null
  let dbError: string | null = null

  if (STATIC_ROUTES.includes(slug) || RESERVED_PATHS.includes(slug)) {
    return { restaurant: null, useMockData: false, dbError: null, isStaticRoute: true }
  }

  try {
    restaurant = await getRestaurantByIdentifier(slug)
  } catch (error) {
    const errorMsg = (error as Error)?.message || "Unknown error"
    dbError = errorMsg

    if (isMockSlug(slug)) {
      useMockData = true
      restaurant = { ...MOCK_RESTAURANT, slug }
    }
  }

  if (!restaurant && isMockSlug(slug)) {
    useMockData = true
    restaurant = { ...MOCK_RESTAURANT, slug }
  }

  return { restaurant, useMockData, dbError, isStaticRoute: false }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  if (STATIC_ROUTES.includes(decodedSlug) || RESERVED_PATHS.includes(decodedSlug)) {
    return {}
  }

  try {
    const { restaurant, useMockData } = await getRestaurantData(decodedSlug)

    if (!restaurant) {
      return { title: "Restaurant Not Found" }
    }

    const title = restaurant.seo_title || `${restaurant.name} - Online Bestellen`
    const description =
      restaurant.seo_description ||
      restaurant.slogan ||
      `Bestelle jetzt bei ${restaurant.name}. Frische Gerichte, schnelle Lieferung.`
    const ogImage = restaurant.logo_url || restaurant.og_image || restaurant.hero_image_url
    
    // Dynamic canonical based on current host
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const canonicalUrl = `${protocol}://${host}/${restaurant.slug}`

    return {
      title: useMockData ? `[Preview] ${title}` : title,
      description,
      authors: [{ name: restaurant.owner_name || restaurant.name }],
      icons: {
        icon: "/api/favicon",
        shortcut: "/api/favicon",
        apple: "/api/favicon",
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: restaurant.name,
        type: "website",
        locale: "de_DE",
        images: ogImage
          ? [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: restaurant.name,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: !useMockData,
        follow: !useMockData,
        googleBot: {
          index: !useMockData,
          follow: !useMockData,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    }
  } catch {
    return { title: "Restaurant Not Found" }
  }
}

// Generate JSON-LD structured data
function generateStructuredData(
  restaurant: {
    id: number
    name: string
    slug: string
    slogan?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    logo_url?: string | null
    hero_image_url?: string | null
    opening_hours?: Record<string, { open: string; close: string }> | null
    seo_description?: string | null
    geo_lat?: number | null
    geo_lng?: number | null
    price_range?: string | null
    cuisine_type?: string | null
    custom_domain?: string | null
    facebook_url?: string | null
    instagram_url?: string | null
  },
  reviewStats: { avgRating: number; reviewCount: number },
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"
  const canonicalUrl = restaurant.custom_domain || `${siteUrl}/${restaurant.slug}`

  const openingHoursSpec = []
  if (restaurant.opening_hours) {
    const dayMapping: Record<string, string> = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    }

    for (const [day, hours] of Object.entries(restaurant.opening_hours)) {
      if (hours.open && hours.close) {
        openingHoursSpec.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayMapping[day],
          opens: hours.open,
          closes: hours.close,
        })
      }
    }
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": canonicalUrl,
    name: restaurant.name,
    description: restaurant.seo_description || restaurant.slogan || `Bestelle online bei ${restaurant.name}`,
    url: canonicalUrl,
    telephone: restaurant.phone || undefined,
    email: restaurant.email || undefined,
    image: restaurant.hero_image_url || restaurant.logo_url || undefined,
    logo: restaurant.logo_url || undefined,
    priceRange: restaurant.price_range || "$$",
    servesCuisine: restaurant.cuisine_type || undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
        }
      : undefined,
    geo:
      restaurant.geo_lat && restaurant.geo_lng
        ? {
            "@type": "GeoCoordinates",
            latitude: restaurant.geo_lat,
            longitude: restaurant.geo_lng,
          }
        : undefined,
    openingHoursSpecification: openingHoursSpec.length > 0 ? openingHoursSpec : undefined,
    aggregateRating:
      reviewStats.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: reviewStats.avgRating.toFixed(1),
            reviewCount: reviewStats.reviewCount,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    sameAs: [restaurant.facebook_url, restaurant.instagram_url].filter(Boolean),
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: canonicalUrl,
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"],
    },
  }

  return JSON.stringify(structuredData, (_, value) => (value === undefined ? undefined : value))
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params

  if (STATIC_ROUTES.includes(slug) || RESERVED_PATHS.includes(slug)) {
    return null
  }

  const { restaurant, useMockData, dbError } = await getRestaurantData(slug)

  if (!restaurant && dbError && !isMockSlug(slug)) {
    return <DbErrorPage slug={slug} error={dbError} />
  }

  if (!restaurant || !restaurant.is_active) {
    return <NotFoundPage />
  }

  let menu, deliveryZones, reviewStats, reviews, allergens

  if (useMockData) {
    menu = {
      categories: MOCK_CATEGORIES,
      menuItems: MOCK_MENU_ITEMS,
      variants: MOCK_VARIANTS,
      toppings: MOCK_TOPPINGS,
      allergens: MOCK_ALLERGENS,
      dishAllergens: [], // Added dishAllergens for mock data
    }
    deliveryZones = MOCK_DELIVERY_ZONES
    reviewStats = MOCK_REVIEW_STATS
    reviews = MOCK_REVIEWS
    allergens = MOCK_ALLERGENS
  } else {
    try {
      ;[menu, deliveryZones, reviewStats, reviews, allergens] = await Promise.all([
        getMenuForRestaurant(restaurant.id),
        getDeliveryZones(restaurant.id),
        getRestaurantReviewStats(restaurant.id),
        getApprovedReviews(restaurant.id, 12),
        getAllergens(restaurant.id),
      ])
    } catch (error) {
      menu = {
        categories: MOCK_CATEGORIES,
        menuItems: MOCK_MENU_ITEMS,
        variants: MOCK_VARIANTS,
        toppings: MOCK_TOPPINGS,
        allergens: MOCK_ALLERGENS,
        dishAllergens: [], // Added dishAllergens for error fallback
      }
      deliveryZones = MOCK_DELIVERY_ZONES
      reviewStats = MOCK_REVIEW_STATS
      reviews = MOCK_REVIEWS
    }
  }

  const dishAllergensMap: Record<number, number[]> = {}
  if (menu.dishAllergens) {
    for (const da of menu.dishAllergens) {
      if (!dishAllergensMap[da.menu_item_id]) {
        dishAllergensMap[da.menu_item_id] = []
      }
      dishAllergensMap[da.menu_item_id].push(da.allergen_id)
    }
  }

  const isOpen = isRestaurantOpen(restaurant.opening_hours || {})

  return (
    <>
      <SchemaMarkup 
        restaurant={restaurant} 
        reviewStats={reviewStats}
        menuItems={menu.menuItems?.slice(0, 20).map(item => ({
          name: item.name,
          description: item.description || '',
          price: item.price,
          image_url: item.image_url || undefined
        }))}
      />

      {useMockData && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black text-center py-2 px-4 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Preview Mode - Mock-Daten werden angezeigt (Restaurant nicht in DB gefunden)
          </span>
        </div>
      )}

      {/* Debug element to verify background color is being passed from database */}
      <div 
        data-debug-bg-color={restaurant.background_color || "#ffffff"}
        data-debug-text-color={restaurant.text_color || "#1f2937"}
        data-debug-primary-color={restaurant.primary_color || "#0369a1"}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      
      {/* Main wrapper with inline styles for SSR - ensures colors render before JS hydration */}
      <div 
        className={`min-h-screen ${useMockData ? "pt-10" : ""}`}
        style={{ 
          backgroundColor: restaurant.background_color || "#ffffff",
          color: restaurant.text_color || "#1f2937",
        }}
      >
        <OrderTerminal
          restaurant={restaurant}
          categories={menu.categories}
          menuItems={menu.menuItems}
          variants={menu.variants}
          toppings={menu.toppings}
          deliveryZones={deliveryZones}
          isOpen={isOpen}
          reviewStats={reviewStats}
          reviews={reviews}
          allergens={menu.allergens || []}
          dishAllergens={dishAllergensMap}
          isCustomDomain={false}
        />
      </div>
    </>
  )
}
