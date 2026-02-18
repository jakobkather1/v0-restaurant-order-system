import { getSuperAdminSession } from "@/lib/auth"
import { getAllRestaurants, getSuperAdminStats, getPlatformSettings } from "@/lib/db"
import { SuperAdminDashboard } from "@/components/super-admin/dashboard"
import { SuperAdminLoginForm } from "@/components/super-admin/login-form"

export const metadata = {
  title: "Super Admin - Dashboard",
  description: "Super Admin Dashboard für das Restaurant-Bestellsystem",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SuperAdminPage() {
  const session = await getSuperAdminSession()

  // Show login if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <SuperAdminLoginForm />
      </div>
    )
  }

  let restaurants: any[] = []
  let stats = { activeRestaurants: 0, totalRevenue: 0, totalFees: 0, pendingDomainRequests: 0 }
  let platformSettings: Record<string, string> = {}
  let superAdminUsers: any[] = []
  let loadError = false

  try {
    restaurants = (await getAllRestaurants()) || []
  } catch (error) {
    console.error("Failed to load restaurants:", error)
    loadError = true
  }

  try {
    stats = (await getSuperAdminStats()) || { activeRestaurants: 0, totalRevenue: 0, totalFees: 0, pendingDomainRequests: 0 }
  } catch (error) {
    console.error("Failed to load stats:", error)
  }

  try {
    platformSettings = (await getPlatformSettings()) || {}
  } catch (error) {
    console.error("Failed to load platform settings:", error)
  }

  try {
    const { getSuperAdminUsers } = await import("@/lib/auth")
    superAdminUsers = (await getSuperAdminUsers()) || []
  } catch (error) {
    console.error("Failed to load super admin users:", error)
  }

  if (loadError && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verbindungsfehler</h2>
          <p className="text-gray-600 mb-6">
            Die Verbindung zur Datenbank konnte nicht hergestellt werden. Bitte versuche es erneut.
          </p>
          <a
            href="/super-admin"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Erneut versuchen
          </a>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminDashboard
      restaurants={restaurants}
      stats={stats}
      platformSettings={platformSettings}
      superAdminUsers={superAdminUsers}
      currentUser={session}
    />
  )
}
