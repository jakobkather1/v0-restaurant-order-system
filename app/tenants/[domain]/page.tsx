import { Metadata } from "next"
import {
  getRestaurantByDomain,
  getMenuForRestaurant,
  getDeliveryZones,
  isRestaurantOpen,
  getRestaurantReviewStats,
  getApprovedReviews,
  getAllergens,
} from "@/lib/db"
import { OrderTerminal } from "@/components/terminal/order-terminal"
import { NotFoundPage } from "@/components/not-found-page"
import { DbErrorPage } from "@/components/db-error-page"
import { SchemaMarkup } from "@/components/seo/schema-markup"

// ISR: Cache pages for 60 seconds, then revalidate in background
export const revalidate = 60
export const dynamicParams = true

interface Props {
  params: Promise<{ domain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params

  try {
    const restaurant = await getRestaurantByDomain(domain)

    if (!restaurant) {
      return { title: "Restaurant Not Found" }
    }

    const title = restaurant.seo_title || `${restaurant.name} - Online Bestellen`
    const description =
      restaurant.seo_description ||
      restaurant.slogan ||
      `Bestelle jetzt bei ${restaurant.name}. Frische Gerichte, schnelle Lieferung.`
    const ogImage = restaurant.logo_url || restaurant.og_image || restaurant.hero_image_url
    const canonicalUrl = `https://${domain}`

    return {
      title,
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
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
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

export default async function TenantPage({ params }: Props) {
  const { domain } = await params

  let restaurant
  let dbError: string | null = null

  try {
    restaurant = await getRestaurantByDomain(domain)
  } catch (error) {
    const errorMsg = (error as Error)?.message || "Unknown error"
    dbError = errorMsg
  }

  if (!restaurant && dbError) {
    return <DbErrorPage slug={domain} error={dbError} />
  }

  if (!restaurant || !restaurant.is_active) {
    return <NotFoundPage />
  }

  let menu, deliveryZones, reviewStats, reviews, allergens

  try {
    ;[menu, deliveryZones, reviewStats, reviews, allergens] = await Promise.all([
      getMenuForRestaurant(restaurant.id),
      getDeliveryZones(restaurant.id),
      getRestaurantReviewStats(restaurant.id),
      getApprovedReviews(restaurant.id, 12),
      getAllergens(restaurant.id),
    ])
  } catch (error) {
    console.error("[v0] TENANT PAGE: Error loading restaurant data:", error)
    return <DbErrorPage slug={domain} error={(error as Error)?.message || "Unknown error"} />
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
        className="min-h-screen"
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
          isCustomDomain={true}
        />
      </div>
    </>
  )
}
