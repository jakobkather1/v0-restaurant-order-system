import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { restaurantName, cuisine, city, specialties, deliveryAreas } = await req.json()

    const prompt = `Generiere eine SEO-optimierte Beschreibung für ein Restaurant mit folgenden Informationen:

Restaurant Name: ${restaurantName}
Küche: ${cuisine || "verschiedene Gerichte"}
Stadt: ${city || ""}
Spezialitäten: ${specialties || "vielfältige Speisen"}
Liefergebiete: ${deliveryAreas?.join(", ") || ""}

Die Beschreibung sollte:
- 100-150 Wörter lang sein
- Natürlich und ansprechend klingen
- Relevante Keywords enthalten (Restaurant, Lieferservice, Stadt, Küche)
- Die Vorteile des Restaurants hervorheben
- Zum Bestellen einladen
- Auf Deutsch geschrieben sein

Schreibe nur die Beschreibung ohne zusätzliche Erklärungen oder Formatierung.`

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxOutputTokens: 300,
    })

    return NextResponse.json({ description: result.text })
  } catch (error) {
    console.error("[v0] Error generating SEO description:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren der Beschreibung" },
      { status: 500 }
    )
  }
}
