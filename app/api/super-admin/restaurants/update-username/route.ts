import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, username } = body

    if (!restaurantId || !username) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID und Benutzername sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges Benutzername-Format' },
        { status: 400 }
      )
    }

    // Check if username already exists for another restaurant
    const checkResult = await sql`
      SELECT id FROM restaurants 
      WHERE admin_username = ${username} AND id != ${restaurantId}
    `

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Benutzername bereits vergeben' },
        { status: 409 }
      )
    }

    // Update the username
    await sql`
      UPDATE restaurants 
      SET admin_username = ${username}
      WHERE id = ${restaurantId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating username:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
