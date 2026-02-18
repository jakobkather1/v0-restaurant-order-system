# Sunmi Print Bridge Service - Installation & Setup

Dieser Print Bridge Service ermöglicht es Ihrer Web-App, direkt auf den integrierten Sunmi V2 Drucker zuzugreifen.

## Architektur

```
Web-App (Browser) → HTTP Request → Print Service (Android) → Sunmi Printer SDK → Drucker
```

Die Web-App sendet Print-Jobs an `http://localhost:8888/print`, der Android-Service empfängt diese und druckt direkt über die Sunmi SDK.

---

## Teil 1: Android Print Service erstellen

### Schritt 1: Android Studio Projekt erstellen

1. Android Studio öffnen
2. **New Project** → **Empty Activity**
3. Einstellungen:
   - **Name:** `SunmiPrintBridge`
   - **Package name:** `com.restaurant.sunmibridge`
   - **Language:** Kotlin
   - **Minimum SDK:** API 24 (Android 7.0)

### Schritt 2: Dependencies hinzufügen

**`app/build.gradle.kts`:**

```kotlin
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.code.gson:gson:2.10.1")
    
    // NanoHTTPD für lokalen Server
    implementation("org.nanohttpd:nanohttpd:2.3.1")
}
```

### Schritt 3: AndroidManifest.xml konfigurieren

**`app/src/main/AndroidManifest.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.restaurant.sunmibridge">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Sunmi Print Bridge"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".PrintService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="dataSync" />
    </application>
</manifest>
```

### Schritt 4: Datenmodelle erstellen

**`app/src/main/java/com/restaurant/sunmibridge/PrintModels.kt`:**

```kotlin
package com.restaurant.sunmibridge

data class PrintRequest(
    val restaurantId: String,
    val orderNumber: String,
    val orderType: String, // "delivery" or "pickup"
    val customerName: String,
    val customerPhone: String,
    val customerAddress: String? = null,
    val customerNotes: String? = null,
    val items: List<PrintItem>,
    val subtotal: Double,
    val discountAmount: Double? = null,
    val deliveryFee: Double? = null,
    val total: Double,
    val paymentMethod: String, // "cash", "card", "online"
    val createdAt: String
)

data class PrintItem(
    val quantity: Int,
    val name: String,
    val variant: String? = null,
    val price: Double,
    val toppings: List<Topping> = emptyList(),
    val notes: String? = null
)

data class Topping(
    val name: String
)

data class PrintResponse(
    val success: Boolean,
    val message: String
)
```

### Schritt 5: Sunmi Printer Helper erstellen

**`app/src/main/java/com/restaurant/sunmibridge/SunmiPrinterHelper.kt`:**

```kotlin
package com.restaurant.sunmibridge

import android.content.Context
import android.os.RemoteException
import com.sunmi.peripheral.printer.*
import android.util.Log

class SunmiPrinterHelper(private val context: Context) {
    
    private var printerService: SunmiPrinterService? = null
    
    init {
        try {
            printerService = InnerPrinterManager.getInstance().getPrinterService()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get printer service", e)
        }
    }
    
    fun printReceipt(request: PrintRequest): Boolean {
        return try {
            val service = printerService ?: return false
            
            // Papierbreite: 57mm für Sunmi V2
            service.printerInit(null)
            
            // Header
            val orderTypeLabel = if (request.orderType == "delivery") "LIEFERUNG" else "ABHOLUNG"
            service.setAlignment(1, null) // Center
            service.setFontSize(24f, null)
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            service.printText("$orderTypeLabel\n", null)
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            
            service.setFontSize(20f, null)
            service.printText("Bestellung #${request.orderNumber}\n", null)
            service.setFontSize(16f, null)
            service.printText("${formatDateTime(request.createdAt)}\n", null)
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            
            // Kundeninformationen
            service.setAlignment(0, null) // Left
            service.setFontSize(16f, null)
            service.printText("Kunde: ${request.customerName}\n", null)
            service.printText("Tel: ${request.customerPhone}\n", null)
            
            if (request.orderType == "delivery" && !request.customerAddress.isNullOrEmpty()) {
                service.printText("Adresse:\n${request.customerAddress}\n", null)
            }
            
            if (!request.customerNotes.isNullOrEmpty()) {
                service.printText("Notiz:\n${request.customerNotes}\n", null)
            }
            
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            
            // Artikel
            service.setFontSize(16f, null)
            for (item in request.items) {
                // Artikelname mit Menge
                service.printText("${item.quantity}x ${item.name}\n", null)
                
                // Variante
                if (!item.variant.isNullOrEmpty()) {
                    service.setFontSize(14f, null)
                    service.printText("  ${item.variant}\n", null)
                    service.setFontSize(16f, null)
                }
                
                // Toppings
                for (topping in item.toppings) {
                    service.setFontSize(14f, null)
                    service.printText("  + ${topping.name}\n", null)
                }
                
                // Notizen
                if (!item.notes.isNullOrEmpty()) {
                    service.setFontSize(14f, null)
                    service.printText("  ! ${item.notes}\n", null)
                }
                
                // Preis
                service.setAlignment(2, null) // Right
                service.setFontSize(16f, null)
                service.printText("${formatPrice(item.price)}\n", null)
                service.setAlignment(0, null) // Left
                
                service.printText("\n", null)
            }
            
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            
            // Summen
            service.setAlignment(2, null) // Right
            service.setFontSize(16f, null)
            service.printText("Zwischensumme: ${formatPrice(request.subtotal)}\n", null)
            
            if (request.discountAmount != null && request.discountAmount > 0) {
                service.printText("Rabatt: -${formatPrice(request.discountAmount)}\n", null)
            }
            
            if (request.orderType == "delivery" && request.deliveryFee != null) {
                service.printText("Lieferung: ${formatPrice(request.deliveryFee)}\n", null)
            }
            
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            service.setFontSize(20f, null)
            service.printText("GESAMT: ${formatPrice(request.total)}\n", null)
            service.printText("━━━━━━━━━━━━━━━━\n", null)
            
            // Zahlungsmethode
            service.setAlignment(1, null) // Center
            service.setFontSize(18f, null)
            val paymentLabel = when (request.paymentMethod) {
                "cash" -> "BARZAHLUNG"
                "card" -> "KARTENZAHLUNG"
                "online" -> "ONLINE BEZAHLT"
                else -> "BEZAHLT"
            }
            service.printText("\n$paymentLabel\n\n", null)
            
            service.setFontSize(14f, null)
            service.printText("Vielen Dank!\n", null)
            
            // Papier vorschub und schneiden
            service.lineWrap(3, null)
            service.cutPaper(null)
            
            true
        } catch (e: RemoteException) {
            Log.e(TAG, "Print failed", e)
            false
        } catch (e: Exception) {
            Log.e(TAG, "Print error", e)
            false
        }
    }
    
    private fun formatPrice(price: Double): String {
        return String.format("%.2f€", price)
    }
    
    private fun formatDateTime(dateTime: String): String {
        // Simple formatting - you can enhance this
        return dateTime.replace("T", " ").substring(0, 16)
    }
    
    companion object {
        private const val TAG = "SunmiPrinterHelper"
    }
}
```

### Schritt 6: HTTP Print Service erstellen

**`app/src/main/java/com/restaurant/sunmibridge/PrintService.kt`:**

```kotlin
package com.restaurant.sunmibridge

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD
import java.io.IOException

class PrintService : Service() {
    
    private var httpServer: PrintHttpServer? = null
    private lateinit var printerHelper: SunmiPrinterHelper
    
    override fun onCreate() {
        super.onCreate()
        printerHelper = SunmiPrinterHelper(this)
        startForegroundService()
        startHttpServer()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        stopHttpServer()
    }
    
    private fun startForegroundService() {
        val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel()
        } else {
            ""
        }
        
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Sunmi Print Bridge")
            .setContentText("Service läuft auf Port 8888")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        
        startForeground(1, notification)
    }
    
    private fun createNotificationChannel(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "sunmi_print_service"
            val channelName = "Sunmi Print Service"
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_LOW
            )
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            return channelId
        }
        return ""
    }
    
    private fun startHttpServer() {
        try {
            httpServer = PrintHttpServer(8888, printerHelper)
            httpServer?.start()
            Log.i(TAG, "HTTP Server started on port 8888")
        } catch (e: IOException) {
            Log.e(TAG, "Failed to start HTTP server", e)
        }
    }
    
    private fun stopHttpServer() {
        httpServer?.stop()
        Log.i(TAG, "HTTP Server stopped")
    }
    
    companion object {
        private const val TAG = "PrintService"
    }
}

class PrintHttpServer(
    port: Int,
    private val printerHelper: SunmiPrinterHelper
) : NanoHTTPD(port) {
    
    private val gson = Gson()
    
    override fun serve(session: IHTTPSession): Response {
        return when {
            session.method == Method.GET && session.uri == "/health" -> {
                handleHealthCheck()
            }
            session.method == Method.POST && session.uri == "/print" -> {
                handlePrint(session)
            }
            session.method == Method.OPTIONS -> {
                handleOptions()
            }
            else -> {
                newFixedLengthResponse(
                    Response.Status.NOT_FOUND,
                    "application/json",
                    """{"error":"Not found"}"""
                )
            }
        }
    }
    
    private fun handleHealthCheck(): Response {
        val response = newFixedLengthResponse(
            Response.Status.OK,
            "application/json",
            """{"status":"ready","printer":"sunmi"}"""
        )
        addCorsHeaders(response)
        return response
    }
    
    private fun handlePrint(session: IHTTPSession): Response {
        return try {
            val contentLength = session.headers["content-length"]?.toIntOrNull() ?: 0
            val body = HashMap<String, String>()
            session.parseBody(body)
            
            val postData = body["postData"] ?: ""
            val printRequest = gson.fromJson(postData, PrintRequest::class.java)
            
            val success = printerHelper.printReceipt(printRequest)
            
            val responseJson = if (success) {
                """{"success":true,"message":"Printed successfully"}"""
            } else {
                """{"success":false,"message":"Print failed"}"""
            }
            
            val response = newFixedLengthResponse(
                if (success) Response.Status.OK else Response.Status.INTERNAL_ERROR,
                "application/json",
                responseJson
            )
            addCorsHeaders(response)
            response
        } catch (e: Exception) {
            Log.e("PrintHttpServer", "Error handling print request", e)
            val response = newFixedLengthResponse(
                Response.Status.INTERNAL_ERROR,
                "application/json",
                """{"success":false,"message":"${e.message}"}"""
            )
            addCorsHeaders(response)
            response
        }
    }
    
    private fun handleOptions(): Response {
        val response = newFixedLengthResponse(Response.Status.OK, "text/plain", "")
        addCorsHeaders(response)
        return response
    }
    
    private fun addCorsHeaders(response: Response) {
        response.addHeader("Access-Control-Allow-Origin", "*")
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.addHeader("Access-Control-Allow-Headers", "Content-Type")
    }
}
```

### Schritt 7: MainActivity erstellen

**`app/src/main/java/com/restaurant/sunmibridge/MainActivity.kt`:**

```kotlin
package com.restaurant.sunmibridge

import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.text.format.Formatter
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        val statusText = findViewById<TextView>(R.id.statusText)
        val ipText = findViewById<TextView>(R.id.ipText)
        val startButton = findViewById<Button>(R.id.startButton)
        val stopButton = findViewById<Button>(R.id.stopButton)
        
        // IP-Adresse anzeigen
        val ipAddress = getLocalIpAddress()
        ipText.text = "Service URL:\nhttp://$ipAddress:8888"
        
        startButton.setOnClickListener {
            startPrintService()
            statusText.text = "Service: LÄUFT"
            statusText.setTextColor(getColor(android.R.color.holo_green_dark))
        }
        
        stopButton.setOnClickListener {
            stopPrintService()
            statusText.text = "Service: GESTOPPT"
            statusText.setTextColor(getColor(android.R.color.holo_red_dark))
        }
        
        // Service automatisch starten
        startPrintService()
        statusText.text = "Service: LÄUFT"
        statusText.setTextColor(getColor(android.R.color.holo_green_dark))
    }
    
    private fun startPrintService() {
        val intent = Intent(this, PrintService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
    
    private fun stopPrintService() {
        val intent = Intent(this, PrintService::class.java)
        stopService(intent)
    }
    
    private fun getLocalIpAddress(): String {
        val wifiManager = applicationContext.getSystemService(WIFI_SERVICE) as WifiManager
        val ipInt = wifiManager.connectionInfo.ipAddress
        return Formatter.formatIpAddress(ipInt)
    }
}
```

### Schritt 8: Layout erstellen

**`app/src/main/res/layout/activity_main.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Sunmi Print Bridge"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="32dp" />

    <TextView
        android:id="@+id/statusText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Service: GESTOPPT"
        android:textSize="18sp"
        android:layout_marginBottom="16dp" />

    <TextView
        android:id="@+id/ipText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Service URL: http://localhost:8888"
        android:textSize="16sp"
        android:textAlignment="center"
        android:layout_marginBottom="32dp" />

    <Button
        android:id="@+id/startButton"
        android:layout_width="200dp"
        android:layout_height="wrap_content"
        android:text="Service starten"
        android:layout_marginBottom="16dp" />

    <Button
        android:id="@+id/stopButton"
        android:layout_width="200dp"
        android:layout_height="wrap_content"
        android:text="Service stoppen" />

</LinearLayout>
```

---

## Teil 2: APK bauen und installieren

### APK bauen:

1. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Warten bis Build fertig ist
3. APK finden unter: `app/build/outputs/apk/debug/app-debug.apk`

### Auf Sunmi V2 installieren:

**Option A: Via USB:**
```bash
adb install app-debug.apk
```

**Option B: Via Dateiübertragung:**
1. APK auf USB-Stick kopieren
2. Auf Sunmi V2 öffnen
3. "Aus unbekannten Quellen installieren" aktivieren
4. APK installieren

---

## Teil 3: Service starten

1. **App öffnen** auf Sunmi-Gerät
2. **"Service starten"** klicken
3. Service läuft jetzt im Hintergrund
4. Notieren Sie sich die angezeigte IP-Adresse

---

## Teil 4: Web-App Integration

Die Web-App ist bereits vorbereitet! Der Hook `/hooks/use-sunmi-print.ts` erkennt automatisch den Service.

### Test:
1. Öffnen Sie Ihre Web-App im Browser des Sunmi
2. Gehen Sie zu einer Bestellung
3. Klicken Sie "Drucken"
4. Bon wird sofort gedruckt - KEIN Dialog!

---

## Fehlerbehebung

### Service nicht erreichbar:
- Prüfen Sie ob Service läuft (App öffnen)
- Prüfen Sie Firewall-Einstellungen
- Nutzen Sie `http://localhost:8888` in Web-App

### Drucker druckt nicht:
- Prüfen Sie Papier
- Prüfen Sie Sunmi-Drucker in Geräteeinstellungen
- Testen Sie mit Sunmi-Test-App

### Permission-Fehler:
- Android-Einstellungen → Apps → Sunmi Print Bridge → Berechtigungen
- Alle Berechtigungen erlauben

---

## Fertig!

Ihre Web-App kann jetzt direkt auf den Sunmi V2 Drucker drucken. Ein Klick = Sofort gedruckt!
