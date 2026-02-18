'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPushE2EPage() {
  const [log, setLog] = useState<string[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [restaurantId, setRestaurantId] = useState('1')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, `[${timestamp}] ${message}`])
    console.log('[v0] TEST:', message)
  }

  const testFullFlow = async () => {
    setLog([])
    addLog('Starting full end-to-end push notification test...')

    try {
      // Step 1: Subscribe to push
      addLog('Step 1: Subscribing to push notifications...')
      
      if (!('serviceWorker' in navigator)) {
        addLog('❌ Service Workers not supported')
        return
      }

      const registration = await navigator.serviceWorker.ready
      addLog('✓ Service Worker ready')

      // Get VAPID key
      const configRes = await fetch('/api/admin/push/config')
      const config = await configRes.json()
      
      if (!config.configured) {
        addLog('❌ VAPID keys not configured on server')
        return
      }
      addLog('✓ VAPID keys configured')

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        addLog('❌ Notification permission denied')
        return
      }
      addLog('✓ Notification permission granted')

      // Subscribe
      const applicationServerKey = urlBase64ToUint8Array(config.publicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      addLog('✓ Push subscription created')

      // Save subscription to database
      const subscribeRes = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          restaurantId: parseInt(restaurantId)
        })
      })

      if (!subscribeRes.ok) {
        addLog('❌ Failed to save subscription to database')
        return
      }
      addLog('✓ Subscription saved to database')
      setIsSubscribed(true)

      // Step 2: Trigger a test notification
      addLog('\nStep 2: Triggering test push notification...')
      
      const sendRes = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: parseInt(restaurantId),
          notification: {
            title: 'TEST: Neue Bestellung',
            body: 'Dies ist eine Test-Benachrichtigung',
            icon: '/icon-192.png',
            data: {
              url: '/test',
              test: true
            }
          }
        })
      })

      const sendResult = await sendRes.json()
      
      if (sendResult.success > 0) {
        addLog(`✓ Push notification sent successfully to ${sendResult.success} device(s)`)
        addLog('✓ Check your device for the notification!')
      } else if (sendResult.failed > 0) {
        addLog(`❌ Failed to send to ${sendResult.failed} device(s)`)
      } else {
        addLog('⚠ No subscriptions found')
      }

      addLog('\n=== TEST COMPLETED ===')
      addLog('If you received a notification, the system is working!')

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>End-to-End Push Notification Test</CardTitle>
          <CardDescription>
            This test will subscribe to push notifications and immediately send a test notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Restaurant ID (für Test)
            </label>
            <input
              type="number"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="1"
            />
          </div>

          <Button 
            onClick={testFullFlow} 
            className="w-full"
            disabled={isSubscribed}
          >
            Run Full Push Test
          </Button>

          {log.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Log:</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
                {log.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
