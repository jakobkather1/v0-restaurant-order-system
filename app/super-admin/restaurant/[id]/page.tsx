import { getRestaurantById, getMonthlyRevenue, getRestaurantBillings } from "@/lib/db"
import { RestaurantDetail } from "@/components/super-admin/restaurant-detail"
import type { Restaurant, MonthlyRevenue, RestaurantBilling } from "@/lib/types"

export const metadata = {
  title: "Restaurant Details - Super Admin",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RestaurantManagePage({ params }: { params: Promise<{ id: string }> }) {
  // Skip auth check for v0 preview - in production, enable this
  // const session = await getSuperAdminSession()
  // if (!session) {
  //   redirect("/super-admin")
  // }

  const { id } = await params
  const restaurantId = Number.parseInt(id)

  let restaurant: Restaurant | null = null
  let revenue: MonthlyRevenue[] = []
  let billings: RestaurantBilling[] = []

  try {
    const [restaurantData, revenueData, billingsData] = await Promise.all([
      getRestaurantById(restaurantId),
      getMonthlyRevenue(restaurantId),
      getRestaurantBillings(restaurantId),
    ])
    restaurant = restaurantData
    revenue = revenueData || []
    billings = billingsData || []
  } catch (error) {
    console.error("Failed to load restaurant data:", error)
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Restaurant nicht gefunden</h1>
          <p className="text-muted-foreground">ID: {id}</p>
          <a href="/super-admin" className="text-primary underline">
            Zurück zum Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <RestaurantDetail restaurant={restaurant} revenue={revenue} billings={billings} />
}
