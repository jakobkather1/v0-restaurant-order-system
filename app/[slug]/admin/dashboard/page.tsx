import {
  getRestaurantByIdentifier,
  getActiveOrders,
  getMenuForRestaurant,
  getDeliveryZones,
  getMonthlyRevenue,
  getAllergens,
} from "@/lib/db"
import { getRestaurantAdminSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { AdminDashboard } from "@/components/admin/dashboard"
import { DashboardWrapper } from "@/components/admin/dashboard-wrapper"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const restaurant = await getRestaurantByIdentifier(decodedSlug)

  if (!restaurant) {
    notFound()
  }

  const session = await getRestaurantAdminSession()
  if (!session || session.restaurantId !== restaurant.id) {
    redirect(`/${slug}/admin`)
  }

  const [orders, menu, deliveryZones, revenue, discountCodes, allergens, deliveryTimes, platformSettingsResult] = await Promise.all([
    getActiveOrders(restaurant.id),
    getMenuForRestaurant(restaurant.id),
    getDeliveryZones(restaurant.id),
    getMonthlyRevenue(restaurant.id),
    sql`SELECT * FROM discount_codes WHERE restaurant_id = ${restaurant.id} ORDER BY created_at DESC`,
    getAllergens(restaurant.id),
    sql`SELECT * FROM delivery_times WHERE restaurant_id = ${restaurant.id}`,
    sql`SELECT setting_key, setting_value FROM platform_settings WHERE setting_key IN ('platform_agbs', 'platform_avv')`,
  ])

  const platformSettings = platformSettingsResult.reduce((acc: Record<string, string>, row: { setting_key: string; setting_value: string }) => {
    acc[row.setting_key] = row.setting_value
    return acc
  }, {})

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
        isCustomDomain={false}
        platformSettings={platformSettings}
      />
    </DashboardWrapper>
  )
}
