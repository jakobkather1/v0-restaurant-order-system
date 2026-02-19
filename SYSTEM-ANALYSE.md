# Restaurant Order Terminal - Vollständige Systemanalyse

Analysiert am: **2025**

---

## 📊 SYSTEM-ÜBERSICHT

Das System ist ein **Multi-Tenant Restaurant-Bestellsystem** mit drei Zugangsebenen:

1. **Platform-Ebene** (Super-Admin) - Verwaltung aller Restaurants
2. **Restaurant-Ebene** (Restaurant-Admin) - Verwaltung einzelner Restaurants
3. **Kunden-Ebene** (Öffentlich) - Bestellungen aufgeben

---

## 🗂️ ROUTING-ARCHITEKTUR

### **1. Platform Routes (Hauptdomain)**

Zugriff über: `order-terminal.de` oder Vercel-Domains (`*.vercel.app`, `*.vercel.run`)

#### **A. Super-Admin Bereich**
- ✅ `/super-admin` - Login-Seite
- ✅ `/super-admin/dashboard` - Restaurant-Übersicht
- ✅ `/super-admin/dashboard/[id]` - Restaurant-Details
- ✅ `/super-admin/restaurant/[id]` - Restaurant bearbeiten
- ✅ `/super-admin/domains` - Domain-Verwaltung
- ✅ `/super-admin/cookies` - Cookie-Einstellungen

#### **B. Restaurant Slug-Routes** (Öffentlich)
Format: `/{slug}` (z.B. `/doctordoener`, `/bella-marina`)

- ✅ `/{slug}` - Restaurant Startseite (Menü, Bestellung)
- ✅ `/{slug}/admin` - Restaurant Admin Login
- ✅ `/{slug}/admin/dashboard` - Restaurant Dashboard
- ✅ `/{slug}/admin/test-sunmi` - Sunmi Drucker Test
- ✅ `/{slug}/kategorie/{categorySlug}` - Kategorie-Seite (SEO)
- ✅ `/{slug}/gericht/{dishSlug}` - Gericht-Detailseite (SEO)
- ✅ `/{slug}/lieferung/{zoneSlug}` - Lieferzone-Seite (SEO)
- ✅ `/{slug}/order/{orderId}` - Bestellbestätigung
- ✅ `/{slug}/legal` - Impressum/Datenschutz

#### **C. Utility Routes**
- ✅ `/` - Platform Landingpage
- ✅ `/platform-legal` - Platform Rechtliches
- ⚠️ `/test-push` - Push-Notification Tests (Debug)
- ⚠️ `/test-push-e2e` - E2E Push Tests (Debug)
- ⚠️ `/test-notifications` - Notification Tests (Debug)
- ⚠️ `/push-diagnostic` - Push Diagnose (Debug)
- ⚠️ `/verify-push-setup` - Push Setup Check (Debug)
- ⚠️ `/vapid-status` - VAPID Status (Debug)
- ⚠️ `/setup-vapid-keys` - VAPID Setup (Debug)
- ⚠️ `/fix-vapid-keys` - VAPID Fix (Debug)
- ⚠️ `/admin/fix-push` - Push Fix Tool (Debug)

---

### **2. Tenant Routes (Custom Domains)**

Zugriff über: Custom Domain (z.B. `restaurant-name.de`)

Die Middleware leitet Custom Domains zu `/tenants/{domain}/...` um:

- ✅ `/tenants/{domain}` → Restaurant Startseite
- ✅ `/tenants/{domain}/admin` → Admin-Bereich
- ✅ `/tenants/{domain}/admin/dashboard` → Admin Dashboard
- ✅ `/tenants/{domain}/kategorie/{categorySlug}` → Kategorie
- ✅ `/tenants/{domain}/legal` → Rechtliches
- ✅ `/tenants/{domain}/lieferung/{zoneSlug}` → Lieferzone
- ⚠️ `/tenants/{domain}/test` → Domain Test (Debug)
- ⚠️ `/tenants/{domain}/test-lieferung` → Lieferung Test (Debug)

---

## 🔌 API ENDPOINTS

### **Restaurant APIs**
- ✅ `GET /api/{slug}/menu` - Menü abrufen
- ✅ `POST /api/orders` - Bestellung erstellen
- ✅ `GET /api/orders/{orderId}` - Bestellung abrufen
- ✅ `POST /api/orders/{orderId}/cancel` - Bestellung stornieren
- ✅ `POST /api/orders/archive` - Bestellungen archivieren
- ✅ `GET /api/delivery-times` - Lieferzeiten abrufen

### **Admin APIs**
- ✅ `POST /api/admin/{slug}/menu/batch` - Menü Batch-Update
- ✅ `POST /api/admin/{slug}/menu/item/{id}/variants` - Varianten verwalten
- ✅ `POST /api/admin/import-menu` - Menü importieren
- ✅ `POST /api/admin/scan-menu` - Menü scannen (OCR)
- ✅ `POST /api/admin/upload-menu-image` - Menü-Bild hochladen
- ✅ `POST /api/admin/generate-seo-description` - SEO generieren (AI)
- ✅ `POST /api/admin/generate-seo-footer` - SEO Footer generieren (AI)
- ✅ `POST /api/admin/domain-request` - Custom Domain anfragen

### **Push Notification APIs**
- ✅ `GET /api/admin/push/config` - Push Config
- ✅ `POST /api/admin/push/subscribe` - Subscription speichern
- ✅ `POST /api/admin/push/send` - Push senden
- ✅ `POST /api/admin/push/test` - Push Test
- ✅ `GET /api/admin/push/diagnostic` - Push Diagnose
- ✅ `GET /api/admin/push/vapid-key` - VAPID Key abrufen
- ✅ `POST /api/admin/push/validate-vapid` - VAPID validieren
- ✅ `POST /api/admin/push/reset-subscriptions` - Subscriptions zurücksetzen
- ✅ `POST /api/admin/generate-vapid-keys` - VAPID Keys generieren
- ✅ `POST /api/admin/vapid-generate` - VAPID generieren

### **Stripe APIs**
- ✅ `POST /api/stripe/payment-intent` - Zahlung erstellen
- ✅ `POST /api/stripe/connect` - Stripe Connect
- ✅ `GET /api/stripe/connect/callback` - Stripe Callback
- ✅ `POST /api/stripe/connect/refresh` - Stripe Refresh

### **Super-Admin APIs**
- ✅ `GET /api/super-admin/domain-requests` - Domain-Anfragen verwalten
- ✅ `GET /api/platform-seo` - Platform SEO Settings

### **System APIs**
- ✅ `POST /api/consent` - Cookie Consent speichern
- ✅ `GET /api/cookies` - Cookie-Einstellungen abrufen
- ✅ `GET /api/cron/cleanup-orders` - Alte Bestellungen löschen (Cron)
- ✅ `POST /api/ai/pizza-assistant` - AI Pizza-Assistent (Chat)

---

## 🗄️ DATENBANK-SCHEMA

### **Haupttabellen**
1. **restaurants** - Restaurant-Daten (Name, Slug, Domain, Logo, Colors, etc.)
2. **categories** - Menü-Kategorien
3. **menu_items** - Gerichte
4. **item_variants** - Größen/Varianten (S/M/L)
5. **toppings** - Extras/Toppings
6. **delivery_zones** - Lieferzonen mit Preisen
7. **orders** - Bestellungen
8. **order_items** - Bestellpositionen
9. **order_item_toppings** - Toppings in Bestellungen
10. **discount_codes** - Rabattcodes
11. **monthly_revenue** - Umsatz-Tracking

### **Platform-Tabellen**
12. **platform_settings** - Platform-weite Einstellungen
13. **super_admin_users** - Super-Admin Accounts
14. **billing_records** - Abrechnungen
15. **domain_requests** - Custom Domain Anfragen
16. **push_subscriptions** - Push-Notification Subscriptions
17. **admin_push_subscriptions** - Admin Push Subscriptions
18. **cookie_consent_logs** - Cookie-Consent Tracking
19. **qr_codes** - QR-Codes für Tische

### **SEO-Erweiterungen**
- **reviews** (restaurants) - Google Reviews Integration
- **seo_title, seo_description** (restaurants) - SEO Metadaten
- **seo_footer_text** (restaurants) - SEO Footer Content
- **allergens, additives** (menu_items) - Allergene/Zusatzstoffe
- **delivery_times** - Dynamische Lieferzeiten

---

## ⚙️ MIDDLEWARE-LOGIK

```
Eingehender Request → Hostname prüfen
│
├─ Ist Platform Domain? (order-terminal.de)
│  └─ ✅ Pass-through → Normale Routen verwenden
│
├─ Ist Vercel Domain? (.vercel.app, .vercel.run)
│  └─ ✅ Pass-through → Slug-basiertes Routing
│
├─ Ist Localhost? (localhost:3000)
│  └─ ✅ Pass-through → Dev-Modus
│
└─ Ist Custom Domain? (restaurant-name.de)
   └─ 🔄 Rewrite zu /tenants/{domain}/...
```

**Wichtig:** Die Middleware rewritet nur Custom Domains. Alle Vercel-Deployments und die Platform nutzen Slug-basiertes Routing.

---

## 🚨 AKTUELL IDENTIFIZIERTE PROBLEME

### **KRITISCH - Restaurants laden nicht über Slugs**

**Problem:**
- Die Debug-Logs zeigen: "Custom domain detected" für `sb-6oluwh2nsqmq.vercel.run`
- Die Middleware behandelt Vercel-Domains fälschlicherweise als Custom Domains
- URLs wie `/doctordoener` werden zu `/tenants/sb-6oluwh2nsqmq.vercel.run/doctordoener` umgeschrieben
- Das Tenant-System sucht nach einem Restaurant mit der **DOMAIN** `sb-6oluwh2nsqmq.vercel.run`
- Kein Restaurant hat diese Domain → **404 Fehler**

**Ursache:**
```typescript
// middleware.ts Zeile 45
const isVercelDomain = VERCEL_DEPLOYMENT_DOMAINS.some((domain) =>
  hostWithoutPort.includes(domain)  // ❌ FALSCH
)
```

Die Prüfung verwendet `.includes()` statt `.endsWith()`. Das funktioniert nicht korrekt für Domains wie `sb-6oluwh2nsqmq.vercel.run`, weil der String ".vercel.run" nicht als Substring vorkommt (nur als Suffix).

**Fix wurde bereits angewendet:**
```typescript
const isVercelDomain = VERCEL_DEPLOYMENT_DOMAINS.some((domain) =>
  hostWithoutPort.endsWith(domain)  // ✅ RICHTIG
)
```

**Status:** ✅ Behoben (im aktuellen Code)

---

### **KRITISCH - Turbopack Panic Errors**

**Problem:**
```
FATAL: Turbopack Error: Next.js package not found
Error: Cannot find module 'next/dist/compiled/cookie'
```

**Mögliche Ursachen:**
1. Beschädigte Node Modules
2. Inkonsistente Next.js Installation
3. Cache-Probleme

**Empfohlene Lösung:**
```bash
rm -rf node_modules .next
pnpm install
pnpm dev
```

---

### **KRITISCH - DATABASE_URL fehlt**

**Problem:**
```
Error: No database connection string was provided to `neon()`
```

**Ursache:**
Die Environment Variable `DATABASE_URL` ist nicht gesetzt.

**Lösung:**
```bash
# In .env.local hinzufügen:
DATABASE_URL="postgresql://..."
```

---

### **WARNUNG - Image Quality Configuration**

**Problem:**
```
Image with src "..." is using quality "90" which is not configured in images.qualities [75]
```

**Ursache:**
`next.config.mjs` hat nur `quality: 75` konfiguriert, aber Bilder verwenden 80 und 90.

**Fix:**
```javascript
// next.config.mjs
images: {
  remotePatterns: [...],
  qualities: [75, 80, 90],  // Alle verwendeten Qualitäten hinzufügen
}
```

---

### **WARNUNG - fetchConnectionCache deprecated**

**Problem:**
```
The `fetchConnectionCache` option is deprecated (now always `true`)
```

**Status:** ✅ Bereits behoben in `lib/db.ts`

---

## ✅ FUNKTIONIERENDE FEATURES

### **Restaurant-Features**
- ✅ Menü-Anzeige mit Kategorien
- ✅ Warenkorb mit Toppings/Varianten
- ✅ Checkout-Flow (Lieferung/Abholung)
- ✅ Stripe-Zahlung
- ✅ Bestellbestätigung per E-Mail
- ✅ Lieferzonen-Verwaltung
- ✅ Öffnungszeiten-Check
- ✅ Rabattcode-System
- ✅ SEO-optimierte Seiten (Kategorien, Gerichte, Lieferzonen)
- ✅ Cookie-Banner (DSGVO-konform)
- ✅ Google Analytics Integration

### **Admin-Features**
- ✅ Dashboard mit Bestellübersicht
- ✅ Echtzeit-Bestellbenachrichtigungen
- ✅ Menü-Verwaltung (Drag & Drop Sortierung)
- ✅ Kategorie-Verwaltung
- ✅ Varianten & Toppings
- ✅ Lieferzonen-Konfiguration
- ✅ Design-Anpassung (Logo, Farben, Hero-Image)
- ✅ Öffnungszeiten-Verwaltung
- ✅ Rabattcode-Verwaltung
- ✅ QR-Code-Generierung
- ✅ Sunmi-Drucker Integration
- ✅ Push-Notifications für neue Bestellungen
- ✅ AI-Menü-Scanner (OCR)
- ✅ AI-SEO-Generator

### **Super-Admin Features**
- ✅ Alle Restaurants verwalten
- ✅ Neue Restaurants erstellen
- ✅ Umsatz-Übersicht
- ✅ Domain-Anfragen verwalten
- ✅ Platform-weite Einstellungen
- ✅ Cookie-Konfiguration
- ✅ Billing-System

---

## 🧪 DEBUG/TEST SEITEN

Diese Seiten sollten nur in Development existieren:

- ⚠️ `/test-push` - Push-Notification Test
- ⚠️ `/test-push-e2e` - E2E Push Test
- ⚠️ `/test-notifications` - Notification Test
- ⚠️ `/push-diagnostic` - Push Diagnose
- ⚠️ `/verify-push-setup` - Push Setup Verify
- ⚠️ `/vapid-status` - VAPID Status
- ⚠️ `/setup-vapid-keys` - VAPID Keys Setup
- ⚠️ `/fix-vapid-keys` - VAPID Keys Fix
- ⚠️ `/admin/fix-push` - Admin Push Fix
- ⚠️ `/{slug}/admin/test-sunmi` - Sunmi Test
- ⚠️ `/tenants/{domain}/test` - Domain Test
- ⚠️ `/tenants/{domain}/test-lieferung` - Lieferung Test

**Empfehlung:** Diese Routen sollten in Production deaktiviert werden.

---

## 🔐 AUTHENTIFIZIERUNG

### **Super-Admin**
- Route: `/super-admin`
- Methode: Password + Username Hash
- Session: Cookie-basiert

### **Restaurant-Admin**
- Route: `/{slug}/admin`
- Methode: Restaurant-spezifisches Passwort
- Session: Cookie-basiert (`admin_token_{restaurantId}`)

### **Kunden**
- Keine Authentifizierung erforderlich
- Session: Shopping Cart in localStorage

---

## 🎨 DESIGN-SYSTEM

### **Theming**
- Primary Color: Pro Restaurant konfigurierbar
- Font: Geist Sans & Geist Mono
- Tailwind CSS v4
- Shadcn/ui Components
- Dark Mode: Nicht implementiert

### **Responsive Breakpoints**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🚀 DEPLOYMENT

### **Vercel**
- Platform: Vercel
- Framework: Next.js 16 (Turbopack)
- Node Version: 20.x
- Package Manager: pnpm

### **Datenbank**
- Provider: Neon PostgreSQL
- Connection: @neondatabase/serverless

### **File Storage**
- Provider: Vercel Blob
- Verwendung: Logos, Hero-Images, Menü-Bilder

---

## 📝 WICHTIGE HINWEISE

1. **Slug vs Domain Routing:**
   - Platform nutzt Slugs: `/doctordoener`
   - Custom Domains nutzen Domain-Rewrite: `/tenants/{domain}/`

2. **SEO-Struktur:**
   - Jedes Restaurant hat SEO-optimierte Unterseiten
   - Schema.org Markup für Restaurant, Menü, Reviews
   - Breadcrumbs
   - Dynamic Sitemaps

3. **Middleware ist entscheidend:**
   - Bestimmt, ob Slug- oder Domain-basiertes Routing
   - Muss Vercel-Domains korrekt erkennen
   - Custom Domains zum Tenant-System umleiten

4. **Multi-Tenancy Isolation:**
   - Alle Datenbank-Queries filtern nach `restaurant_id`
   - Admin-Sessions sind restaurant-spezifisch
   - Keine Cross-Tenant Daten-Leaks

---

## 🔍 WIE FINDE ICH SEITEN?

### **Als Super-Admin:**
1. Gehe zu `/super-admin`
2. Login mit Super-Admin Credentials
3. Zugriff auf Dashboard mit allen Restaurants

### **Als Restaurant-Admin:**
1. Gehe zu `/{slug}/admin` (z.B. `/doctordoener/admin`)
2. Login mit Restaurant-Passwort
3. Zugriff auf Restaurant-Dashboard

### **Als Kunde:**
1. Gehe zu `/{slug}` (z.B. `/doctordoener`)
2. Menü durchstöbern
3. Bestellung aufgeben

### **Custom Domain:**
1. Restaurant konfiguriert Custom Domain (z.B. `doctordoener.de`)
2. DNS zeigt auf Vercel
3. Middleware leitet automatisch um
4. Kunde sieht `doctordoener.de` (nicht `/doctordoener`)

---

## 🎯 NÄCHSTE SCHRITTE

### **Sofort beheben:**
1. ✅ Middleware `.endsWith()` Fix verifizieren
2. 🔧 Turbopack Error beheben (node_modules neu installieren)
3. 🔧 `DATABASE_URL` Environment Variable setzen
4. 🔧 Image qualities in `next.config.mjs` anpassen

### **In naher Zukunft:**
1. Debug-Routen in Production deaktivieren
2. Error Boundaries hinzufügen
3. Logging-System implementieren
4. Monitoring (Sentry o.ä.)

---

**Stand:** 29. Januar 2025
**Analysiert von:** v0 AI Assistant
