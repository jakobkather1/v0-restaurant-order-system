import { NextResponse } from "next/server"
import { getPlatformSetting } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const faviconDataUrl = await getPlatformSetting("platform_favicon")

    if (!faviconDataUrl) {
      // Return default favicon
      return NextResponse.redirect(new URL("/icon.svg", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
    }

    // Parse data URL
    const matches = faviconDataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.redirect(new URL("/icon.svg", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
    }

    const [, mimeType, base64Data] = matches
    const buffer = Buffer.from(base64Data, "base64")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error serving favicon:", error)
    return NextResponse.redirect(new URL("/icon.svg", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"))
  }
}
