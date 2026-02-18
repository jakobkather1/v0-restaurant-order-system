"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Check, X, AlertCircle } from "lucide-react"

export default function TestNotificationsPage() {
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log("[Test]", message)
  }

  const testNotificationPermission = async () => {
    addResult("=== Step 1: Environment Check ===")
    
    // Check PWA mode
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || 
                  (window.navigator as any).standalone === true
    
    if (isPWA) {
      addResult("✓ Running in PWA mode (standalone)")
    } else {
      addResult("⚠️ Not in PWA mode - Add to Home Screen for best experience")
      addResult("  iOS: Safari > Share > Add to Home Screen")
      addResult("  Android: Chrome > Menu > Add to Home screen")
    }
    
    // Check secure context
    const isSecure = window.isSecureContext
    if (isSecure) {
      addResult("✓ Secure context (HTTPS or localhost)")
    } else {
      addResult("❌ Not in secure context - HTTPS required for notifications")
      return false
    }
    
    addResult("\n=== Step 2: Notification Permission ===")
    
    if (!("Notification" in window)) {
      addResult("❌ Notification API not supported in this browser")
      addResult("  iOS: Requires iOS 16.4+ and Safari")
      addResult("  Android: Chrome, Firefox, Edge supported")
      return false
    }
    
    addResult(`✓ Notification API supported. Current permission: ${Notification.permission}`)
    
    if (Notification.permission === "granted") {
      addResult("✓ Permission already granted")
      return true
    }
    
    if (Notification.permission === "denied") {
      addResult("❌ Permission denied. Please reset in browser settings.")
      return false
    }
    
    addResult("Requesting permission...")
    const result = await Notification.requestPermission()
    addResult(`Permission result: ${result}`)
    
    return result === "granted"
  }

  const testServiceWorker = async () => {
    addResult("\n=== Step 3: Service Worker ===")
    
    if (!("serviceWorker" in navigator)) {
      addResult("❌ Service Worker not supported in this browser")
      return false
    }
    
    try {
      // Check if already registered by ServiceWorkerProvider
      const existing = await navigator.serviceWorker.getRegistration("/")
      if (existing) {
        addResult("✓ Service Worker already registered (from layout)")
        addResult(`  Scope: ${existing.scope}`)
        addResult(`  Active: ${existing.active?.state || "unknown"}`)
      } else {
        addResult("⚠️ Service Worker not yet registered, registering now...")
        const registration = await navigator.serviceWorker.register("/sw.js")
        addResult(`✓ Service Worker registered: ${registration.scope}`)
      }
      
      await navigator.serviceWorker.ready
      addResult("✓ Service Worker ready and active")
      
      return true
    } catch (error) {
      addResult(`❌ Service Worker error: ${error}`)
      return false
    }
  }

  const testPushSubscription = async (restaurantId: number) => {
    addResult(`\n=== Step 4: Push Subscription (Restaurant ${restaurantId}) ===`)
    
    try {
      // Get VAPID key
      const configRes = await fetch("/api/admin/push/config")
      const config = await configRes.json()
      
      if (!config.configured || !config.publicKey) {
        addResult("❌ Server VAPID keys not configured")
        return false
      }
      
      addResult(`✓ Got VAPID public key (${config.publicKey.substring(0, 20)}...)`)
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      })
      
      addResult(`✓ Subscribed to push manager`)
      addResult(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`)
      
      // Save to server
      const saveRes = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          subscription: subscription.toJSON()
        })
      })
      
      if (!saveRes.ok) {
        const error = await saveRes.json()
        addResult(`❌ Failed to save subscription: ${error.error}`)
        return false
      }
      
      addResult("✓ Subscription saved to server")
      return true
      
    } catch (error) {
      addResult(`❌ Subscription error: ${error}`)
      return false
    }
  }

  const testSendNotification = async (restaurantId: number) => {
    addResult(`\n=== Step 5: Send Test Notification (Restaurant ${restaurantId}) ===`)
    
    try {
      const res = await fetch("/api/admin/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          title: "Test Benachrichtigung",
          message: `Test von ${new Date().toLocaleTimeString()}`,
          orderUrl: "/test-notifications"
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        addResult(`❌ Send failed: ${data.error}`)
        return false
      }
      
      addResult(`✓ Send API response: sent=${data.sent}, total=${data.total}`)
      
      if (data.sent === 0) {
        addResult("⚠️ No notifications sent (no active subscriptions?)")
        return false
      }
      
      addResult(`✓ Notification sent to ${data.sent} subscriber(s)`)
      return true
      
    } catch (error) {
      addResult(`❌ Send error: ${error}`)
      return false
    }
  }

  const runFullTest = async () => {
    setIsLoading(true)
    setResults([])
    
    addResult("=== Starting Full Test ===")
    
    // Test 1: Permission
    const hasPermission = await testNotificationPermission()
    if (!hasPermission) {
      addResult("=== Test FAILED: No permission ===")
      setIsLoading(false)
      return
    }
    
    // Test 2: Service Worker
    const hasSW = await testServiceWorker()
    if (!hasSW) {
      addResult("=== Test FAILED: Service Worker issue ===")
      setIsLoading(false)
      return
    }
    
    // Get restaurant ID from prompt
    const restaurantIdStr = prompt("Enter Restaurant ID to test:", "1")
    if (!restaurantIdStr) {
      addResult("=== Test CANCELLED ===")
      setIsLoading(false)
      return
    }
    
    const restaurantId = parseInt(restaurantIdStr)
    
    // Test 3: Subscribe
    const hasSubscription = await testPushSubscription(restaurantId)
    if (!hasSubscription) {
      addResult("=== Test FAILED: Subscription issue ===")
      setIsLoading(false)
      return
    }
    
    // Test 4: Send
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s for subscription to be ready
    const sent = await testSendNotification(restaurantId)
    
    if (sent) {
      addResult("=== Test PASSED: Check your device for notification! ===")
    } else {
      addResult("=== Test FAILED: Could not send notification ===")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Push-Benachrichtigungen Test
          </CardTitle>
          <CardDescription>
            Testen Sie die vollständige Push-Benachrichtigungs-Kette
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runFullTest} 
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Test läuft..." : "Vollständigen Test starten"}
          </Button>
          
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test-Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-auto">
                  {results.map((result, i) => (
                    <div key={i}>{result}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
