import { NextRequest, NextResponse } from "next/server"
import { getRestaurantAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

// POST: Create a new domain request
export async function POST(request: NextRequest) {
  try {
    const session = await getRestaurantAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Validate domain format (allow umlauts and international characters)
    const domainRegex = /^([a-z0-9äöüß]+(-[a-z0-9äöüß]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    // Check if domain already exists for any restaurant
    const existingDomain = await sql`
      SELECT id FROM restaurants WHERE domain = ${domain}
    `
    if (existingDomain.length > 0) {
      return NextResponse.json({ error: "Domain already in use" }, { status: 409 })
    }

    // Check if there's already a pending request for this domain
    const existingRequest = await sql`
      SELECT id FROM domain_requests 
      WHERE requested_domain = ${domain} AND status = 'pending'
    `
    if (existingRequest.length > 0) {
      return NextResponse.json({ error: "Domain request already pending" }, { status: 409 })
    }

    // Create domain request
    const result = await sql`
      INSERT INTO domain_requests (restaurant_id, requested_domain, status)
      VALUES (${session.restaurantId}, ${domain}, 'pending')
      RETURNING *
    `

    return NextResponse.json({ success: true, request: result[0] })
  } catch (error) {
    console.error("Error creating domain request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: Get domain request for current restaurant
export async function GET() {
  try {
    const session = await getRestaurantAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await sql`
      SELECT * FROM domain_requests 
      WHERE restaurant_id = ${session.restaurantId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    return NextResponse.json({ request: requests[0] || null })
  } catch (error) {
    console.error("Error fetching domain request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Cancel/withdraw a pending domain request
export async function DELETE() {
  try {
    const session = await getRestaurantAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow deleting pending requests
    const result = await sql`
      DELETE FROM domain_requests 
      WHERE restaurant_id = ${session.restaurantId} 
      AND status = 'pending'
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "No pending request found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Domain request withdrawn" })
  } catch (error) {
    console.error("Error deleting domain request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
