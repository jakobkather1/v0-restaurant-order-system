# VAPID Keys Setup für Push-Benachrichtigungen

## Problem

Sie erhalten den Fehler: **"applicationServerKey must contain a valid P-256 public key"**

**Ursache:** Der verwendete VAPID Public Key hat nicht das korrekte P-256 Format, das Browser für Web Push verlangen.

## Lösung

### Option 1: Keys selbst generieren (Empfohlen)

1. **Installieren Sie web-push lokal:**
   \`\`\`bash
   npm install web-push --save
   \`\`\`

2. **Generieren Sie die Keys:**
   \`\`\`bash
   node scripts/generate-vapid-keys.js
   \`\`\`

3. **Kopieren Sie die generierten Keys in Vercel:**
   - Gehen Sie zu: Vercel → Project Settings → Environment Variables
   - Fügen Sie hinzu:
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → Der Public Key (88 Zeichen)
     - `VAPID_PRIVATE_KEY` → Der Private Key (43 Zeichen)
     - `VAPID_EMAIL` → `mailto:admin@order-terminal.de`

4. **Deployen Sie neu:**
   - Nach dem Speichern müssen Sie das Projekt neu deployen
   - Preview reicht nicht aus

5. **Testen Sie:**
   - Öffnen Sie `/verify-push-setup`
   - Alle Checks sollten grün sein

### Option 2: Online Tool verwenden

1. Besuchen Sie: https://www.npmjs.com/package/web-push
2. Installieren Sie web-push global: `npm install web-push -g`
3. Führen Sie aus: `web-push generate-vapid-keys`
4. Kopieren Sie die Keys wie in Option 1 beschrieben

## Wichtige Hinweise

### Key-Format:
- **Public Key:** 88 Zeichen, Base64url-encoded
  - Beispiel: `BNp8pX...` (beginnt mit 'B')
  - Dekodiert: 65 Bytes (uncompressed P-256 public key)
  - Erstes Byte nach Dekodierung: `0x04`

- **Private Key:** 43 Zeichen, Base64url-encoded
  - Beispiel: `fT3bG2...`
  - Dekodiert: 32 Bytes

### Häufige Fehler:

❌ **Public Key zu kurz:** Stellen Sie sicher, dass der komplette 88-Zeichen Key kopiert wurde
❌ **Whitespace:** Kein Leerzeichen am Anfang oder Ende
❌ **Falscher Key:** Verwenden Sie NICHT den Private Key als Public Key
❌ **Alte Keys:** Generieren Sie neue Keys mit der aktuellen web-push Version

## Validierung

Nach dem Setup sollten folgende Checks in `/verify-push-setup` grün sein:

✅ Server VAPID Keys configured  
✅ Public key length: 88 characters  
✅ Client can fetch config  
✅ Key converts to 65 bytes (P-256)  
✅ Key starts with 0x04 (uncompressed)

## Support

Wenn weiterhin Probleme auftreten:
1. Öffnen Sie die Browser Console (F12)
2. Versuchen Sie, Push-Benachrichtigungen zu aktivieren
3. Schauen Sie nach Logs die mit `[v0]` beginnen
4. Die Logs zeigen genau, wo der Fehler auftritt
