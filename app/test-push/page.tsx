"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function TestPushPage() {
  const [results, setResults] = useState<{ [key: string]: { status: string; message: string } }>({})
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResults({})

    // Test 1: Check browser support
    console.log("[v0] Test 1: Checking browser support...")
    const browserSupport = {
      notification: "Notification" in window,
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
    }

    setResults((prev) => ({
      ...prev,
      browserSupport: {
        status: Object.values(browserSupport).every((v) => v) ? "success" : "error",
        message: `Notification: ${browserSupport.notification}, ServiceWorker: ${browserSupport.serviceWorker}, PushManager: ${browserSupport.pushManager}`,
      },
    }))

    // Test 2: Check notification permission
    console.log("[v0] Test 2: Checking notification permission...")
    setResults((prev) => ({
      ...prev,
      permission: {
        status: Notification.permission === "granted" ? "success" : "warning",
        message: `Current permission: ${Notification.permission}`,
      },
    }))

    // Test 3: Fetch VAPID key
    console.log("[v0] Test 3: Fetching VAPID public key...")
    try {
      const vapidResponse = await fetch("/api/admin/push/vapid-key")
      const vapidData = await vapidResponse.json()

      if (vapidResponse.ok) {
        setResults((prev) => ({
          ...prev,
          vapidKey: {
            status: "success",
            message: `VAPID key loaded successfully (${vapidData.publicKey.substring(0, 20)}...)`,
          },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          vapidKey: {
            status: "error",
            message: `VAPID key error: ${vapidData.error}`,
          },
        }))
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        vapidKey: {
          status: "error",
          message: `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
        },
      }))
    }

    // Test 4: Register service worker
    console.log("[v0] Test 4: Registering service worker...")
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      setResults((prev) => ({
        ...prev,
        serviceWorker: {
          status: "success",
          message: `Service worker registered at ${registration.scope}`,
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        serviceWorker: {
          status: "error",
          message: `Service worker error: ${error instanceof Error ? error.message : "Unknown"}`,
        },
      }))
    }

    // Test 5: Check HTTPS
    console.log("[v0] Test 5: Checking HTTPS...")
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost"
    setResults((prev) => ({
      ...prev,
      https: {
        status: isSecure ? "success" : "error",
        message: `Protocol: ${window.location.protocol}, Secure: ${isSecure}`,
      },
    }))

    setLoading(false)
    console.log("[v0] All tests completed")
  }

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission()
      setResults((prev) => ({
        ...prev,
        permission: {
          status: result === "granted" ? "success" : "warning",
          message: `Permission ${result}`,
        },
      }))
    } catch (error) {
      console.error("[v0] Permission error:", error)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Test</CardTitle>
          <CardDescription>
            Teste die Web Push-Benachrichtigungs-Konfiguration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runTest} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tests ausführen
            </Button>
            {results.permission?.status === "warning" && (
              <Button onClick={requestPermission} variant="outline">
                Berechtigung anfordern
              </Button>
            )}
          </div>

          {Object.entries(results).map(([key, result]) => (
            <Alert
              key={key}
              variant={result.status === "error" ? "destructive" : "default"}
            >
              {result.status === "success" && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {result.status === "error" && <XCircle className="h-4 w-4" />}
              {result.status === "warning" && <XCircle className="h-4 w-4 text-yellow-600" />}
              <AlertDescription>
                <strong>{key}:</strong> {result.message}
              </AlertDescription>
            </Alert>
          ))}

          {Object.keys(results).length === 0 && !loading && (
            <Alert>
              <AlertDescription>
                Klicke auf "Tests ausführen", um die Push-Benachrichtigungskonfiguration zu überprüfen.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
