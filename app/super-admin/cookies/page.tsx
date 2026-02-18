import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getCookieCategories, getCookieDefinitions, getCookieSettings } from "./actions"
import { CookieManagement } from "./cookie-management"
import { AnalyticsInfo } from "./analytics-info"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CookiesPage() {
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.get("super_admin_session")

  if (!isLoggedIn) {
    redirect("/super-admin")
  }

  const [categories, cookieDefinitions, settings] = await Promise.all([
    getCookieCategories(),
    getCookieDefinitions(),
    getCookieSettings()
  ])

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold">Cookie-Manager</h1>
        <p className="text-gray-600 mt-1">Verwalte Cookie-Kategorien, Definitionen und Analytics</p>
      </div>

      <CookieManagement 
        initialCategories={categories}
        initialCookies={cookieDefinitions}
        initialSettings={settings}
      />

      <AnalyticsInfo />
    </div>
  )
}
