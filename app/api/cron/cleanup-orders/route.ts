import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await sql`
      DELETE FROM orders 
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.length} old orders`,
    })
  } catch (error) {
    console.error("Error cleaning up orders:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
