"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface RestaurantUsernameSettingsProps {
  restaurantId: number
  currentUsername: string | null
  restaurantName: string
}

export function RestaurantUsernameSettings({ 
  restaurantId, 
  currentUsername,
  restaurantName 
}: RestaurantUsernameSettingsProps) {
  const [username, setUsername] = useState(currentUsername || "")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSave() {
    if (!username.trim()) {
      toast.error("Benutzername darf nicht leer sein")
      return
    }

    // Validate username format (alphanumeric, dash, underscore)
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      toast.error("Benutzername muss 3-30 Zeichen lang sein und darf nur Buchstaben, Zahlen, - und _ enthalten")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/super-admin/restaurants/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, username })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Benutzername erfolgreich aktualisiert")
      } else {
        toast.error(data.error || "Fehler beim Aktualisieren")
      }
    } catch (error) {
      console.error("Error updating username:", error)
      toast.error("Verbindungsfehler")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Login Benutzername</CardTitle>
        <CardDescription>
          Setze einen eindeutigen Benutzernamen für den zentralen Admin-Login von {restaurantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Benutzername</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="restaurant-admin"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            3-30 Zeichen, nur Buchstaben, Zahlen, - und _
          </p>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm">
            <strong>Login URL:</strong> /admin/login
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Restaurant-Admins können sich mit diesem Benutzernamen und ihrem Passwort anmelden
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Wird gespeichert..." : "Benutzername speichern"}
        </Button>
      </CardContent>
    </Card>
  )
}
