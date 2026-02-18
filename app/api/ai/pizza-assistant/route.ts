import { type NextRequest, NextResponse } from "next/server"

// Mistral Agent API endpoint
const MISTRAL_AGENT_API_URL = "https://api.mistral.ai/v1/agents/completions"

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

interface ItemVariant {
  name: string
  price_modifier: number
  price?: number
}

interface MenuItem {
  id: number
  name: string
  description: string | null
  base_price: number
  category_name?: string
  category_id?: number
  allergens?: string[]
  dietary_info?: string[]
  variants?: ItemVariant[]
}

interface Category {
  id: number
  name: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      menuItems,
      categories,
      toppings,
      hungerLevel,
      mood,
      personCount,
      conversationHistory = [],
      restaurantName,
    } = await request.json()

    const apiKey = process.env.MISTRAL_API_KEY
    const agentId = process.env.MISTRAL_AGENT_ID

    if (!apiKey) {
      return NextResponse.json({ error: "Mistral API key not configured" }, { status: 500 })
    }

    if (!agentId) {
      return NextResponse.json({ error: "Mistral Agent ID not configured" }, { status: 500 })
    }

    const menuByCategory: Record<string, string[]> = {}
    const allVariantNames: Set<string> = new Set()

    console.log(
      "[v0] Sample menu item with variants:",
      JSON.stringify(
        menuItems.slice(0, 2).map((item: MenuItem) => ({
          name: item.name,
          base_price: item.base_price,
          variants: item.variants,
        })),
        null,
        2,
      ),
    )

    menuItems.forEach((item: MenuItem) => {
      const categoryName = item.category_name || "Sonstiges"
      if (!menuByCategory[categoryName]) {
        menuByCategory[categoryName] = []
      }

      const basePrice = Number.parseFloat(String(item.base_price)) || 0

      if (item.variants && item.variants.length > 0) {
        // Item has variants - show each variant with FULL PRICE
        const variantPrices = item.variants.map((v: ItemVariant) => {
          const modifier = Number.parseFloat(String(v.price_modifier)) || 0
          // Calculate full price: base_price + price_modifier
          const fullPrice = basePrice + modifier
          // Store the exact variant name
          allVariantNames.add(v.name)
          return `${v.name}: ${fullPrice.toFixed(2)}€`
        })

        let itemInfo = `  - ${item.name} (ID: ${item.id})`
        if (item.description) {
          itemInfo += `: ${item.description}`
        }
        itemInfo += ` | VARIANTEN [${variantPrices.join(", ")}]`

        if (item.allergens && item.allergens.length > 0) {
          itemInfo += ` [Allergene: ${item.allergens.join(", ")}]`
        }

        menuByCategory[categoryName].push(itemInfo)
      } else {
        // No variants - show base price
        let itemInfo = `  - ${item.name} (ID: ${item.id}, ${basePrice.toFixed(2)}€)`
        if (item.description) {
          itemInfo += `: ${item.description}`
        }
        if (item.allergens && item.allergens.length > 0) {
          itemInfo += ` [Allergene: ${item.allergens.join(", ")}]`
        }
        menuByCategory[categoryName].push(itemInfo)
      }
    })

    // Build formatted menu string
    const menuContext = Object.entries(menuByCategory)
      .map(([category, items]) => `${category}:\n${items.join("\n")}`)
      .join("\n\n")

    const categoryList = categories.map((c: Category) => c.name).join(", ")
    const knownVariantNames =
      allVariantNames.size > 0 ? Array.from(allVariantNames).join(", ") : "keine Varianten konfiguriert"

    const toppingList = toppings
      .map((t: { name: string; price: number }) => {
        const toppingPrice = Number.parseFloat(String(t.price)) || 0
        return `${t.name} (+${toppingPrice.toFixed(2)}€)`
      })
      .join(", ")

    const contextMessage = `RESTAURANT: ${restaurantName}

KUNDENINFORMATIONEN:
- Hunger-Level: ${hungerLevel || 3}/5 (1=kleiner Snack, 3=normal, 5=Bärenhunger)
- Stimmung: ${mood === "happy" ? "abenteuerlustig" : mood === "comfort" ? "klassisch" : "neutral"}
- Personenanzahl: ${personCount || 1} Person(en)

VERFÜGBARE VARIANTEN-NAMEN: ${knownVariantNames}

AKTUELLE SPEISEKARTE:
${menuContext}

KATEGORIEN: ${categoryList}

EXTRA TOPPINGS: ${toppingList || "Keine verfügbar"}

KUNDENANFRAGE: ${message}

Antworte im JSON-Format:
{
  "message": "Freundliche Empfehlung",
  "recommendation": {
    "itemId": 123,
    "itemName": "Name",
    "size": "Varianten-Name oder null",
    "quantity": 1,
    "reason": "Begründung"
  },
  "upsell": { ... } oder null,
  "secondUpsell": { ... } oder null,
  "additionalItems": [],
  "addToCart": false
}`

    // Build conversation messages for the agent
    const messages: { role: string; content: string }[] = [
      ...conversationHistory.slice(-10).map((m: Message) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: contextMessage },
    ]

    const response = await fetch(MISTRAL_AGENT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Mistral Agent API error:", error)
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 })
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    // Parse JSON response
    let parsedResponse
    try {
      // Try to extract JSON from the response
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = JSON.parse(assistantMessage)
      }
    } catch {
      parsedResponse = {
        message: assistantMessage,
        recommendation: null,
        upsell: null,
        secondUpsell: null,
        additionalItems: [],
        addToCart: false,
      }
    }

    return NextResponse.json({
      success: true,
      ...parsedResponse,
    })
  } catch (error) {
    console.error("Gastro assistant error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
