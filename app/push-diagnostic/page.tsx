"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default function PushDiagnosticPage() {
  const [results, setResults] = useState<Array<{ status: "success" | "error" | "warning"; message: string }>>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (status: "success" | "error" | "warning", message: string) => {
    setResults(prev => [...prev, { status, message }])
  }

  const runDiagnostic = async () => {
    setResults([])
    setIsRunning(true)

    try {
      // 1. Check Environment Variables
      addResult("success", "=== STEP 1: SERVER CONFIGURATION ===")
      
      const configRes = await fetch("/api/admin/push/config")
      const configData = await configRes.json()
      
      if (configData.configured && configData.publicKey) {
        addResult("success", `✓ VAPID Public Key configured (${configData.publicKey.length} chars)`)
      } else {
        addResult("error", "✗ VAPID Public Key NOT configured")
        addResult("error", "  → Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables")
        addResult("error", "  → Generate keys with: npx web-push generate-vapid-keys")
      }

      // 2. Check Database Tables
      addResult("success", "\n=== STEP 2: DATABASE TABLES ===")
      
      const diagnosticRes = await fetch("/api/admin/push/diagnostic")
      const diagnosticData = await diagnosticRes.json()
      
      if (diagnosticData.database?.tablesExist) {
        addResult("success", "✓ push_subscriptions table exists")
        addResult("success", `✓ Total subscriptions: ${diagnosticData.database.totalSubscriptions}`)
        addResult("success", `✓ Active subscriptions: ${diagnosticData.database.activeSubscriptions}`)
      } else {
        addResult("error", "✗ push_subscriptions table missing")
        addResult("error", "  → Run migration: scripts/034-push-notifications.sql")
      }

      // 3. Browser Support Check
      addResult("success", "\n=== STEP 3: BROWSER SUPPORT ===")
      
      if ("Notification" in window) {
        addResult("success", `✓ Notification API supported (permission: ${Notification.permission})`)
      } else {
        addResult("error", "✗ Notification API not supported")
      }

      if ("serviceWorker" in navigator) {
        addResult("success", "✓ Service Worker API supported")
        
        const registration = await navigator.serviceWorker.getRegistration("/")
        if (registration) {
          addResult("success", `✓ Service Worker registered (${registration.active?.state})`)
        } else {
          addResult("warning", "⚠ Service Worker not registered yet")
        }
      } else {
        addResult("error", "✗ Service Worker API not supported")
      }

      if ("PushManager" in window) {
        addResult("success", "✓ Push Manager API supported")
      } else {
        addResult("error", "✗ Push Manager API not supported")
      }

      // 4. Check if running in secure context
      addResult("success", "\n=== STEP 4: SECURITY ===")
      
      if (window.isSecureContext) {
        addResult("success", "✓ Running in secure context (HTTPS or localhost)")
      } else {
        addResult("error", "✗ Not in secure context - HTTPS required")
      }

      // 5. Final Recommendation
      addResult("success", "\n=== RECOMMENDATION ===")
      
      if (!configData.configured) {
        addResult("error", "BLOCKER: Generate and set VAPID keys")
        addResult("error", "1. Run: npx web-push generate-vapid-keys")
        addResult("error", "2. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to environment")
        addResult("error", "3. Add VAPID_PRIVATE_KEY to environment")
        addResult("error", "4. Add VAPID_EMAIL to environment")
      } else if (Notification.permission === "default") {
        addResult("warning", "Action needed: Request notification permission")
        addResult("warning", "→ Open /muster/admin/dashboard and click 'Enable Notifications'")
      } else if (diagnosticData.database?.activeSubscriptions === 0) {
        addResult("warning", "Action needed: Subscribe to push notifications")
        addResult("warning", "→ Open /muster/admin/dashboard and enable notifications")
      } else {
        addResult("success", "✓ System ready! Create a test order to receive notification")
      }

    } catch (error) {
      addResult("error", `CRITICAL ERROR: ${error instanceof Error ? error.message : "Unknown"}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Push Notification System Diagnostic</CardTitle>
            <CardDescription>
              Complete system check for Web Push Notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "Running Diagnostic..." : "Run Complete Diagnostic"}
            </Button>

            {results.length > 0 && (
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {results.map((result, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {result.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
                    {result.status === "error" && <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                    {result.status === "warning" && <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />}
                    <span className={
                      result.status === "error" ? "text-red-400" :
                      result.status === "warning" ? "text-yellow-400" :
                      "text-green-400"
                    }>{result.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
