"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function VapidStatusPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const [diagnosticRes, validateRes] = await Promise.all([
        fetch("/api/admin/push/diagnostic"),
        fetch("/api/admin/push/validate-vapid")
      ])

      const diagnostic = await diagnosticRes.json()
      const validate = await validateRes.json()

      setData({ diagnostic, validate })
    } catch (error) {
      console.error("Failed to fetch VAPID status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking VAPID configuration...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load VAPID status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchStatus}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { diagnostic, validate } = data
  const isFullyConfigured = validate.allVarsPresent

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">VAPID Configuration Status</h1>
          <Button onClick={fetchStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isFullyConfigured ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              Overall Status
            </CardTitle>
            <CardDescription>
              {isFullyConfigured
                ? "All VAPID keys are correctly configured. Push notifications should work."
                : "VAPID keys are missing or invalid. Push notifications will not work."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-mono text-sm">{validate.recommendation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Public Key Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validate.publicKey.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Exists:</span>
              <Badge variant={validate.publicKey.exists ? "default" : "destructive"}>
                {validate.publicKey.exists ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Length:</span>
              <Badge variant={validate.publicKey.length >= 80 ? "default" : "secondary"}>
                {validate.publicKey.length} chars {validate.publicKey.length >= 80 ? "✓" : "(need 80+)"}
              </Badge>
            </div>
            {validate.publicKey.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{validate.publicKey.error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Private Key Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validate.privateKey.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Private Key (VAPID_PRIVATE_KEY)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Exists:</span>
              <Badge variant={validate.privateKey.exists ? "default" : "destructive"}>
                {validate.privateKey.exists ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Length:</span>
              <Badge variant={validate.privateKey.length >= 40 ? "default" : "secondary"}>
                {validate.privateKey.length} chars {validate.privateKey.length >= 40 ? "✓" : "(need 40+)"}
              </Badge>
            </div>
            {validate.privateKey.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{validate.privateKey.error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validate.email.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Email (VAPID_EMAIL)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Exists:</span>
              <Badge variant={validate.email.exists ? "default" : "destructive"}>
                {validate.email.exists ? "Yes" : "No"}
              </Badge>
            </div>
            {validate.email.value && (
              <div className="flex items-center justify-between">
                <span>Value:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{validate.email.value}</code>
              </div>
            )}
            {validate.email.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{validate.email.error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>Push subscriptions stored in database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Table exists:</span>
              <Badge variant={diagnostic.database.subscriptionsTable ? "default" : "destructive"}>
                {diagnostic.database.subscriptionsTable ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Total subscriptions:</span>
              <Badge variant="secondary">{diagnostic.database.totalSubscriptions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Active subscriptions:</span>
              <Badge variant="secondary">{diagnostic.database.activeSubscriptions}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        {!isFullyConfigured && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">Action Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-amber-800">
                To enable push notifications, you need to generate and set VAPID keys:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-amber-900">
                <li>Run: <code className="bg-white px-2 py-1 rounded">node scripts/generate-vapid-keys.js</code></li>
                <li>Copy the generated keys to your environment variables</li>
                <li>Set the following in Vercel or your .env file:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li><code className="bg-white px-1 rounded">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code></li>
                    <li><code className="bg-white px-1 rounded">VAPID_PRIVATE_KEY</code></li>
                    <li><code className="bg-white px-1 rounded">VAPID_EMAIL</code></li>
                  </ul>
                </li>
                <li>Redeploy your application</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
