import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await sql`
      SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_favicon' LIMIT 1
    `

    if (result.rows.length === 0 || !result.rows[0].setting_value) {
      return new NextResponse(null, { status: 404 })
    }

    const faviconUrl = result.rows[0].setting_value

    const response = await fetch(faviconUrl)
    if (!response.ok) {
      return new NextResponse(null, { status: 404 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error loading apple-touch-icon:', error)
    return new NextResponse(null, { status: 500 })
  }
}
