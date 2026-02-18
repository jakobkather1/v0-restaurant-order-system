# Custom Domain Setup für Restaurant-Bestellseiten

## Übersicht

Die Plattform unterstützt Custom Domains für jedes Restaurant. Wenn ein Restaurant eine eigene Domain hat (z.B. `pizzeria-luigi.de`), wird automatisch die Restaurant-Bestellseite geladen mit eigenem SEO und Branding.

## Wie es funktioniert

### 1. Domain-Erkennung (middleware.ts)

Die Middleware erkennt automatisch, ob eine Anfrage an:
- Die **Plattform-Domain** geht (`order-terminal.de`) → Normale Plattform-Seite
- Eine **Custom Domain** geht (`pizzeria-luigi.de`) → Restaurant-Seite

\`\`\`typescript
// Middleware prüft:
- Ist es order-terminal.de? → Plattform
- Ist es eine Vercel-Domain? → Plattform
- Ist es etwas anderes? → Custom Domain → Rewrite zu /_tenants/{domain}
\`\`\`

### 2. Tenant-Routing (app/_tenants/[domain]/page.tsx)

Die Tenant-Route lädt:
- Restaurant-Daten aus der Datenbank (basierend auf der `domain`-Spalte)
- Menü, Kategorien, Lieferzonen, Bewertungen
- Restaurant-spezifische SEO-Einstellungen
- Rendert das vollständige `OrderTerminal`

### 3. Restaurant-spezifisches SEO (generateMetadata)

Jede Custom Domain hat ihre eigenen Meta-Tags:
\`\`\`typescript
- title: Restaurant.seo_title oder "{Restaurant.name} - Online Bestellen"
- description: Restaurant.seo_description oder Restaurant.slogan
- keywords: Restaurant.seo_keywords
- og:image: Restaurant.og_image oder Restaurant.hero_image_url
\`\`\`

## Setup-Schritte

### Schritt 1: Environment Variable setzen

Bei Vercel unter **Settings → Environment Variables**:

\`\`\`
NEXT_PUBLIC_APP_DOMAIN=order-terminal.de
\`\`\`

### Schritt 2: Custom Domain im Super-Admin eintragen

1. Gehe zu **Super-Admin** → **Dashboard**
2. Wähle das Restaurant aus
3. Trage die Domain ein: `pizzeria-luigi.de` (oder Punycode für Umlaute: `xn--pizzeria-luigi-xyz.de`)
4. Speichern

### Schritt 3: DNS-Konfiguration

Der Restaurant-Besitzer muss in seinem DNS-Panel einen CNAME-Eintrag erstellen:

\`\`\`
Type: CNAME
Name: @ (oder www)
Value: cname.vercel-dns.com
\`\`\`

Oder einen A-Record zur Vercel-IP:

\`\`\`
Type: A
Name: @
Value: 76.76.21.21
\`\`\`

### Schritt 4: Domain bei Vercel hinzufügen

1. Gehe zu **Vercel Dashboard** → Dein Projekt → **Settings** → **Domains**
2. Füge die Domain hinzu: `pizzeria-luigi.de`
3. Vercel generiert automatisch SSL-Zertifikate

### Schritt 5: Testen

Rufe `https://pizzeria-luigi.de` auf → Du solltest die Restaurant-Bestellseite sehen mit:
- Restaurant-Namen im Title
- Restaurant-Logo und -Farben
- Eigenem SEO (prüfe mit "View Page Source")

## Umlaute in Domains

Deutsche Domains mit Umlauten (ö, ä, ü) müssen in **Punycode** konvertiert werden:

- `doctordöner.de` → `xn--doctordner-9db.de`

**Punycode-Converter:** https://www.punycoder.com/

## Datenbank-Struktur

### restaurants-Tabelle

Die `domain`-Spalte speichert die Custom Domain:

\`\`\`sql
UPDATE restaurants 
SET domain = 'pizzeria-luigi.de' 
WHERE id = 'xxx';
\`\`\`

### SEO-Felder im Restaurant

- `seo_title`: Individueller Title-Tag
- `seo_description`: Meta Description
- `seo_keywords`: Keywords (komma-getrennt)
- `og_image`: Open Graph Bild-URL
- `hero_image_url`: Fallback für OG-Image

## Debugging

### Middleware-Logs prüfen

Die Middleware loggt alle Domain-Erkennungen:

\`\`\`
[v0] Middleware: Host = pizzeria-luigi.de
[v0] Middleware: ✓ CUSTOM DOMAIN detected: pizzeria-luigi.de
[v0] Middleware: REWRITING to /_tenants/pizzeria-luigi.de
\`\`\`

### Datenbank-Logs prüfen

\`\`\`
[v0] DB: Looking up restaurant by domain: pizzeria-luigi.de
[v0] DB: Restaurant found by domain: Pizzeria Luigi
\`\`\`

### Häufige Fehler

**404 "Restaurant nicht gefunden":**
- Prüfe, ob die Domain exakt so in der `domain`-Spalte steht
- Middleware normalisiert automatisch (lowercase, kein www.)
- Datenbank-Query ist case-insensitive

**Seite lädt nicht / DNS-Fehler:**
- DNS-Propagation kann bis zu 48h dauern
- Prüfe DNS mit `nslookup pizzeria-luigi.de`
- Vercel-Domain muss korrekt eingetragen sein

**Falsche SEO-Tags:**
- Prüfe die Restaurant-Tabelle auf korrekte SEO-Felder
- generateMetadata nutzt Fallbacks: Name → Slogan → Defaults

## Architektur-Diagramm

\`\`\`
Anfrage: pizzeria-luigi.de
    ↓
middleware.ts
    ↓ erkennt Custom Domain
    ↓ rewritet zu /_tenants/pizzeria-luigi.de
    ↓
app/_tenants/[domain]/page.tsx
    ↓ lädt Restaurant via getRestaurantByDomain(domain)
    ↓ generiert Metadata mit Restaurant-SEO
    ↓ rendert OrderTerminal
    ↓
Browser zeigt: pizzeria-luigi.de (URL bleibt unverändert)
\`\`\`

## Multi-Tenant-Vorteile

✅ **SEO-optimiert**: Jedes Restaurant hat eigene Meta-Tags und URLs
✅ **White-Labeling**: URL bleibt Custom Domain, kein "order-terminal.de" sichtbar
✅ **Skalierbar**: Unbegrenzt viele Restaurants mit eigenen Domains
✅ **Zentrale Verwaltung**: Alle Domains in einer Plattform
✅ **Automatische SSL**: Vercel generiert Zertifikate für alle Domains
