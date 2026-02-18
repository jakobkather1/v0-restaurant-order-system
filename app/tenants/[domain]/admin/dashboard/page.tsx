import {
  getRestaurantByDomain,
  getActiveOrders,
  getMenuForRestaurant,
  getDeliveryZones,
  getMonthlyRevenue,
  getAllergens,
  sql,
} from "@/lib/db"
import { getRestaurantAdminSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/dashboard"
import { DashboardWrapper } from "@/components/admin/dashboard-wrapper"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Props {
  params: Promise<{ domain: string }>
}

export default async function CustomDomainAdminDashboardPage({ params }: Props) {
  const { domain } = await params

  // Look up restaurant by custom domain
  const restaurant = await getRestaurantByDomain(domain)

  if (!restaurant) {
    notFound()
  }

  // Verify admin is logged in and authorized
  const session = await getRestaurantAdminSession()
  if (!session || session.restaurantId !== restaurant.id) {
    redirect(`/admin`)
  }

  // Load all dashboard data in parallel
  const [orders, menu, deliveryZones, revenue, discountCodes, allergens, deliveryTimes] = await Promise.all([
    getActiveOrders(restaurant.id),
    getMenuForRestaurant(restaurant.id),
    getDeliveryZones(restaurant.id),
    getMonthlyRevenue(restaurant.id),
    sql`SELECT * FROM discount_codes WHERE restaurant_id = ${restaurant.id} ORDER BY created_at DESC`,
    getAllergens(restaurant.id),
    sql`SELECT * FROM delivery_times WHERE restaurant_id = ${restaurant.id}`,
  ])

  return (
    <DashboardWrapper restaurantId={restaurant.id}>
      <AdminDashboard
        restaurant={restaurant}
        orders={orders}
        categories={menu.categories}
        menuItems={menu.menuItems}
        variants={menu.variants}
        toppings={menu.toppings}
        deliveryZones={deliveryZones}
        deliveryTimes={deliveryTimes}
        revenue={revenue}
        discountCodes={discountCodes}
        allergens={allergens}
        isCustomDomain={true}
      />
    </DashboardWrapper>
  )
}
