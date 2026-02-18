"use client"

import { useState } from "react"
import { loginSuperAdmin } from "@/app/super-admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, User } from "lucide-react"

export function SuperAdminLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await loginSuperAdmin(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Super Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Melden Sie sich an, um Restaurants zu verwalten</p>
      </div>
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-700">
            Benutzername
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="username" name="username" placeholder="admin" className="pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">
            Passwort
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Anmelden..." : "Anmelden"}
        </Button>
      </form>
    </div>
  )
}
