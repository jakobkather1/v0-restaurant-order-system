"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Lock, User } from "lucide-react"
import { loginRestaurantAdminCentral } from "@/app/admin/login/actions"

export function CentralAdminLoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    console.log("[v0] Central Login - Attempting login for username:", username)

    try {
      const result = await loginRestaurantAdminCentral(username, password)
      
      if (result.success && result.redirectUrl) {
        console.log("[v0] Central Login - Success! Redirecting to:", result.redirectUrl)
        // Client-side redirect after successful login
        window.location.href = result.redirectUrl
        return
      }
      
      if (result.error) {
        console.log("[v0] Central Login - Error:", result.error)
        setError(result.error)
        setLoading(false)
        return
      }
      
      setError("Unerwarteter Fehler beim Login")
      setLoading(false)
    } catch (error: any) {
      console.error("[v0] Central Login - Exception:", error)
      setError(error?.message || "Login fehlgeschlagen")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <Lock className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold">Restaurant Admin Login</CardTitle>
        <CardDescription>Melden Sie sich mit Ihren Admin-Zugangsdaten an</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="restaurant-username" 
                className="pl-10"
                autoComplete="username"
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10"
                autoComplete="current-password"
                required 
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            disabled={loading}
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </Button>

          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Sie können sich auch direkt über Ihre Restaurant-URL anmelden:</p>
            <p className="mt-1 text-xs">yourdomain.com/<span className="font-mono text-foreground">restaurant-slug</span>/admin</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
