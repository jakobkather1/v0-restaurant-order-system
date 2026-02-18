import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema für die Menü-Struktur - alle Felder required für OpenAI compatibility
const MenuItemSchema = z.object({
  name: z.string().describe("Name des Gerichts"),
  description: z.string().describe("Beschreibung des Gerichts, oder leerer String falls nicht vorhanden"),
  prices: z.array(
    z.object({
      size: z.string().describe("Größe/Variante (z.B. Klein, Mittel, Groß, oder 'Standard' wenn keine Größen)"),
      price: z.number().describe("Preis in Euro"),
    })
  ).describe("Preise nach Größen"),
  toppingsAllowed: z.boolean().describe("Können Toppings hinzugefügt werden?"),
  allergens: z.string().describe("Komma-getrennte Liste von Allergenen (z.B. 'A,B,1,2') oder leerer String"),
})

const CategorySchema = z.object({
  name: z.string().describe("Name der Kategorie"),
  description: z.string().describe("Beschreibung der Kategorie, oder leerer String falls nicht vorhanden"),
  items: z.array(MenuItemSchema).describe("Gerichte in dieser Kategorie"),
})

const ToppingSchema = z.object({
  name: z.string().describe("Name des Toppings"),
  price: z.number().describe("Preis des Toppings in Euro"),
})

const MenuStructureSchema = z.object({
  categories: z.array(CategorySchema).describe("Alle Kategorien aus der Speisekarte"),
  toppings: z.array(ToppingSchema).describe("Alle verfügbaren Toppings/Extras"),
})

export async function POST(req: Request) {
  try {
    const { imageUrls } = await req.json()

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: "Keine Bilder angegeben" }, { status: 400 })
    }

    console.log(`[v0] Analyzing ${imageUrls.length} menu image(s) with GPT-4 Vision...`)

    // Build content array with all images
    const content: any[] = [
      {
        type: "text",
        text: `Analysiere diese Speisekarte(n) und extrahiere alle Informationen strukturiert. ${imageUrls.length > 1 ? "Es sind mehrere Bilder - kombiniere alle Informationen aus allen Bildern zu einer vollständigen Speisekarte." : ""}

Wichtige Hinweise für konsistente Formatierung:
- Extrahiere alle Kategorien (z.B. Pizza, Pasta, Salate, Getränke)
- **WICHTIG**: Innerhalb JEDER Kategorie müssen ALLE Gerichte die GLEICHEN Varianten/Größen haben
  - Wenn eine Kategorie "Pizza" heißt und das erste Gericht hat "Ø 26cm, Ø 32cm, Ø 40cm", dann müssen ALLE Pizzas genau diese 3 Größen haben
  - Wenn eine Größe auf der Speisekarte nicht explizit genannt ist, verwende den gleichen Preis wie die nächstkleinere Größe
  - Halte die Größennamen konsistent (z.B. immer "Ø 26cm" statt mal "26cm", mal "Klein")
- Für jedes Gericht: Name, Beschreibung (falls vorhanden), Preise nach Größen
- Wenn nur ein Preis vorhanden ist, setze die Größe auf "Standard"
- Extrahiere alle Toppings/Extras mit ihren Preisen
- Identifiziere Allergene (meist als Buchstaben oder Zahlen markiert, z.B. A, B, C, 1, 2, 3)
- Preise ohne € Zeichen als Zahl ausgeben (z.B. 8.50 statt "8,50€")
- Sei präzise und vollständig

Gib die Daten im strukturierten Format zurück.`,
      },
    ]

    // Add all images
    for (const imageUrl of imageUrls) {
      content.push({
        type: "image",
        image: imageUrl,
      })
    }

    const result = await generateObject({
      model: "openai/gpt-4o",
      schema: MenuStructureSchema,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    })

    console.log("[v0] Menu analysis complete:", {
      categories: result.object.categories.length,
      items: result.object.categories.reduce((sum, cat) => sum + cat.items.length, 0),
      toppings: result.object.toppings.length,
    })

    return NextResponse.json({
      success: true,
      data: result.object,
    })
  } catch (error) {
    console.error("[v0] Error scanning menu:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Analysieren der Speisekarte",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
