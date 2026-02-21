import { CentralAdminLoginForm } from "@/components/admin/central-login-form"
import { Suspense } from "react"

export const metadata = {
  title: "Restaurant Admin Login",
  description: "Zentraler Login für Restaurant-Administratoren"
}

export default function CentralAdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md animate-pulse">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="space-y-3 mt-8">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <CentralAdminLoginForm />
      </Suspense>
    </div>
  )
}
