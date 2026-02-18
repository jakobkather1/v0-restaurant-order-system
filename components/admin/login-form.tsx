"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { loginRestaurantAdmin } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Restaurant } from "@/lib/types"

interface AdminLoginFormProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
}

export function AdminLoginForm({ restaurant, isCustomDomain }: AdminLoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detectedCustomDomain, setDetectedCustomDomain] = useState(false)

  useEffect(() => {
    // Auto-detect if we're on a custom domain
    if (typeof window !== "undefined" && isCustomDomain === undefined) {
      const hostname = window.location.hostname
      const platformDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "order-terminal.de"
      const isVercel = hostname.includes("vercel.app") || hostname.includes("vercel.dev")
      const isLocalhost = hostname.startsWith("localhost")
      const isPlatform = hostname === platformDomain || hostname === `www.${platformDomain}`
      
      const detected = !isPlatform && !isVercel && !isLocalhost
      console.log("[v0] Admin Login - Hostname:", hostname)
      console.log("[v0] Admin Login - Platform Domain:", platformDomain)
      console.log("[v0] Admin Login - Is Custom Domain (detected):", detected)
      setDetectedCustomDomain(detected)
    }
  }, [isCustomDomain])

  const useCustomDomain = isCustomDomain !== undefined ? isCustomDomain : detectedCustomDomain
  
  console.log("[v0] Admin Login - isCustomDomain prop:", isCustomDomain)
  console.log("[v0] Admin Login - useCustomDomain (final):", useCustomDomain)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string

    const result = await loginRestaurantAdmin(restaurant.id, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Redirect based on domain type
      const dashboardPath = useCustomDomain 
        ? "/admin/dashboard" 
        : `/${restaurant.slug}/admin/dashboard`
      console.log("[v0] Admin Login - Redirecting to:", dashboardPath)
      console.log("[v0] Admin Login - Using custom domain:", useCustomDomain)
      router.push(dashboardPath)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: restaurant.primary_color }}
        >
          <Lock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
        <CardDescription>Admin-Panel Login</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            style={{ backgroundColor: restaurant.primary_color }}
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
