import { getSuperAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DomainRequestsManager } from "@/components/super-admin/domain-requests-manager"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SuperAdminDomainsPage() {
  const session = await getSuperAdminSession()

  if (!session) {
    redirect("/super-admin/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/super-admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Domain-Anfragen verwalten</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Domain-Anfragen von Restaurants und aktivieren Sie sie in Vercel.
        </p>
      </div>
      
      <DomainRequestsManager />
    </div>
  )
}
