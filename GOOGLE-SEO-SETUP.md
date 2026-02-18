# Google SEO Setup für Custom Domains

## Übersicht

Dieses Dokument beschreibt, wie Restaurants mit Custom Domains in Google gefunden werden.

## Voraussetzungen

### 1. Custom Domain in Vercel einrichten

Jedes Restaurant braucht eine eigene Domain (z.B. `restaurant.de`):

1. **Domain kaufen** bei einem Provider (GoDaddy, Namecheap, IONOS, etc.)
2. **In Vercel hinzufügen**:
   - Gehe zu: https://vercel.com/[dein-projekt]/settings/domains
   - Klicke "Add Domain"
   - Gib Domain ein: `restaurant.de`
   - Vercel zeigt DNS-Einträge

3. **DNS Records beim Provider setzen**:
   \`\`\`
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   \`\`\`

4. **Warte 5-60 Minuten** bis DNS propagiert ist

### 2. Domain in Datenbank eintragen

Im Restaurant Admin-Panel:

1. Gehe zu **Settings** → **Custom Domain**
2. Trage die Domain ein: `restaurant.de` (ohne `https://` und ohne `www.`)
3. Klicke **Speichern**

Die Domain wird in der `domain` Column der `restaurants` Tabelle gespeichert.

### 3. SEO-Einstellungen konfigurieren

Im Restaurant Admin-Panel:

1. Gehe zu **SEO** Tab
2. Fülle aus:
   - **SEO Title**: z.B. "Pizza Luigi - Beste Pizza in München"
   - **SEO Description**: z.B. "Bestelle jetzt frische Pizza bei Pizza Luigi. Schnelle Lieferung in ganz München."
   - **SEO Keywords**: z.B. "Pizza München, Lieferservice, Italienisch"
3. Optional:
   - **Google Business URL**: Link zu Google My Business
   - **Facebook/Instagram**: Social Media Links
4. Klicke **Speichern**

## Technische Implementierung

### Middleware (Multi-Tenant Routing)

Die `middleware.ts` erkennt Custom Domains und routet zu `/tenants/[domain]`:

\`\`\`typescript
// Beispiel: restaurant.de → /tenants/restaurant.de
if (!isPlatformDomain && !isVercelDomain && !isLocalhost) {
  url.pathname = `/tenants/${cleanDomain}${pathname}`
  return NextResponse.rewrite(url)
}
\`\`\`

### SEO Metadata

Jede Custom Domain hat eigene Metadata in `app/tenants/[domain]/page.tsx`:

- **Title**: Restaurant-spezifisch
- **Description**: Restaurant-spezifisch
- **OpenGraph**: Mit Restaurant Logo/Bildern
- **Canonical URL**: Zeigt auf Custom Domain
- **Robots**: `index: true, follow: true`

### Sitemap

Jede Custom Domain hat eine eigene Sitemap unter:
- `https://restaurant.de/sitemap.xml`

Die Sitemap enthält:
- Homepage (Priority 1.0)
- Legal Pages (Impressum, Datenschutz, AGB, Widerruf)
- Allergen-Seite (falls vorhanden)
- Bilder (Restaurant Hero Image)

### Robots.txt

Jede Custom Domain hat eine eigene `robots.txt` unter:
- `https://restaurant.de/robots.txt`

Die `robots.txt` erlaubt:
- Alle Seiten außer `/admin` und `/api/`
- Verweist auf die Sitemap

## Google Search Console Setup

### 1. Property hinzufügen

1. Gehe zu: https://search.google.com/search-console
2. Klicke **Add Property**
3. Wähle **URL prefix** und gib ein: `https://restaurant.de`
4. **Verifiziere die Domain**:
   - **Methode 1 - DNS**: Füge TXT Record hinzu (empfohlen)
   - **Methode 2 - HTML File**: Lade Verification-Datei hoch
   - **Methode 3 - HTML Tag**: Füge Meta-Tag hinzu

### 2. Sitemap einreichen

1. In der Search Console → **Sitemaps**
2. Gib ein: `https://restaurant.de/sitemap.xml`
3. Klicke **Submit**

### 3. Indexierung anfordern

1. In der Search Console → **URL Inspection**
2. Gib ein: `https://restaurant.de`
3. Klicke **Request Indexing**

## Debugging & Troubleshooting

### Domain wird nicht gefunden

**Problem**: Google findet die Domain nicht

**Lösung**:
1. Prüfe DNS: `nslookup restaurant.de` (sollte Vercel IP zeigen)
2. Prüfe Vercel: Domain sollte "Ready" Status haben
3. Prüfe Datenbank: `domain` Column sollte korrekt gesetzt sein
4. Prüfe Middleware Logs: `[v0] Middleware: ✓ CUSTOM DOMAIN detected`

### Robots.txt funktioniert nicht

**Problem**: `https://restaurant.de/robots.txt` zeigt 404

**Lösung**:
1. Prüfe ob Route existiert: `app/tenants/[domain]/robots.txt/route.ts`
2. Prüfe Middleware: Custom Domain muss zu `/tenants/[domain]` routen
3. Teste manuell: `curl https://restaurant.de/robots.txt`

### Sitemap wird nicht generiert

**Problem**: `https://restaurant.de/sitemap.xml` zeigt Fehler

**Lösung**:
1. Prüfe Route: `app/tenants/[domain]/sitemap.xml/route.ts`
2. Prüfe DB-Zugriff: `getRestaurantByDomain()` funktioniert?
3. Prüfe Server Logs in Vercel Dashboard

### Restaurant hat keine SEO-Einstellungen

**Problem**: Metadata ist generisch

**Lösung**:
1. Im Admin-Panel → **SEO** Tab
2. Fülle SEO Title, Description, Keywords aus
3. Die `app/tenants/[domain]/page.tsx` nutzt diese automatisch

## Checkliste

Vor dem Launch einer Custom Domain:

- [ ] Domain gekauft und DNS konfiguriert
- [ ] Domain in Vercel hinzugefügt (Status: Ready)
- [ ] Domain in Datenbank eingetragen (`restaurants.domain`)
- [ ] SEO-Einstellungen im Admin ausgefüllt
- [ ] Robots.txt erreichbar: `https://domain.com/robots.txt`
- [ ] Sitemap erreichbar: `https://domain.com/sitemap.xml`
- [ ] Google Search Console Property erstellt
- [ ] Sitemap in Search Console eingereicht
- [ ] Indexierung angefordert
- [ ] Legal Pages erreichbar (Impressum, Datenschutz, etc.)

## SEO Best Practices

### On-Page SEO

- ✅ Einzigartige Title Tags (max 60 Zeichen)
- ✅ Aussagekräftige Meta Descriptions (max 160 Zeichen)
- ✅ Strukturierte Daten (JSON-LD für Restaurant, Address, Opening Hours)
- ✅ Semantic HTML (h1, h2, nav, main, article)
- ✅ Alt-Tags für alle Bilder
- ✅ Mobile-Responsive Design
- ✅ Schnelle Ladezeiten (Next.js App Router)

### Content SEO

- Restaurant-Name in Title
- Stadt/Location in Description
- Cuisine-Type erwähnen (Pizza, Burger, etc.)
- Unique Content (keine Duplikate)
- Call-to-Action ("Jetzt bestellen")

### Technical SEO

- ✅ HTTPS enabled (Vercel automatisch)
- ✅ Canonical URLs gesetzt
- ✅ robots.txt konfiguriert
- ✅ sitemap.xml generiert
- ✅ Structured Data (JSON-LD)
- ✅ OpenGraph Tags
- ✅ Twitter Cards

## Monitoring

### Google Search Console Metriken

Wichtige Metriken:
- **Impressions**: Wie oft die Site in Google erscheint
- **Clicks**: Wie oft Nutzer klicken
- **CTR**: Click-Through-Rate (Clicks/Impressions)
- **Average Position**: Durchschnittliche Position in Suchergebnissen

Ziel:
- Position < 10 (erste Seite)
- CTR > 2%
- Steady growth in Impressions

### Verbesserungen

Falls Rankings schlecht sind:

1. **Lokale Keywords nutzen**: "Pizza [Stadt]"
2. **Google My Business erstellen**: Lokale Suche boosten
3. **Backlinks aufbauen**: Andere Websites verlinken lassen
4. **Reviews sammeln**: Positive Reviews steigern Vertrauen
5. **Content erweitern**: Blog/News hinzufügen

## Support

Bei Problemen:
1. Prüfe TROUBLESHOOTING-SEO.md
2. Prüfe Middleware Logs in Vercel
3. Teste mit Google's Rich Results Test: https://search.google.com/test/rich-results
