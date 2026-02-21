"use client"

import type React from "react"

import { useState } from "react"
import { loginRestaurantAdmin } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Lock } from "lucide-react"
import type { Restaurant } from "@/lib/types"

interface AdminLoginFormProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
}

export function AdminLoginForm({ restaurant, isCustomDomain }: AdminLoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string

    console.log("[v0] LoginForm - Submitting login for restaurant:", restaurant.id)

    try {
      const result = await loginRestaurantAdmin(restaurant.id, password, restaurant.slug, isCustomDomain)
      
      console.log("[v0] LoginForm - Login result:", result)
      
      if (result.success && result.redirectUrl) {
        console.log("[v0] LoginForm - Login successful, redirecting to:", result.redirectUrl)
        // Add small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = result.redirectUrl
        return
      }
      
      if (result.error) {
        console.log("[v0] LoginForm - Login error:", result.error)
        setError(result.error)
        setLoading(false)
        return
      }
      
      console.log("[v0] LoginForm - Unexpected result")
      setError("Unerwarteter Fehler beim Login")
      setLoading(false)
    } catch (error: any) {
      console.error("[v0] LoginForm - Exception:", error)
      setError(error?.message || "Login fehlgeschlagen")
      setLoading(false)
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
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              autoComplete="current-password"
            />
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
