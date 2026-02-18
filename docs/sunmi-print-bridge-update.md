# Sunmi Print Bridge - Vollständiger Bon-Druck Update

## Problem
Der aktuelle Bon druckt nur: Bestellnummer, Lieferung/Abholung, Gericht, Preis

## Lösung
Die Web-App sendet bereits alle Daten. Das Problem liegt in der Android-App (`SunmiPrinterHelper.kt`), die nur teilweise formatiert.

---

## Aktualisierte SunmiPrinterHelper.kt

Ersetzen Sie die gesamte Datei mit diesem Code:

```kotlin
package com.restaurant.sunmiprintbridge

import android.content.Context
import android.util.Log
import woyou.aidlservice.jiuiv5.IWoyouService
import android.os.RemoteException
import java.text.SimpleDateFormat
import java.util.*

data class PrintItem(
    val quantity: Int,
    val name: String,
    val variant: String?,
    val price: Double,
    val toppings: List<PrintTopping>,
    val notes: String?
)

data class PrintTopping(
    val name: String
)

data class PrintRequest(
    val restaurantId: String,
    val orderNumber: String,
    val orderType: String,
    val customerName: String,
    val customerPhone: String,
    val customerAddress: String?,
    val customerNotes: String?,
    val items: List<PrintItem>,
    val subtotal: Double,
    val discountAmount: Double?,
    val deliveryFee: Double?,
    val total: Double,
    val paymentMethod: String,
    val createdAt: String
)

class SunmiPrinterHelper(private val context: Context) {
    companion object {
        private const val TAG = "SunmiPrinterHelper"
    }

    private var woyouService: IWoyouService? = null

    fun setService(service: IWoyouService) {
        this.woyouService = service
        Log.d(TAG, "Woyou Service set successfully")
    }

    fun printReceipt(request: PrintRequest): Boolean {
        val service = woyouService
        if (service == null) {
            Log.e(TAG, "Woyou Service not available")
            return false
        }

        return try {
            Log.d(TAG, "Starting receipt print for order: ${request.orderNumber}")
            
            // Datum und Uhrzeit formatieren
            val dateTime = formatDateTime(request.createdAt)
            
            // Restaurant-Header
            service.setAlignment(1, null) // Zentriert
            service.printTextWithFont("========================================\n", null, 24f, null)
            service.printTextWithFont("BESTELLUNG\n", null, 32f, null)
            service.printTextWithFont("========================================\n", null, 24f, null)
            
            // Bestellnummer - GROSS
            service.printTextWithFont("\n", null, 24f, null)
            service.printTextWithFont("Bestellung #${request.orderNumber}\n", null, 40f, null)
            service.printTextWithFont("\n", null, 24f, null)
            
            // Datum und Uhrzeit
            service.setAlignment(0, null) // Links
            service.printTextWithFont("Datum: ${dateTime.first}\n", null, 24f, null)
            service.printTextWithFont("Uhrzeit: ${dateTime.second}\n", null, 24f, null)
            service.printTextWithFont("\n", null, 24f, null)
            
            // Lieferart - GROSS und hervorgehoben
            service.setAlignment(1, null) // Zentriert
            val orderTypeText = if (request.orderType == "pickup") "ABHOLUNG" else "LIEFERUNG"
            service.printTextWithFont("========================================\n", null, 24f, null)
            service.printTextWithFont("$orderTypeText\n", null, 36f, null)
            service.printTextWithFont("========================================\n", null, 24f, null)
            service.printTextWithFont("\n", null, 24f, null)
            
            // Kundendaten
            service.setAlignment(0, null) // Links
            service.printTextWithFont("KUNDENDATEN:\n", null, 28f, null)
            service.printTextWithFont("----------------------------------------\n", null, 24f, null)
            service.printTextWithFont("Name: ${request.customerName}\n", null, 24f, null)
            service.printTextWithFont("Telefon: ${request.customerPhone}\n", null, 24f, null)
            
            // Adresse nur bei Lieferung
            if (request.orderType == "delivery" && !request.customerAddress.isNullOrEmpty()) {
                service.printTextWithFont("Adresse:\n", null, 24f, null)
                service.printTextWithFont("${request.customerAddress}\n", null, 24f, null)
            }
            
            // Kundenanmerkungen
            if (!request.customerNotes.isNullOrEmpty()) {
                service.printTextWithFont("\nAnmerkung:\n", null, 24f, null)
                service.printTextWithFont("${request.customerNotes}\n", null, 24f, null)
            }
            
            service.printTextWithFont("\n", null, 24f, null)
            
            // Gerichte
            service.printTextWithFont("BESTELLUNG:\n", null, 28f, null)
            service.printTextWithFont("========================================\n", null, 24f, null)
            
            for (item in request.items) {
                // Menge und Name
                val itemLine = "${item.quantity}x ${item.name}"
                service.printTextWithFont(itemLine, null, 26f, null)
                
                // Variante
                if (!item.variant.isNullOrEmpty()) {
                    service.printTextWithFont(" (${item.variant})", null, 24f, null)
                }
                service.printTextWithFont("\n", null, 24f, null)
                
                // Toppings
                for (topping in item.toppings) {
                    service.printTextWithFont("  + ${topping.name}\n", null, 22f, null)
                }
                
                // Item-Notizen
                if (!item.notes.isNullOrEmpty()) {
                    service.printTextWithFont("  Notiz: ${item.notes}\n", null, 22f, null)
                }
                
                // Preis rechtsbündig
                val priceText = String.format("%.2f EUR", item.price)
                val spaces = 42 - itemLine.length - priceText.length
                if (spaces > 0) {
                    service.printTextWithFont(" ".repeat(spaces), null, 24f, null)
                }
                service.printTextWithFont("$priceText\n", null, 26f, null)
                service.printTextWithFont("\n", null, 24f, null)
            }
            
            // Summen
            service.printTextWithFont("========================================\n", null, 24f, null)
            
            // Zwischensumme
            printAmountLine(service, "Zwischensumme:", request.subtotal)
            
            // Rabatt
            if (request.discountAmount != null && request.discountAmount > 0) {
                printAmountLine(service, "Rabatt:", -request.discountAmount)
            }
            
            // Liefergebühr
            if (request.deliveryFee != null && request.deliveryFee > 0) {
                printAmountLine(service, "Liefergeb\u00FChr:", request.deliveryFee)
            }
            
            service.printTextWithFont("----------------------------------------\n", null, 24f, null)
            
            // Gesamtsumme - GROSS
            printAmountLine(service, "GESAMT:", request.total, large = true)
            
            service.printTextWithFont("========================================\n", null, 24f, null)
            service.printTextWithFont("\n", null, 24f, null)
            
            // Zahlungsart
            val paymentText = when(request.paymentMethod) {
                "cash" -> "BARZAHLUNG"
                "card" -> "KARTENZAHLUNG"
                "online" -> "ONLINE BEZAHLT"
                else -> "BARZAHLUNG"
            }
            service.setAlignment(1, null) // Zentriert
            service.printTextWithFont("$paymentText\n", null, 32f, null)
            service.printTextWithFont("\n", null, 24f, null)
            
            // Footer
            service.printTextWithFont("----------------------------------------\n", null, 24f, null)
            service.printTextWithFont("Vielen Dank f\u00FCr Ihre Bestellung!\n", null, 24f, null)
            service.printTextWithFont("========================================\n", null, 24f, null)
            
            // Feed paper
            service.lineWrap(4, null)
            
            Log.d(TAG, "Receipt printed successfully")
            true
        } catch (e: RemoteException) {
            Log.e(TAG, "RemoteException during printing", e)
            false
        } catch (e: Exception) {
            Log.e(TAG, "Exception during printing", e)
            false
        }
    }

    private fun printAmountLine(
        service: IWoyouService, 
        label: String, 
        amount: Double,
        large: Boolean = false
    ) {
        val fontSize = if (large) 30f else 24f
        val amountText = String.format("%.2f EUR", amount)
        val totalLength = 42
        val spaces = totalLength - label.length - amountText.length
        
        var line = label
        if (spaces > 0) {
            line += " ".repeat(spaces)
        }
        line += amountText
        
        service.printTextWithFont("$line\n", null, fontSize, null)
    }

    private fun formatDateTime(isoDateTime: String): Pair<String, String> {
        return try {
            // Parse ISO 8601 format (z.B. "2024-01-15T14:30:00.000Z")
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.GERMANY)
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            
            val date = inputFormat.parse(isoDateTime.replace("Z", ""))
            
            // Convert to local timezone
            val localCalendar = Calendar.getInstance()
            if (date != null) {
                localCalendar.time = date
            }
            
            // Format date and time separately
            val dateFormat = SimpleDateFormat("dd.MM.yyyy", Locale.GERMANY)
            val timeFormat = SimpleDateFormat("HH:mm", Locale.GERMANY)
            
            Pair(
                dateFormat.format(localCalendar.time),
                timeFormat.format(localCalendar.time) + " Uhr"
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing date: $isoDateTime", e)
            Pair("--.--.----", "--:-- Uhr")
        }
    }

    fun printTestReceipt(): Boolean {
        val testRequest = PrintRequest(
            restaurantId = "test",
            orderNumber = "TEST-123",
            orderType = "delivery",
            customerName = "Max Mustermann",
            customerPhone = "0123 456789",
            customerAddress = "Musterstraße 123\n12345 Musterstadt",
            customerNotes = "Bitte klingeln",
            items = listOf(
                PrintItem(
                    quantity = 2,
                    name = "Pizza Margherita",
                    variant = "Groß",
                    price = 18.00,
                    toppings = listOf(
                        PrintTopping("Extra Käse"),
                        PrintTopping("Oliven")
                    ),
                    notes = "Gut durchbacken"
                ),
                PrintItem(
                    quantity = 1,
                    name = "Cola",
                    variant = "0,5L",
                    price = 3.50,
                    toppings = emptyList(),
                    notes = null
                )
            ),
            subtotal = 21.50,
            discountAmount = 2.00,
            deliveryFee = 3.50,
            total = 23.00,
            paymentMethod = "cash",
            createdAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.GERMANY).format(Date())
        )
        
        return printReceipt(testRequest)
    }
}
```

---

## Änderungsübersicht

### Neu hinzugefügt:

1. **Datum und Uhrzeit** - Oben im Bon, formatiert als "dd.MM.yyyy" und "HH:mm Uhr"
2. **Kundendaten-Sektion** mit:
   - Name
   - Telefonnummer
   - Adresse (nur bei Lieferung)
   - Kundenanmerkungen
3. **Zwischensumme** - Vor Liefergebühr und Gesamt
4. **Rabatt** - Falls vorhanden
5. **Liefergebühr** - Falls vorhanden
6. **Zahlungsart** - Am Ende: "BARZAHLUNG", "KARTENZAHLUNG" oder "ONLINE BEZAHLT"

### Verbesserungen:

- Größere, fettere Schrift für wichtige Elemente (Bestellnummer, Lieferart, Gesamt)
- Bessere Strukturierung mit Trennlinien
- Rechtsbündige Preise
- Deutsche Formatierung (EUR statt €, Datum im Format dd.MM.yyyy)
- Umlaute korrekt escaped (\u00FC für ü)

---

## Installation

1. Öffnen Sie die SunmiPrintBridge Android-App in Android Studio
2. Navigieren Sie zu `app/src/main/java/com/restaurant/sunmiprintbridge/SunmiPrinterHelper.kt`
3. Ersetzen Sie den gesamten Inhalt mit dem obigen Code
4. Build → Rebuild Project
5. Installieren Sie die neue APK auf dem Sunmi-Gerät

---

## Test

Nach der Installation:

1. Öffnen Sie die App
2. Tippen Sie auf "Test Print"
3. Es sollte ein vollständiger Testbon mit allen Informationen gedruckt werden

Oder drucken Sie eine echte Bestellung aus dem Admin-Panel.

---

## Bon-Layout Vorschau

```
========================================
              BESTELLUNG
========================================

      Bestellung #123

Datum: 15.01.2024
Uhrzeit: 14:30 Uhr

========================================
            LIEFERUNG
========================================

KUNDENDATEN:
----------------------------------------
Name: Max Mustermann
Telefon: 0123 456789
Adresse:
Musterstraße 123
12345 Musterstadt

Anmerkung:
Bitte klingeln

BESTELLUNG:
========================================
2x Pizza Margherita (Groß)
  + Extra Käse
  + Oliven
  Notiz: Gut durchbacken
                           18.00 EUR

1x Cola (0,5L)
                            3.50 EUR

========================================
Zwischensumme:             21.50 EUR
Rabatt:                    -2.00 EUR
Liefergebühr:               3.50 EUR
----------------------------------------
GESAMT:                    23.00 EUR
========================================

         BARZAHLUNG

----------------------------------------
  Vielen Dank für Ihre Bestellung!
========================================
```

---

## Troubleshooting

### Umlaute werden nicht korrekt gedruckt
- Stellen Sie sicher, dass `\u00FC` für ü, `\u00E4` für ä, `\u00F6` für ö verwendet wird

### Schriftgröße zu groß/klein
- Passen Sie die `fontSize` Parameter in `printTextWithFont()` an
- Standard: 24f, Groß: 32-40f, Klein: 20-22f

### Rechtsbündigkeit funktioniert nicht
- Die Berechnung basiert auf 42 Zeichen Breite
- Bei anderem Drucker: Passen Sie `totalLength` in `printAmountLine()` an
