"use client"

import type React from "react"

import { useState } from "react"
import { loginRestaurantAdminCentral } from "@/app/admin/login/actions"
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
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    try {
      const result = await loginRestaurantAdminCentral(username, password)
      
      // If we get here with an error, show it
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      
      // If redirect worked, we won't reach here
    } catch (error: any) {
      // Check if it's a Next.js redirect (expected behavior)
      if (error?.message?.includes('NEXT_REDIRECT')) {
        // Redirect is happening, this is success
        return
      }
      setError(error?.message || "Ein Fehler ist aufgetreten")
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
            <Label htmlFor="username">Benutzername</Label>
            <Input 
              id="username" 
              name="username" 
              type="text" 
              placeholder="Benutzername eingeben" 
              required 
              autoComplete="username"
            />
          </div>
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
