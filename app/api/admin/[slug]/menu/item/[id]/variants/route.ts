import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Helper function to detect transient errors
function isTransientError(error: unknown): boolean {
  const message = (error as Error)?.message || ""
  return (
    message.includes("Too Many") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("timeout") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("network")
  )
}

// Retry helper for database calls
async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = 500 * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      break
    }
  }

  console.error("[v0] Failed after retries:", lastError)
  return fallback
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const itemId = parseInt(params.id)

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const variants = await withRetry(
      async () => {
        const result = await sql`
          SELECT id, name, price_modifier, sort_order
          FROM item_variants
          WHERE menu_item_id = ${itemId}
          ORDER BY sort_order ASC
        `
        // Ensure we return an array of rows, not the full result object
        return Array.isArray(result) ? result : []
      },
      []
    )

    return NextResponse.json(variants)
  } catch (error) {
    console.error("[v0] Error in variants endpoint:", error)
    // Return empty array on any error to prevent breaking the UI
    return NextResponse.json([])
  }
}
