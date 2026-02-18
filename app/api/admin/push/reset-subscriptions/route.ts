import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Delete all push subscriptions
    const result = await sql`
      DELETE FROM push_subscriptions
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      deleted: result.rowCount || 0,
      message: `${result.rowCount || 0} subscriptions deleted successfully`
    })
  } catch (error) {
    console.error("Reset subscriptions error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
