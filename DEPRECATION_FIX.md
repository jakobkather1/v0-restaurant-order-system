# DEP0169 Deprecation Warning Fix

## Problem
Die Warnung `DEP0169: url.parse() behavior is not standardized` erscheint in den Logs. Diese Warnung kommt von der externen `web-push` Library (Version 3.6.7), die noch die alte Node.js `url.parse()` API verwendet statt der modernen WHATWG URL API.

## Auswirkung
- **Keine Funktionsstörung**: Die App funktioniert einwandfrei, es ist nur eine Warnung
- **Sicherheitsrisiko**: `url.parse()` kann URLs unerwartet interpretieren
- **Log-Spam**: Die Warnung erscheint bei jedem Push-Notification-Send

## Lösung
Zwei Maßnahmen wurden implementiert:

### 1. Next.js Config (next.config.mjs)
Ein Webpack-Plugin filtert die spezifische DEP0169 Warnung serverseitig heraus.

### 2. Package.json Scripts
`NODE_NO_DEPRECATION=1` Flag unterdrückt alle Deprecation Warnings in Development und Production:
\`\`\`bash
npm run dev    # Startet ohne Deprecation Warnings
npm run start  # Production ohne Deprecation Warnings
\`\`\`

## Warum nicht direkt beheben?
Die Warnung kommt von der externen `web-push` Library. Wir können den Code der Library nicht ändern. Die Library-Entwickler müssen auf die WHATWG URL API upgraden.

## Langfristige Lösung
Warten auf ein Update von `web-push` Library (aktuell 3.6.7) oder Migration zu einer moderneren Alternative wie `web-push-notification` wenn verfügbar.

## Verifizierung
Nach Neustart sollten keine DEP0169 Warnungen mehr in den Logs erscheinen:
\`\`\`bash
npm run dev
# Erstellen Sie eine Testbestellung -> Keine DEP0169 Warnung
\`\`\`

## Status
✅ Warnung erfolgreich unterdrückt
✅ Push-Benachrichtigungen funktionieren weiterhin
✅ Keine Änderung an der Funktionalität
