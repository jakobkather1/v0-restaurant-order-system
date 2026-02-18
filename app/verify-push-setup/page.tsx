"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

export default function VerifyPushSetupPage() {
  const [results, setResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runVerification = async () => {
    setTesting(true)
    const checks = {
      serverConfig: null as any,
      clientConfig: null as any,
      diagnostic: null as any,
      subscription: null as any,
      browserSupport: null as any
    }

    try {
      // Check 1: Server VAPID Config
      console.log("[v0] VERIFY: Checking server VAPID config...")
      const configRes = await fetch("/api/admin/push/config")
      checks.serverConfig = await configRes.json()
      console.log("[v0] VERIFY: Server config:", checks.serverConfig)

      // Check 2: Client can access public key
      console.log("[v0] VERIFY: Checking if client can access VAPID public key...")
      checks.clientConfig = {
        canFetchConfig: configRes.ok,
        hasPublicKey: !!checks.serverConfig.publicKey,
        keyLength: checks.serverConfig.publicKey?.length || 0,
        configured: checks.serverConfig.configured
      }

      // Check 3: Full Diagnostic
      console.log("[v0] VERIFY: Running full diagnostic...")
      const diagRes = await fetch("/api/admin/push/diagnostic")
      checks.diagnostic = await diagRes.json()
      console.log("[v0] VERIFY: Diagnostic:", checks.diagnostic)

      // Check 4: Browser Support
      console.log("[v0] VERIFY: Checking browser support...")
      checks.browserSupport = {
        hasNotification: "Notification" in window,
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window,
        permission: "Notification" in window ? Notification.permission : "unsupported",
        isSecure: window.isSecureContext,
        userAgent: navigator.userAgent
      }

      // Check 5: Try to get existing subscription
      if (checks.browserSupport.hasServiceWorker) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            const sub = await reg.pushManager.getSubscription()
            checks.subscription = {
              exists: !!sub,
              endpoint: sub?.endpoint?.substring(0, 50) + "..." || null
            }
          } else {
            checks.subscription = { exists: false, error: "No service worker registered" }
          }
        } catch (error) {
          checks.subscription = { exists: false, error: String(error) }
        }
      }

      setResults(checks)
    } catch (error) {
      console.error("[v0] VERIFY: Error during verification:", error)
      setResults({ error: String(error), checks })
    } finally {
      setTesting(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => {
    if (status) return <CheckCircle2 className="h-5 w-5 text-green-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Push Notification System Verification</h1>
        <p className="text-muted-foreground">
          Comprehensive check of all push notification components and configuration
        </p>
      </div>

      <Button 
        onClick={runVerification} 
        disabled={testing}
        size="lg"
        className="mb-6"
      >
        {testing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running Verification...
          </>
        ) : (
          "Run Full Verification"
        )}
      </Button>

      {results && (
        <div className="space-y-4">
          {/* Server VAPID Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.serverConfig?.configured} />
                1. Server VAPID Configuration
              </CardTitle>
              <CardDescription>
                Checks if VAPID keys are properly set in Vercel environment variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm bg-muted p-3 rounded">
                <div>Configured: {String(results.serverConfig?.configured)}</div>
                <div>Has Public Key: {String(!!results.serverConfig?.publicKey)}</div>
                <div>Key Length: {results.serverConfig?.publicKey?.length || 0} chars</div>
                {results.serverConfig?.error && (
                  <div className="text-red-600 mt-2">Error: {results.serverConfig.error}</div>
                )}
              </div>
              
              {!results.serverConfig?.configured && (
                <div className="bg-red-50 border border-red-200 p-4 rounded text-sm">
                  <p className="font-semibold text-red-800 mb-2">Action Required:</p>
                  <ol className="list-decimal ml-4 space-y-1 text-red-700">
                    <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                    <li>Add: <code className="bg-red-100 px-1">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code></li>
                    <li>Add: <code className="bg-red-100 px-1">VAPID_PRIVATE_KEY</code></li>
                    <li>Add: <code className="bg-red-100 px-1">VAPID_EMAIL</code></li>
                    <li>Redeploy the project</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.clientConfig?.canFetchConfig} />
                2. Client Configuration Access
              </CardTitle>
              <CardDescription>
                Verifies client can fetch and use the VAPID public key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-muted p-3 rounded">
                <div>Can Fetch Config: {String(results.clientConfig?.canFetchConfig)}</div>
                <div>Has Public Key: {String(results.clientConfig?.hasPublicKey)}</div>
                <div>Key Length: {results.clientConfig?.keyLength} chars</div>
                <div>Status: {results.clientConfig?.configured ? "✓ Ready" : "✗ Not Ready"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.diagnostic?.vapid?.allValid} />
                3. Full System Diagnostic
              </CardTitle>
              <CardDescription>
                Complete check of all VAPID credentials and database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-semibold mb-1">VAPID Keys:</div>
                <div className="font-mono text-sm bg-muted p-3 rounded space-y-1">
                  <div>Public Key: {results.diagnostic?.vapid?.publicKeyConfigured ? "✓" : "✗"} ({results.diagnostic?.vapid?.publicKeyLength} chars)</div>
                  <div>Private Key: {results.diagnostic?.vapid?.privateKeyConfigured ? "✓" : "✗"} ({results.diagnostic?.vapid?.privateKeyLength} chars)</div>
                  <div>Email: {results.diagnostic?.vapid?.emailConfigured ? "✓" : "✗"} ({results.diagnostic?.vapid?.email || "not set"})</div>
                  <div className="pt-2 border-t mt-2">
                    All Valid: {results.diagnostic?.vapid?.allValid ? "✓ YES" : "✗ NO"}
                  </div>
                  {results.diagnostic?.vapid?.errors?.length > 0 && (
                    <div className="pt-2 border-t mt-2 text-red-600">
                      <div className="font-semibold">Errors:</div>
                      {results.diagnostic.vapid.errors.map((err: string, i: number) => (
                        <div key={i}>- {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">Database:</div>
                <div className="font-mono text-sm bg-muted p-3 rounded space-y-1">
                  <div>Table Exists: {results.diagnostic?.database?.subscriptionsTable ? "✓" : "✗"}</div>
                  <div>Total Subscriptions: {results.diagnostic?.database?.totalSubscriptions}</div>
                  <div>Active Subscriptions: {results.diagnostic?.database?.activeSubscriptions}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={
                  results.browserSupport?.hasNotification && 
                  results.browserSupport?.hasServiceWorker && 
                  results.browserSupport?.hasPushManager &&
                  results.browserSupport?.isSecure
                } />
                4. Browser Support
              </CardTitle>
              <CardDescription>
                Checks if this browser can support push notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-muted p-3 rounded space-y-1">
                <div>Notification API: {results.browserSupport?.hasNotification ? "✓" : "✗"}</div>
                <div>Service Worker: {results.browserSupport?.hasServiceWorker ? "✓" : "✗"}</div>
                <div>Push Manager: {results.browserSupport?.hasPushManager ? "✓" : "✗"}</div>
                <div>Secure Context (HTTPS): {results.browserSupport?.isSecure ? "✓" : "✗"}</div>
                <div>Permission: {results.browserSupport?.permission}</div>
                <div className="pt-2 text-xs text-muted-foreground break-all">
                  User Agent: {results.browserSupport?.userAgent}
                </div>
              </div>

              {!results.browserSupport?.hasNotification && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3 text-sm">
                  <p className="font-semibold text-yellow-800">Browser Not Supported</p>
                  <p className="text-yellow-700 mt-1">
                    This browser does not support Web Push Notifications. Try using:
                  </p>
                  <ul className="list-disc ml-4 mt-1 text-yellow-700">
                    <li>Safari on iOS 16.4+</li>
                    <li>Chrome, Firefox, or Edge on desktop</li>
                    <li>Chrome or Firefox on Android</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Subscription */}
          {results.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon status={results.subscription?.exists} />
                  5. Current Subscription
                </CardTitle>
                <CardDescription>
                  Check if this device has an active push subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm bg-muted p-3 rounded">
                  <div>Has Subscription: {String(results.subscription?.exists)}</div>
                  {results.subscription?.endpoint && (
                    <div className="break-all">Endpoint: {results.subscription.endpoint}</div>
                  )}
                  {results.subscription?.error && (
                    <div className="text-red-600">Error: {results.subscription.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Status */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              {results.serverConfig?.configured && 
               results.browserSupport?.hasNotification &&
               results.browserSupport?.isSecure ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <p className="font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    System Ready for Push Notifications
                  </p>
                  <p className="text-green-700 mt-2">
                    All checks passed. You can now enable push notifications in the admin dashboard.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <p className="font-semibold text-red-800 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    System Not Ready
                  </p>
                  <p className="text-red-700 mt-2">
                    Some checks failed. Please review the errors above and fix the configuration.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
