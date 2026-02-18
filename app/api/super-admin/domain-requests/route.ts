import { NextRequest, NextResponse } from "next/server"
import { getSuperAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

// GET: Get all domain requests
export async function GET() {
  try {
    const session = await getSuperAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await sql`
      SELECT 
        dr.*,
        r.name as restaurant_name,
        r.slug as restaurant_slug,
        r.domain as restaurant_domain
      FROM domain_requests dr
      JOIN restaurants r ON dr.restaurant_id = r.id
      ORDER BY 
        CASE dr.status 
          WHEN 'pending' THEN 1 
          WHEN 'completed' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        dr.created_at DESC
    `

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching domain requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update domain request status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSuperAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, status, notes, domain } = body

    if (!requestId || !status) {
      return NextResponse.json({ error: "Request ID and status required" }, { status: 400 })
    }

    if (!["pending", "completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the domain request first
    const domainRequest = await sql`
      SELECT * FROM domain_requests WHERE id = ${requestId}
    `
    
    if (domainRequest.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Determine the domain to use (new domain if provided, otherwise keep existing)
    const newDomain = domain ? domain.toLowerCase().trim() : domainRequest[0].requested_domain
    const oldDomain = domainRequest[0].requested_domain

    // Update request status and domain
    const result = await sql`
      UPDATE domain_requests 
      SET 
        status = ${status},
        notes = ${notes || null},
        requested_domain = ${newDomain},
        updated_at = NOW()
      WHERE id = ${requestId}
      RETURNING *
    `

    // Sync domain with restaurant table based on status
    if (status === "completed") {
      // Set domain when completed
      await sql`
        UPDATE restaurants 
        SET domain = ${newDomain}
        WHERE id = ${result[0].restaurant_id}
      `
    } else if (status === "rejected") {
      // Clear domain when rejected
      await sql`
        UPDATE restaurants 
        SET domain = NULL
        WHERE id = ${result[0].restaurant_id}
        AND (domain = ${oldDomain} OR domain = ${newDomain})
      `
    } else if (status === "pending" && domainRequest[0].status === "completed") {
      // If changing from completed back to pending, clear the domain
      await sql`
        UPDATE restaurants 
        SET domain = NULL
        WHERE id = ${result[0].restaurant_id}
        AND (domain = ${oldDomain} OR domain = ${newDomain})
      `
    } else if (status === "pending" && domain && domain !== oldDomain) {
      // If domain changed while pending, clear old domain
      await sql`
        UPDATE restaurants 
        SET domain = NULL
        WHERE id = ${result[0].restaurant_id}
        AND domain = ${oldDomain}
      `
    }

    return NextResponse.json({ success: true, request: result[0] })
  } catch (error) {
    console.error("Error updating domain request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
