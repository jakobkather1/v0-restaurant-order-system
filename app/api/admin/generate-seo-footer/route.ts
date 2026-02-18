import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { restaurantName, cuisine, city, address, phone, categories, deliveryZones } = await req.json()

    // Extract REAL delivery areas from delivery zones
    const realDeliveryAreas: string[] = []
    if (deliveryZones && Array.isArray(deliveryZones)) {
      deliveryZones.forEach((zone: any) => {
        if (zone.name) {
          realDeliveryAreas.push(zone.name)
        }
      })
    }

    // Extract REAL categories from menu
    const realCategories: string[] = []
    if (categories && Array.isArray(categories)) {
      categories.forEach((cat: string) => {
        if (cat && cat.trim()) {
          realCategories.push(cat.trim())
        }
      })
    }

    console.log("[v0] Using real restaurant data:", {
      deliveryAreas: realDeliveryAreas,
      categories: realCategories,
    })

    // Generate ONLY the description using AI
    const prompt = `Erstelle eine SEO-optimierte Beschreibung (100-150 Wörter) für das Restaurant "${restaurantName}".

Restaurant-Details:
- Küche: ${cuisine || "verschiedene Gerichte"}
- Stadt: ${city || ""}
- Adresse: ${address || ""}
- Verfügbare Menükategorien: ${realCategories.join(", ") || "Verschiedene Gerichte"}
- Liefergebiete: ${realDeliveryAreas.join(", ") || city || ""}

Die Beschreibung soll:
- Natürlich und einladend klingen
- Die ${cuisine || ""}-Küche hervorheben
- Die Liefergebiete erwähnen (${realDeliveryAreas.join(", ") || city})
- Keywords für SEO enthalten
- Zum Bestellen motivieren

Antworte NUR mit dem Beschreibungstext, ohne JSON oder zusätzliche Formatierung.`

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxOutputTokens: 300,
    })

    // Return the AI-generated description with REAL data from restaurant settings
    return NextResponse.json({
      description: result.text.trim(),
      deliveryAreas: realDeliveryAreas,
      popularCategories: realCategories,
    })
  } catch (error) {
    console.error("[v0] Error generating SEO footer:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren des SEO Footers" },
      { status: 500 }
    )
  }
}
