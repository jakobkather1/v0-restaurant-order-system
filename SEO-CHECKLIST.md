# Google SEO - Komplette Checkliste

## ✅ SCHRITT 1: Vercel Custom Domain Setup (MANUELL)

### Was du tun musst:

- [ ] **Domain kaufen** bei einem Provider (GoDaddy, Namecheap, IONOS, Strato, etc.)
- [ ] **Vercel Dashboard öffnen**: https://vercel.com/[dein-projekt]/settings/domains
- [ ] **Domain hinzufügen**: Klicke "Add Domain" → Gib Domain ein (z.B. `restaurant.de`)
- [ ] **DNS Records beim Provider setzen**:
  \`\`\`
  Type: A
  Name: @
  Value: 76.76.21.21
  
  Type: CNAME  
  Name: www
  Value: cname.vercel-dns.com
  \`\`\`
- [ ] **Warte 5-60 Minuten** bis DNS propagiert ist
- [ ] **Vercel Status prüfen**: Domain sollte "Ready" anzeigen
- [ ] **Datenbank aktualisieren**: Setze `domain` Column im Restaurant auf `restaurant.de`

**Tools zum Testen:**
- DNS Check: https://dnschecker.org
- Vercel Dashboard: https://vercel.com/[projekt]/settings/domains

---

## ✅ SCHRITT 2: Middleware Routing (AUTOMATISCH INTEGRIERT)

### Was bereits implementiert ist:

- [x] ✅ Middleware erkennt Custom Domains automatisch
- [x] ✅ Routing zu `/tenants/[domain]` funktioniert
- [x] ✅ Logs zeigen: `[v0] Middleware: ✓ CUSTOM DOMAIN detected`

### Wie du es testest:

\`\`\`bash
# Öffne Vercel Logs und suche nach:
[v0] Middleware: ✓ CUSTOM DOMAIN detected: restaurant.de
[v0] Middleware: REWRITING from restaurant.de/ to /tenants/restaurant.de/
\`\`\`

**Falls Fehler**: Prüfe ob Domain in Datenbank korrekt gesetzt ist.

---

## ✅ SCHRITT 3: Sitemap für Custom Domains (AUTOMATISCH INTEGRIERT)

### Was bereits implementiert ist:

- [x] ✅ Route: `app/tenants/[domain]/sitemap.xml/route.ts`
- [x] ✅ Generiert automatisch:
  - Homepage (Priority 1.0)
  - Legal Pages (Impressum, Datenschutz, AGB, Widerruf)
  - Allergen-Seite
  - Restaurant Bilder (image sitemap)

### Wie du es testest:

\`\`\`bash
# Browser oder Terminal:
https://restaurant.de/sitemap.xml

# Erwartete Ausgabe: XML mit allen Seiten
\`\`\`

**Google Tools:**
- XML Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Sitemap einreichen in Google Search Console

---

## ✅ SCHRITT 4: Robots.txt für Custom Domains (AUTOMATISCH INTEGRIERT)

### Was bereits implementiert ist:

- [x] ✅ Route: `app/tenants/[domain]/robots.txt/route.ts`
- [x] ✅ Erlaubt alle Seiten außer `/admin` und `/api/`
- [x] ✅ Referenziert die Sitemap
- [x] ✅ Crawl-delay gesetzt (respektvoll gegenüber Google Bot)

### Wie du es testest:

\`\`\`bash
# Browser oder Terminal:
https://restaurant.de/robots.txt

# Erwartete Ausgabe:
# Robots.txt for restaurant.de
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://restaurant.de/sitemap.xml

Crawl-delay: 1
\`\`\`

**Google Tools:**
- Robots.txt Tester: https://support.google.com/webmasters/answer/6062598

---

## ✅ SCHRITT 5: Google Search Console (MANUELL)

### Was du tun musst:

- [ ] **Google Search Console öffnen**: https://search.google.com/search-console
- [ ] **Property hinzufügen**:
  - Klicke "Add Property"
  - Wähle "URL prefix"
  - Gib ein: `https://restaurant.de`
- [ ] **Domain verifizieren**:
  - **Methode 1 - DNS (Empfohlen)**:
    \`\`\`
    Type: TXT
    Name: @
    Value: google-site-verification=XXXXXXXX (von Google)
    \`\`\`
  - **Methode 2 - HTML File**: Lade Verification-Datei hoch
  - **Methode 3 - HTML Tag**: Füge Meta-Tag in `<head>` hinzu
- [ ] **Sitemap einreichen**:
  - Gehe zu: Sitemaps → Add new sitemap
  - Gib ein: `https://restaurant.de/sitemap.xml`
  - Klicke "Submit"
- [ ] **Indexierung anfordern**:
  - Gehe zu: URL Inspection
  - Gib ein: `https://restaurant.de`
  - Klicke "Request Indexing"

**Timeline:**
- Tag 1-3: Verification abgeschlossen
- Tag 3-7: Erste Crawls von Google
- Tag 7-14: Erste Seiten im Index
- Woche 2-4: Vollständige Indexierung

---

## ✅ BONUS: SEO Metadata & Structured Data (AUTOMATISCH INTEGRIERT)

### Was bereits implementiert ist:

- [x] ✅ Dynamische Metadata in `app/tenants/[domain]/page.tsx`
- [x] ✅ Restaurant-spezifische SEO Title, Description, Keywords
- [x] ✅ OpenGraph Tags (Facebook/LinkedIn Previews)
- [x] ✅ Twitter Cards
- [x] ✅ Canonical URLs
- [x] ✅ JSON-LD Structured Data (Restaurant Schema):
  - Name, Address, Phone, Email
  - Opening Hours
  - Cuisine Type, Price Range
  - Aggregate Ratings (falls Reviews vorhanden)

### Wie du es testest:

**View Page Source:**
\`\`\`html
<title>Pizza Luigi - Beste Pizza in München</title>
<meta name="description" content="Bestelle jetzt...">
<link rel="canonical" href="https://restaurant.de">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Pizza Luigi",
  ...
}
</script>
\`\`\`

**Google's Rich Results Test:**
1. Gehe zu: https://search.google.com/test/rich-results
2. Gib URL ein: `https://restaurant.de`
3. Ergebnis: ✅ **Restaurant schema detected**

---

## 📊 Monitoring & Erfolg messen

### Nach 2 Wochen:

- [ ] Google Search Console → Coverage: Valid URLs > 0
- [ ] Google Search Console → Performance: Impressions > 0
- [ ] Google Suche: `site:restaurant.de` zeigt Ergebnisse

### Nach 4 Wochen:

- [ ] Rankings für Brand-Name (z.B. "Pizza Luigi München")
- [ ] CTR > 1%
- [ ] Average Position < 20

### Nach 8 Wochen:

- [ ] Position < 10 (erste Seite)
- [ ] Organischer Traffic > 50 Visits/Monat
- [ ] Rankings für Long-Tail Keywords

---

## 🛠 Troubleshooting

### Problem: Domain zeigt 404

**Checkliste:**
- [ ] Vercel Domain Status = "Ready"?
- [ ] DNS Records korrekt gesetzt?
- [ ] `domain` Column in Datenbank korrekt?
- [ ] Middleware Logs zeigen Custom Domain Detection?

**Lösung**: Siehe VERIFY-SEO.md

### Problem: Sitemap zeigt 404

**Checkliste:**
- [ ] Route existiert: `app/tenants/[domain]/sitemap.xml/route.ts`?
- [ ] Middleware routet zu `/tenants/[domain]`?
- [ ] `getRestaurantByDomain()` findet Restaurant?

**Lösung**: Vercel Logs prüfen

### Problem: Google findet Seite nicht

**Checkliste:**
- [ ] robots.txt erlaubt Crawling?
- [ ] Sitemap in Search Console eingereicht?
- [ ] Indexierung angefordert?
- [ ] Mindestens 1-2 Wochen gewartet?

**Lösung**: Geduld + manuelle Indexierungsanforderung

---

## 📚 Weitere Dokumentation

- **GOOGLE-SEO-SETUP.md**: Vollständige Setup-Anleitung
- **VERIFY-SEO.md**: Detaillierte Verifikationsschritte
- **TROUBLESHOOTING-SEO.md**: Fehlersuche & Lösungen

---

## ✨ Quick Win: Lokales SEO

Zusätzlich zur technischen SEO:

- [ ] **Google My Business** erstellen
- [ ] **Bing Places** Eintrag
- [ ] **Apple Maps** Eintrag
- [ ] **Facebook Page** mit Adresse
- [ ] **Instagram Business** Account
- [ ] **Lieferando/Wolt** Profile (Backlinks!)
- [ ] **Lokale Verzeichnisse**: Gelbe Seiten, 11880, etc.

Diese erzeugen Backlinks und Local Citations → bessere Rankings!

---

## 🎯 SEO Best Practices

### Content:
- Unique Content (keine Duplikate)
- Restaurant-Name + Stadt in Title
- Cuisine-Type erwähnen
- Call-to-Action ("Jetzt bestellen")

### Technical:
- HTTPS (✓ automatisch durch Vercel)
- Mobile-Responsive (✓ automatisch durch Next.js)
- Fast Loading (✓ Next.js SSR + CDN)
- Structured Data (✓ automatisch implementiert)

### Off-Page:
- Google My Business
- Social Media Präsenz
- Backlinks von lokalen Websites
- Positive Reviews (Google, Facebook)

---

**Fragen? Siehe:** GOOGLE-SEO-SETUP.md oder VERIFY-SEO.md
