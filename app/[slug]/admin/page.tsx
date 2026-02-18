import { getRestaurantByIdentifier } from "@/lib/db"
import { getRestaurantAdminSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { AdminLoginForm } from "@/components/admin/login-form"

export default async function AdminLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  
  console.log("[v0] Admin page - Original slug:", slug)
  console.log("[v0] Admin page - Decoded slug:", decodedSlug)
  
  let restaurant
  try {
    restaurant = await getRestaurantByIdentifier(decodedSlug)
    console.log("[v0] Admin page - Restaurant found:", restaurant ? restaurant.name : "NOT FOUND")
  } catch (error) {
    console.error("[v0] Admin page - Error fetching restaurant:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Database Connection Error</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to connect to the database. Please try again in a few moments.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    console.log("[v0] Admin page - Restaurant not found for identifier:", decodedSlug)
    notFound()
  }

  const session = await getRestaurantAdminSession()
  if (session?.restaurantId === restaurant.id) {
    redirect(`/${slug}/admin/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <AdminLoginForm restaurant={restaurant} isCustomDomain={false} />
    </div>
  )
}
