import { redirect } from "next/navigation"

export const metadata = {
  title: "Super Admin - Dashboard",
  description: "Verwalte alle Restaurants",
}

export const dynamic = "force-dynamic"

export default function SuperAdminDashboardPage() {
  redirect("/super-admin")
}
