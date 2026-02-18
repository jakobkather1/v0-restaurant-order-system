# SEO-Einstellungen Troubleshooting Guide

## Problem: SEO-Daten werden nicht in der Cloud-Datenbank gespeichert

### ✅ Lösung implementiert

Die folgenden Änderungen wurden vorgenommen, um das Problem zu beheben:

#### 1. **Formularfeld-Namen korrigiert**
- **Problem**: Formularfelder verwendeten falsche Namen (`platform_meta_title`, `platform_og_title`)
- **Lösung**: Namen geändert auf `seo_title`, `seo_description`, `seo_keywords`, `og_title`, `og_description`, `og_image`
- **Datei**: `components/super-admin/platform-seo-tab.tsx`

#### 2. **Debug-Logging hinzugefügt**
- **Client-seitig**: Log der Formulardaten vor dem Absenden
- **Server-seitig**: Detailliertes Logging für jeden Speichervorgang
- **Dateien**: 
  - `components/super-admin/platform-seo-tab.tsx` (Client)
  - `app/super-admin/actions.ts` (Server)

---

## 🔍 Wie man überprüft, ob die Speicherung funktioniert

### Schritt 1: Browser-Konsole öffnen
1. Gehe zu `/super-admin` → Tab "SEO"
2. Öffne die Browser-DevTools (F12)
3. Wechsle zum "Console" Tab

### Schritt 2: SEO-Daten eingeben und speichern
1. Fülle die Felder aus:
   - Meta Title: z.B. "Order Terminal - Online Bestellsystem"
   - Meta Description: z.B. "Professionelles Bestellsystem für Restaurants"
   - Keywords, OG Tags, etc.
2. Klicke auf "SEO Einstellungen speichern"

### Schritt 3: Logs überprüfen

#### ✅ Erfolgreiche Speicherung - Du solltest sehen:

**Client-Logs:**
\`\`\`
[v0] Submitting SEO settings: {
  seo_title: "Order Terminal - Online Bestellsystem",
  seo_description: "Professionelles Bestellsystem...",
  ...
}
[v0] SEO settings save result: { success: true }
\`\`\`

**Server-Logs (im Terminal/Vercel Logs):**
\`\`\`
[v0] Starting SEO settings update...
[v0] Saving seo_title: "Order Terminal - Online Bestellsystem"
[v0] Save result for seo_title: true
[v0] Saving seo_description: "Professionelles Bestellsystem..."
[v0] Save result for seo_description: true
...
[v0] All SEO settings saved successfully to database
[v0] Revalidating paths...
[v0] Paths revalidated
\`\`\`

**Toast-Benachrichtigung:**
"Platform SEO Einstellungen wurden gespeichert" (grün)

---

## 🚨 Typische Fehlerquellen und Behebung

### Fehler 1: "Nicht autorisiert"
**Symptom**: Toast zeigt "Nicht autorisiert" Fehlermeldung

**Ursachen**:
- Super-Admin Session abgelaufen
- Nicht als Super-Admin eingeloggt

**Lösung**:
1. Logout und erneut einloggen bei `/super-admin`
2. Session-Cookie überprüfen (DevTools → Application → Cookies)

---

### Fehler 2: Daten werden nicht gespeichert (kein Fehler sichtbar)
**Symptom**: Formular wird abgesendet, aber Daten erscheinen nicht in der Datenbank

**Ursachen**:
- Falsche Formularfeld-Namen
- `updatePlatformSetting` Funktion schlägt fehl
- Datenbankverbindung unterbrochen

**Lösung**:
1. **Formularfeld-Namen prüfen**:
   \`\`\`tsx
   // ✅ RICHTIG
   <Input name="seo_title" ... />
   
   // ❌ FALSCH
   <Input name="platform_meta_title" ... />
   \`\`\`

2. **Datenbank-Logs prüfen**:
   - Vercel Dashboard → Function Logs
   - Nach `[v0] Save result for` suchen
   - Sollte `true` sein für jeden Eintrag

3. **Datenbankverbindung testen**:
   \`\`\`sql
   SELECT * FROM platform_settings 
   WHERE setting_key IN ('seo_title', 'seo_description');
   \`\`\`

---

### Fehler 3: "Fehler beim Speichern der Einstellungen"
**Symptom**: Rote Toast-Meldung mit Fehler

**Ursachen**:
- Datenbank nicht erreichbar
- SQL-Fehler in `updatePlatformSetting`
- Fehlende Tabelle `platform_settings`

**Lösung**:
1. **Datenbank-Schema überprüfen**:
   \`\`\`sql
   -- Tabelle sollte existieren
   SELECT * FROM platform_settings LIMIT 1;
   \`\`\`

2. **Migration ausführen**:
   \`\`\`bash
   # Stelle sicher, dass Migration 038 ausgeführt wurde
   scripts/038-platform-seo-settings.sql
   \`\`\`

3. **updatePlatformSetting Funktion prüfen** (`lib/db.ts`):
   \`\`\`typescript
   export async function updatePlatformSetting(key: string, value: string): Promise<boolean> {
     try {
       await sql`
         INSERT INTO platform_settings (setting_key, setting_value, updated_at)
         VALUES (${key}, ${value}, NOW())
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = ${value}, updated_at = NOW()
       `
       return true
     } catch {
       return false
     }
   }
   \`\`\`

---

### Fehler 4: SEO Meta-Tags erscheinen nicht auf der Website
**Symptom**: Daten sind gespeichert, aber Meta-Tags werden nicht gerendert

**Ursachen**:
- `generateMetadata` Funktion in `app/layout.tsx` funktioniert nicht
- Cache wurde nicht invalidiert
- SQL-Abfrage schlägt fehl

**Lösung**:
1. **Layout-Funktion prüfen** (`app/layout.tsx`):
   \`\`\`typescript
   async function getPlatformSeoSettings() {
     try {
       const result = await sql`
         SELECT setting_key, setting_value 
         FROM platform_settings 
         WHERE setting_key IN ('seo_title', 'seo_description', ...)
       `
       return settings
     } catch (error) {
       console.error("[v0] Failed to load platform SEO settings:", error)
       return {}
     }
   }
   \`\`\`

2. **Cache manuell löschen**:
   - Vercel: Redeploy durchführen
   - Lokal: `.next` Ordner löschen und neu starten

3. **Seitenquelltext überprüfen**:
   - Rechtsklick → "Seitenquelltext anzeigen"
   - Nach `<meta name="description"` suchen
   - Sollte deine Description enthalten

---

## 🔧 Debugging-Schritte bei Problemen

### 1. Formular-Daten prüfen
\`\`\`javascript
// In Browser-Konsole während Formular offen ist:
const form = document.querySelector('form');
const formData = new FormData(form);
for (let [key, value] of formData.entries()) {
  console.log(key, ':', value);
}
\`\`\`

### 2. Server Action direkt testen
\`\`\`javascript
// In Browser-Konsole:
const formData = new FormData();
formData.append('seo_title', 'Test Title');
formData.append('seo_description', 'Test Description');

const result = await updatePlatformSettings(formData);
console.log(result);
\`\`\`

### 3. Datenbank direkt prüfen
\`\`\`sql
-- In Supabase/Neon SQL Editor:
SELECT * FROM platform_settings 
WHERE setting_key LIKE 'seo_%' OR setting_key LIKE 'og_%'
ORDER BY updated_at DESC;
\`\`\`

### 4. Vercel Function Logs ansehen
1. Vercel Dashboard → Dein Projekt → Logs
2. Filter: "Super Admin"
3. Nach `[v0]` Logs suchen

---

## ✅ Checkliste für erfolgreiche SEO-Speicherung

- [ ] Migration `038-platform-seo-settings.sql` wurde ausgeführt
- [ ] Tabelle `platform_settings` existiert in der Datenbank
- [ ] Super-Admin ist eingeloggt (Session aktiv)
- [ ] Formularfelder haben korrekte Namen (`seo_title`, nicht `platform_meta_title`)
- [ ] `updatePlatformSettings` Function ist in `app/super-admin/actions.ts` exportiert
- [ ] `updatePlatformSetting` Function existiert in `lib/db.ts`
- [ ] Browser-Konsole zeigt "[v0] Submitting SEO settings"
- [ ] Server-Logs zeigen "All SEO settings saved successfully"
- [ ] Toast zeigt grüne Erfolgsmeldung
- [ ] Datenbank enthält die neuen Werte (SELECT Abfrage)
- [ ] Meta-Tags erscheinen im Seitenquelltext nach Cache-Invalidierung

---

## 📞 Support

Falls das Problem weiterhin besteht:

1. **Debug-Logs sammeln**: Alle `[v0]` Logs aus Browser + Server kopieren
2. **SQL-Abfrage durchführen**: `SELECT * FROM platform_settings;` Ergebnis teilen
3. **Screenshot**: Von Browser-Konsole und Toast-Meldung
4. **Deployment-Logs**: Vercel Function Logs der letzten Speicherung

Mit diesen Informationen kann das Problem effizient analysiert werden.
