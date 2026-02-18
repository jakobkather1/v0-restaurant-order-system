"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, X } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface PushPermissionBannerProps {
  restaurantId: number
}

export function PushPermissionBanner({ restaurantId }: PushPermissionBannerProps) {
  const { permission, requestPermission, isLoading } = usePushNotifications(restaurantId)
  const [dismissed, setDismissed] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    console.log("[v0] PushPermissionBanner mounted for restaurant:", restaurantId)
  }, [restaurantId])

  useEffect(() => {
    // Detect iOS Chrome (which doesn't support push notifications)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isChrome = /CriOS/.test(navigator.userAgent)
    
    // Don't show banner on iOS Chrome
    if (isIOS && isChrome) {
      console.log("[v0] iOS Chrome detected - hiding push notification banner")
      setShouldShow(false)
      return
    }

    // Show banner if permission not granted (ignore denied state - allow retry)
    const hasPermission = permission === "granted"
    
    console.log("[v0] Permission state:", { permission, hasPermission, isIOS, isChrome })
    setShouldShow(!hasPermission)
  }, [permission])

  const handleDismiss = () => {
    // Only dismiss for current session, not permanently
    setDismissed(true)
  }

  const handleEnable = async () => {
    const success = await requestPermission()
    if (success) {
      setDismissed(true)
    }
  }

  if (!shouldShow || dismissed) {
    return null
  }

  return (
    <div className="mx-3 sm:mx-4 md:mx-6 mb-0">
      <Card className="p-3 sm:p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/50 shadow-sm">
        <div className="flex items-start gap-2 sm:gap-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1.5 sm:p-2 flex-shrink-0">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm mb-1 text-blue-900 dark:text-blue-100">
              Aktivieren Sie Benachrichtigungen für neue Bestellungen
            </h3>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none">
              Erhalten Sie sofortige Push-Benachrichtigungen, wenn neue Bestellungen eingehen, 
              auch wenn das Admin-Panel nicht geöffnet ist.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                onClick={handleEnable}
                disabled={isLoading}
                className="text-xs sm:text-sm h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Aktiviere..." : "Aktivieren"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismiss}
                className="text-xs sm:text-sm h-8 sm:h-9 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
              >
                Später
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 bg-transparent"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
