# SEO Verifikation - Schritt-für-Schritt Checkliste

## Schnell-Check

Teste diese URLs in deinem Browser (ersetze `restaurant.de` mit der echten Domain):

\`\`\`
✅ Homepage:        https://restaurant.de
✅ Robots.txt:      https://restaurant.de/robots.txt
✅ Sitemap:         https://restaurant.de/sitemap.xml
✅ Impressum:       https://restaurant.de/legal/impressum
✅ Datenschutz:     https://restaurant.de/legal/datenschutz
\`\`\`

## Detaillierte Verifikation

### 1. DNS Propagation Check

\`\`\`bash
# Terminal Command
nslookup restaurant.de

# Erwartete Ausgabe:
# Address: 76.76.21.21 (Vercel IP)
\`\`\`

Online Tool: https://dnschecker.org

### 2. Vercel Domain Status

1. Gehe zu: https://vercel.com/[projekt]/settings/domains
2. Suche die Domain: `restaurant.de`
3. Status muss sein: ✅ **Ready**

Falls **Pending**: Warte noch auf DNS Propagation (bis zu 48h)

### 3. Database Check

\`\`\`sql
-- In Supabase/Neon SQL Editor
SELECT id, name, domain, custom_domain, is_active 
FROM restaurants 
WHERE domain = 'restaurant.de' OR custom_domain = 'restaurant.de';
\`\`\`

Erwartetes Ergebnis:
- `domain` oder `custom_domain` = `restaurant.de`
- `is_active` = `true`

### 4. Middleware Check

Öffne Vercel Logs und suche nach:

\`\`\`
[v0] Middleware: ✓ CUSTOM DOMAIN detected: restaurant.de
[v0] Middleware: REWRITING from restaurant.de/ to /tenants/restaurant.de/
\`\`\`

Falls du `Platform/Vercel domain detected` siehst → Middleware erkennt es nicht als Custom Domain

### 5. SEO Metadata Check

**Methode 1: View Page Source**
1. Öffne `https://restaurant.de`
2. Rechtsklick → "View Page Source" (oder Ctrl+U)
3. Suche nach:

\`\`\`html
<title>Pizza Luigi - Beste Pizza in München</title>
<meta name="description" content="Bestelle jetzt frische Pizza...">
<meta property="og:title" content="Pizza Luigi - Beste Pizza in München">
<link rel="canonical" href="https://restaurant.de">

<!-- JSON-LD Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Pizza Luigi",
  ...
}
</script>
\`\`\`

**Methode 2: Google's Rich Results Test**
1. Gehe zu: https://search.google.com/test/rich-results
2. Gib URL ein: `https://restaurant.de`
3. Klicke "Test URL"
4. Ergebnis sollte zeigen: ✅ **Restaurant schema detected**

### 6. Robots.txt Verifikation

\`\`\`bash
# Terminal
curl https://restaurant.de/robots.txt
\`\`\`

Erwartete Ausgabe:
\`\`\`
# Robots.txt for restaurant.de
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://restaurant.de/sitemap.xml

Crawl-delay: 1
\`\`\`

### 7. Sitemap Verifikation

\`\`\`bash
# Terminal
curl https://restaurant.de/sitemap.xml
\`\`\`

Erwartete Ausgabe:
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://restaurant.de</loc>
    <lastmod>2026-01-31T...</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ...
</urlset>
\`\`\`

### 8. Mobile-Friendly Test

1. Gehe zu: https://search.google.com/test/mobile-friendly
2. Gib URL ein: `https://restaurant.de`
3. Ergebnis sollte sein: ✅ **Page is mobile-friendly**

### 9. PageSpeed Insights

1. Gehe zu: https://pagespeed.web.dev
2. Gib URL ein: `https://restaurant.de`
3. Prüfe Scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

### 10. Google Search Console Verification

1. Gehe zu: https://search.google.com/search-console
2. Wähle Property: `https://restaurant.de`
3. **URL Inspection**:
   - Gib URL ein: `https://restaurant.de`
   - Status sollte sein: **URL is on Google**
   
4. **Coverage Report**:
   - Valid URLs: > 0
   - Errors: 0

5. **Sitemaps**:
   - Status: **Success**
   - URLs submitted: > 0
   - URLs indexed: > 0

## Troubleshooting

### Problem: Domain zeigt 404

**Diagnose**:
\`\`\`bash
curl -I https://restaurant.de
# HTTP/1.1 404 Not Found
\`\`\`

**Lösung**:
1. Prüfe Vercel Domain Status (muss "Ready" sein)
2. Prüfe Datenbank: `domain` Column korrekt gesetzt?
3. Prüfe Middleware Logs: Wird Custom Domain erkannt?
4. Prüfe `getRestaurantByDomain()` in `lib/db.ts`

### Problem: Robots.txt zeigt 404

**Diagnose**:
\`\`\`bash
curl https://restaurant.de/robots.txt
# 404 Not Found
\`\`\`

**Lösung**:
1. Prüfe ob Route existiert: `app/tenants/[domain]/robots.txt/route.ts`
2. Middleware muss zu `/tenants/[domain]` routen
3. Redeploy in Vercel

### Problem: Sitemap ist leer oder fehlerhaft

**Diagnose**:
\`\`\`bash
curl https://restaurant.de/sitemap.xml
# Error oder leere Liste
\`\`\`

**Lösung**:
1. Prüfe Route: `app/tenants/[domain]/sitemap.xml/route.ts`
2. Prüfe DB-Zugriff: Kann `getRestaurantByDomain()` das Restaurant finden?
3. Prüfe Vercel Logs für Server Errors

### Problem: Google findet die Seite nicht

**Diagnose**:
\`\`\`
site:restaurant.de
# Keine Ergebnisse in Google
\`\`\`

**Lösung**:
1. **Warte 1-2 Wochen** - Indexierung braucht Zeit
2. **Google Search Console**: Request Indexing
3. **Prüfe robots.txt**: Darf Google crawlen?
4. **Prüfe noindex Tag**: Sollte NICHT vorhanden sein
5. **Backlinks erstellen**: Google My Business, Social Media, Verzeichnisse

### Problem: Structured Data Fehler

**Diagnose**:
Rich Results Test zeigt Fehler oder Warnings

**Lösung**:
1. Prüfe JSON-LD in Page Source
2. Prüfe ob alle Pflichtfelder vorhanden sind
3. Teste mit: https://validator.schema.org
4. Korrigiere Syntax-Fehler in `app/tenants/[domain]/page.tsx`

## SEO Timeline

**Was wann passiert:**

- **Tag 1**: Domain aufgesetzt, Sitemap eingereicht
- **Tag 1-3**: DNS propagiert, Vercel Domain "Ready"
- **Tag 3-7**: Google crawlt erste Seiten
- **Tag 7-14**: Erste Seiten im Index
- **Tag 14-30**: Vollständige Indexierung
- **Woche 4-8**: Rankings steigen
- **Monat 3-6**: Stabile Rankings erreicht

**Geduld ist wichtig!** SEO ist ein Marathon, kein Sprint.

## Manuelle Indexierung beschleunigen

### Google Search Console - Request Indexing

1. Gehe zu: https://search.google.com/search-console
2. **URL Inspection** Tool öffnen
3. Gib URL ein: `https://restaurant.de`
4. Klicke **Request Indexing**
5. Wiederhole für wichtige Seiten:
   - Homepage
   - Impressum
   - Datenschutz

### Bing Webmaster Tools

1. Gehe zu: https://www.bing.com/webmasters
2. Site hinzufügen: `https://restaurant.de`
3. URL Submit Tool nutzen

### Social Signals

- Teile die Domain auf Facebook, Twitter, LinkedIn
- Erstelle Google My Business Profile
- Trage in Restaurant-Verzeichnisse ein

## Success Metrics

Nach 4-8 Wochen solltest du sehen:

- ✅ Domain erscheint bei `site:restaurant.de` in Google
- ✅ Rankings für Brand-Name (z.B. "Pizza Luigi München")
- ✅ Impressions in Search Console > 0
- ✅ Clicks in Search Console > 0
- ✅ CTR > 1%
- ✅ Average Position < 20

## Monitoring Setup

### Weekly Checks

- Google Search Console → Performance Report
- Neue Errors in Coverage Report?
- Neue Manual Actions?

### Monthly SEO Audit

- Broken Links prüfen
- Content aktualisieren
- Neue Keywords recherchieren
- Konkurrenz analysieren

## Support

Fragen? Prüfe:
1. GOOGLE-SEO-SETUP.md (Vollständige Anleitung)
2. TROUBLESHOOTING-SEO.md (Fehlersuche)
3. Vercel Logs (Runtime Errors)
4. Database (Domain korrekt?)
