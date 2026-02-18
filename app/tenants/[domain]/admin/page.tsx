import { getRestaurantByDomain } from "@/lib/db"
import { getRestaurantAdminSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { AdminLoginForm } from "@/components/admin/login-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Props {
  params: Promise<{ domain: string }>
}

export default async function CustomDomainAdminPage({ params }: Props) {
  const { domain } = await params

  // Look up restaurant by custom domain
  const restaurant = await getRestaurantByDomain(domain)

  if (!restaurant) {
    notFound()
  }

  // Check if admin is already logged in
  const session = await getRestaurantAdminSession()
  if (session?.restaurantId === restaurant.id) {
    // Redirect to dashboard on custom domain
    redirect(`/admin/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <AdminLoginForm restaurant={restaurant} isCustomDomain={true} />
    </div>
  )
}
