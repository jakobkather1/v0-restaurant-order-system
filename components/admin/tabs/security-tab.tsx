"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, AlertTriangle, Info, Shield, Bell } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Restaurant } from "@/lib/types"
import { updateRevenueVisibility, setEncryptedAdminPassword } from "@/app/[slug]/admin/actions"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface SecurityTabProps {
  restaurant: Restaurant
}

export function SecurityTab({ restaurant }: SecurityTabProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Push notifications hook
  const {
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    isSupported: isPushSupported,
    subscribe,
    unsubscribe,
  } = usePushNotifications(restaurant.id)

  const [allowRevenueView, setAllowRevenueView] = useState(restaurant.allow_super_admin_revenue_view ?? true)
  const [revenuePassword, setRevenuePassword] = useState("")
  const [showRevenuePassword, setShowRevenuePassword] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("")
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  function handleToggleClick() {
    if (allowRevenueView) {
      // User wants to DISABLE - show password prompt
      setShowPasswordPrompt(true)
    } else {
      // User wants to ENABLE - no password needed (most secure for Super-Admin)
      handleEnableRevenue()
    }
  }

  async function handleEnableRevenue() {
    setLoading(true)
    const result = await updateRevenueVisibility(true, null)

    if (result?.error) {
      showMessage("error", result.error)
    } else {
      setAllowRevenueView(true)
      showMessage("success", "Umsatz-Einsicht aktiviert")
    }
    setLoading(false)
  }

  async function handleDisableRevenue() {
    if (!revenuePassword) {
      showMessage("error", "Bitte geben Sie das Sicherheitspasswort ein")
      return
    }

    setLoading(true)
    const result = await updateRevenueVisibility(false, revenuePassword)

    if (result?.error) {
      showMessage("error", result.error)
    } else {
      setAllowRevenueView(false)
      setRevenuePassword("")
      setShowPasswordPrompt(false)
      showMessage("success", "Umsatz-Einsicht deaktiviert")
    }
    setLoading(false)
  }

  async function handleSetAdminPassword() {
    if (!newAdminPassword || newAdminPassword.length < 8) {
      showMessage("error", "Passwort muss mindestens 8 Zeichen lang sein")
      return
    }

    if (newAdminPassword !== confirmAdminPassword) {
      showMessage("error", "Passwörter stimmen nicht überein")
      return
    }

    setLoading(true)
    const result = await setEncryptedAdminPassword(newAdminPassword)

    if (result?.error) {
      showMessage("error", result.error)
    } else {
      setNewAdminPassword("")
      setConfirmAdminPassword("")
      showMessage("success", "Admin-Passwort wurde gesetzt")
    }
    setLoading(false)
  }

  const hasSecurityPassword = !!restaurant.super_admin_restaurant_password

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sicherheit & Datenschutz</h2>
        <p className="text-gray-600">Verwalte Zugriffsrechte und Passwörter</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Push Notifications */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-gray-900">Push-Benachrichtigungen</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Erhalten Sie Browser-Benachrichtigungen für neue Bestellungen in Echtzeit, auch wenn das Dashboard geschlossen ist.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Aktivieren Sie Echtzeit-Benachrichtigungen für neue Bestellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPushSupported && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Browser unterstützt keine Push-Benachrichtigungen</p>
                <p className="text-sm text-amber-700 mt-1">
                  Ihr Browser oder Gerät unterstützt keine Web Push-Benachrichtigungen. 
                  Verwenden Sie Safari auf iOS 16.4+ oder Chrome/Firefox/Edge auf Desktop.
                </p>
              </div>
            </div>
          )}

          {isPushSupported && (
            <div
              className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                isSubscribed ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${isSubscribed ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                />
                <div>
                  <Label className="text-base font-medium">
                    {isSubscribed ? "Benachrichtigungen aktiv" : "Benachrichtigungen deaktiviert"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed
                      ? "Sie erhalten Push-Benachrichtigungen für neue Bestellungen"
                      : "Aktivieren Sie Push-Benachrichtigungen, um über neue Bestellungen informiert zu werden"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bell className={`h-5 w-5 ${isSubscribed ? "text-green-600" : "text-gray-400"}`} />
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      subscribe()
                    } else {
                      unsubscribe()
                    }
                  }}
                  disabled={isPushLoading}
                />
              </div>
            </div>
          )}

          {isPushSupported && permission === "denied" && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Benachrichtigungen blockiert</p>
                <p className="text-sm text-red-700 mt-1">
                  Sie haben Push-Benachrichtigungen in Ihren Browser-Einstellungen blockiert. 
                  Bitte erlauben Sie Benachrichtigungen für diese Website in Ihren Browser-Einstellungen.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Visibility Toggle */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-gray-900">Umsatz-Einsicht für Super-Admin</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Standardmäßig wird die Umsatzeinsicht mit der Plattformadministration geteilt. Die Deaktivierung
                    erfordert Ihren spezifischen Administrations-Sicherheitsschlüssel.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Erlauben Sie dem Plattformbetreiber, Ihre Umsatzdaten einzusehen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`flex items-center justify-between rounded-lg border-2 p-4 transition-colors ${
              allowRevenueView ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${allowRevenueView ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              <div>
                <Label className="text-base font-medium">
                  {allowRevenueView ? "Umsatz-Einsicht aktiv" : "Umsatz-Einsicht deaktiviert"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {allowRevenueView
                    ? "Der Super-Admin kann Ihre Umsatzdaten einsehen"
                    : "Ihre Umsatzdaten sind privat und nicht einsehbar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allowRevenueView ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400" />
              )}
              <Switch
                checked={allowRevenueView}
                onCheckedChange={handleToggleClick}
                disabled={loading || (!hasSecurityPassword && allowRevenueView)}
              />
            </div>
          </div>

          {!hasSecurityPassword && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Kein Sicherheitspasswort gesetzt</p>
                <p className="text-sm text-amber-700 mt-1">
                  Der Super-Admin muss zuerst ein Sicherheitspasswort für dieses Restaurant setzen, bevor Sie die
                  Umsatz-Einsicht deaktivieren können.
                </p>
              </div>
            </div>
          )}

          {showPasswordPrompt && hasSecurityPassword && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Lock className="h-4 w-4" />
                <Label className="font-medium">Sicherheitspasswort erforderlich</Label>
              </div>
              <p className="text-sm text-red-700">
                Geben Sie das vom Super-Admin gesetzte Sicherheitspasswort ein, um die Umsatz-Einsicht zu deaktivieren.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showRevenuePassword ? "text" : "password"}
                    value={revenuePassword}
                    onChange={(e) => setRevenuePassword(e.target.value)}
                    placeholder="Sicherheitspasswort eingeben"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowRevenuePassword(!showRevenuePassword)}
                  >
                    {showRevenuePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleDisableRevenue} disabled={loading || !revenuePassword} variant="destructive">
                  {loading ? "..." : "Deaktivieren"}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordPrompt(false)
                    setRevenuePassword("")
                  }}
                  variant="outline"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encrypted Admin Password */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-gray-900">Primäres Admin-Passwort</CardTitle>
          </div>
          <CardDescription>Setzen Sie ein sicheres Passwort für den Restaurant-Admin-Zugang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Sicherheitshinweis</p>
              <p className="text-sm text-amber-700 mt-1">
                Dieses Passwort ist verschlüsselt und kann vom Systembetreiber weder eingesehen noch zurückgesetzt
                werden, falls Sie es verlieren während Sie abgemeldet sind. Bewahren Sie es sicher auf!
              </p>
            </div>
          </div>

          {restaurant.admin_password_set && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Admin-Passwort ist bereits gesetzt
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newAdminPassword">Neues Passwort</Label>
              <div className="relative">
                <Input
                  id="newAdminPassword"
                  type={showAdminPassword ? "text" : "password"}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmAdminPassword">Passwort bestätigen</Label>
              <Input
                id="confirmAdminPassword"
                type="password"
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
                placeholder="Passwort wiederholen"
              />
            </div>

            <Button
              onClick={handleSetAdminPassword}
              disabled={loading || !newAdminPassword || !confirmAdminPassword}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {restaurant.admin_password_set ? "Passwort ändern" : "Passwort setzen"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
