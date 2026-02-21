"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export function usePushNotifications(restaurantId: number) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  // Check support and initial permission on mount
  useEffect(() => {
    // Detect iOS Chrome (which doesn't support push notifications)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isChrome = /CriOS/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    console.log("[v0] Browser detection:", {
      isIOS,
      isChrome,
      isSafari,
      userAgent: navigator.userAgent
    })

    // Check basic support
    let supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window

    // iOS Chrome doesn't support push notifications
    if (isIOS && isChrome) {
      console.log("[v0] iOS Chrome detected - Push notifications not supported")
      supported = false
    }

    console.log("[v0] Push notifications supported:", supported)
    setIsSupported(supported)

    if (supported) {
      try {
        setPermission(Notification.permission)
        console.log("[v0] Initial notification permission:", Notification.permission)

        // Check if already subscribed
        checkSubscription()
      } catch (error) {
        console.warn("[v0] Push notifications blocked by iframe/browser security:", error)
        setIsSupported(false)
        setPermission("denied")
      }
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
        console.log("[v0] Already subscribed:", !!subscription)
      }
    } catch (error) {
      console.error("[v0] Error checking subscription:", error)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isChrome = /CriOS/.test(navigator.userAgent)
      
      if (isIOS && isChrome) {
        toast.error("Chrome auf iOS unterstützt keine Push-Benachrichtigungen. Bitte verwenden Sie Safari.")
      } else {
        toast.error("Ihr Browser unterstützt keine Push-Benachrichtigungen")
      }
      return false
    }

    setIsLoading(true)
    console.log("[v0] Requesting notification permission...")

    try {
      const result = await Notification.requestPermission()
      console.log("[v0] Notification permission result:", result)
      setPermission(result)

      if (result === "granted") {
        await subscribeToPush()
        return true
      } else {
        toast.error("Benachrichtigungen wurden abgelehnt")
        return false
      }
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
      toast.error("Fehler beim Anfordern der Berechtigung")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    try {
      console.log("[v0] Starting push subscription...")
      console.log("[v0] Restaurant ID:", restaurantId)
      console.log("[v0] Current location:", window.location.href)
      console.log("[v0] Is HTTPS:", window.location.protocol === "https:")
      
      // Check if service worker is supported
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker wird von diesem Browser nicht unterstützt")
      }

      // Get VAPID public key from config endpoint
      console.log("[v0] Fetching VAPID config from /api/admin/push/config...")
      const configResponse = await fetch("/api/admin/push/config")
      
      if (!configResponse.ok) {
        console.error("[v0] Failed to fetch VAPID config:", configResponse.status)
        throw new Error(`Konfiguration konnte nicht geladen werden: ${configResponse.status}`)
      }
      
      const config = await configResponse.json()
      console.log("[v0] Config response:", { configured: config.configured, hasKey: !!config.publicKey, error: config.error })

      // EXPLICIT ALERT if VAPID keys are not configured
      if (!config.configured || !config.publicKey) {
        console.error("[v0] ❌ CRITICAL: Server has no VAPID keys configured!")
        console.error("[v0] Error from server:", config.error || "No error message")
        
        // Show alert to admin
        if (typeof window !== "undefined" && window.confirm) {
          alert(
            "⚠️ ACHTUNG: VAPID_PUBLIC_KEY in Vercel nicht gefunden!\n\n" +
            "Push-Benachrichtigungen können nicht aktiviert werden.\n\n" +
            "Bitte gehen Sie zu Vercel → Project Settings → Environment Variables\n" +
            "und fügen Sie NEXT_PUBLIC_VAPID_PUBLIC_KEY hinzu.\n\n" +
            `Fehler: ${config.error || "VAPID keys missing"}`
          )
        }
        
        setIsSupported(false)
        toast.error("Push-Benachrichtigungen nicht verfügbar: VAPID-Schlüssel fehlen")
        return
      }

      const publicKey = config.publicKey
      console.log("[v0] Got VAPID public key:", publicKey.substring(0, 20) + "...")

      // Validate and convert key before using it
      let applicationServerKey: Uint8Array
      try {
        console.log("[v0] Converting VAPID key, input length:", publicKey.length)
        console.log("[v0] Key preview:", publicKey.substring(0, 30) + "...")
        
        applicationServerKey = urlBase64ToUint8Array(publicKey)
        
        console.log("[v0] VAPID key converted successfully")
        console.log("[v0] Uint8Array length:", applicationServerKey.length, "bytes")
        console.log("[v0] Expected length: 65 bytes for P-256 public key")
        
        // P-256 public keys must be exactly 65 bytes (uncompressed format)
        if (applicationServerKey.length !== 65) {
          console.error("[v0] Invalid key length:", applicationServerKey.length, "bytes (expected 65)")
          throw new Error(`Invalid P-256 key: wrong length (${applicationServerKey.length} bytes, expected 65)`)
        }
        
        // Check if key starts with 0x04 (uncompressed point indicator for P-256)
        if (applicationServerKey[0] !== 0x04) {
          console.error("[v0] Invalid key format: first byte is", applicationServerKey[0], "(expected 0x04)")
          throw new Error("Invalid P-256 key: must be uncompressed format (start with 0x04)")
        }
        
        console.log("[v0] ✓ VAPID key is valid P-256 format")
      } catch (error) {
        console.error("[v0] Failed to convert/validate VAPID key:", error)
        throw new Error(error instanceof Error ? error.message : "VAPID-Schlüssel hat ungültiges Format")
      }

      // Register service worker
      console.log("[v0] Registering service worker at /sw.js...")
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("[v0] Service worker registered successfully:", registration.scope)
      
      // Wait for service worker to be ready
      console.log("[v0] Waiting for service worker to be ready...")
      await navigator.serviceWorker.ready
      console.log("[v0] Service worker is ready")

      // Subscribe to push
      console.log("[v0] Subscribing to push manager...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      })
      console.log("[v0] Subscribed to push manager successfully")
      console.log("[v0] Subscription endpoint:", subscription.endpoint.substring(0, 50) + "...")

      // Send subscription to server
      console.log("[v0] Sending subscription to server...")
      const subResponse = await fetch(`/api/admin/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          subscription: subscription.toJSON(),
        }),
      })

      if (!subResponse.ok) {
        const errorData = await subResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Server rejected subscription:", subResponse.status, errorData)
        throw new Error(`Server-Fehler: ${errorData.error || subResponse.statusText}`)
      }

      const result = await subResponse.json()
      console.log("[v0] Subscription saved to server successfully:", result)
      
      setIsSubscribed(true)
      toast.success("Push-Benachrichtigungen aktiviert!")
      
    } catch (error) {
      console.error("[v0] Error subscribing to push:", error)
      
      // Provide specific error messages
      let errorMessage = "Fehler beim Aktivieren der Benachrichtigungen"
      
      if (error instanceof Error) {
        if (error.message.includes("VAPID")) {
          errorMessage = "VAPID-Konfigurationsfehler. Bitte Administrator kontaktieren."
        } else if (error.message.includes("Service Worker")) {
          errorMessage = "Service Worker konnte nicht registriert werden."
        } else if (error.message.includes("Server")) {
          errorMessage = error.message
        } else if (error.name === "NotAllowedError") {
          errorMessage = "Benachrichtigungen wurden blockiert. Bitte in Browser-Einstellungen erlauben."
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Ihr Browser unterstützt keine Push-Benachrichtigungen."
        } else {
          errorMessage = error.message || errorMessage
        }
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          setIsSubscribed(false)
          toast.success("Push-Benachrichtigungen deaktiviert")
        }
      }
    } catch (error) {
      console.error("[v0] Error unsubscribing from push:", error)
      toast.error("Fehler beim Deaktivieren")
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Validate input
  if (!base64String || typeof base64String !== 'string') {
    throw new Error("VAPID Key missing or invalid - must be a non-empty string")
  }

  if (base64String.length < 80) {
    throw new Error(`VAPID Key too short (${base64String.length} chars) - expected at least 80`)
  }

  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  } catch (error) {
    throw new Error(`Failed to decode VAPID key: ${error instanceof Error ? error.message : 'Invalid base64'}`)
  }
}
