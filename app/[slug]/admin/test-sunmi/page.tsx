'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestSunmiPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const addLog = (message: string) => {
    console.log('[v0]', message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkService()
  }, [])

  async function checkService() {
    addLog('=== SUNMI SERVICE CHECK GESTARTET ===')
    
    // Test 1: 127.0.0.1
    addLog('Test 1: Versuche 127.0.0.1:8888...')
    try {
      const response = await fetch('http://127.0.0.1:8888/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      addLog(`✓ 127.0.0.1:8888 antwortet! Status: ${response.status}`)
      if (response.ok) {
        const data = await response.text()
        addLog(`✓ Response: ${data}`)
        setServiceStatus('available')
        return
      }
    } catch (error: any) {
      addLog(`✗ 127.0.0.1:8888 fehlgeschlagen: ${error.message}`)
    }

    // Test 2: localhost
    addLog('Test 2: Versuche localhost:8888...')
    try {
      const response = await fetch('http://localhost:8888/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      addLog(`✓ localhost:8888 antwortet! Status: ${response.status}`)
      if (response.ok) {
        const data = await response.text()
        addLog(`✓ Response: ${data}`)
        setServiceStatus('available')
        return
      }
    } catch (error: any) {
      addLog(`✗ localhost:8888 fehlgeschlagen: ${error.message}`)
    }

    addLog('=== SERVICE NICHT ERREICHBAR ===')
    setServiceStatus('unavailable')
  }

  async function testPrint() {
    addLog('=== TESTDRUCK GESTARTET ===')
    
    const printData = {
      restaurantId: "1",
      orderNumber: "TEST-123",
      orderType: "pickup" as const,
      customerName: "Test Kunde",
      customerPhone: "0123456789",
      items: [
        {
          quantity: 2,
          name: "Pizza Margherita",
          variant: "Groß",
          price: 15.00,
          toppings: [{ name: "Extra Käse" }],
        }
      ],
      subtotal: 15.00,
      total: 15.00,
      paymentMethod: "cash" as const,
      createdAt: new Date().toISOString(),
    }

    try {
      addLog('Sende Druckauftrag...')
      const response = await fetch('http://127.0.0.1:8888/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      })

      addLog(`Response Status: ${response.status}`)
      const result = await response.json()
      addLog(`Response: ${JSON.stringify(result)}`)

      if (result.success) {
        addLog('✓ DRUCK ERFOLGREICH!')
      } else {
        addLog(`✗ Druck fehlgeschlagen: ${result.error}`)
      }
    } catch (error: any) {
      addLog(`✗ Fehler: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Sunmi Print Bridge Test</CardTitle>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Status:</span>
            {serviceStatus === 'checking' && (
              <Badge variant="outline">Prüfe...</Badge>
            )}
            {serviceStatus === 'available' && (
              <Badge className="bg-green-600">Service verfügbar</Badge>
            )}
            {serviceStatus === 'unavailable' && (
              <Badge variant="destructive">Service nicht erreichbar</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkService}>Service erneut prüfen</Button>
            <Button onClick={testPrint} disabled={serviceStatus !== 'available'}>
              Testdruck starten
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Logs:</h3>
            <div className="space-y-1 font-mono text-xs max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Keine Logs...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={log.includes('✗') ? 'text-red-500' : log.includes('✓') ? 'text-green-600' : ''}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4 text-sm space-y-2">
            <h3 className="font-semibold">Checkliste:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Sunmi Print Bridge App installiert?</li>
              <li>App geöffnet und "Service starten" geklickt?</li>
              <li>Benachrichtigung "Läuft auf Port 8888" sichtbar?</li>
              <li>Diese Webseite im Browser auf dem Sunmi-Gerät geöffnet?</li>
              <li>Nicht auf einem anderen Gerät/Computer?</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
