import React from "react"
import { sql } from "@/lib/db"
import type { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c4a6e"
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const restaurants = await sql`
      SELECT name
      FROM restaurants
      WHERE slug = ${decodedSlug}
      LIMIT 1
    `

    const restaurant = restaurants[0]

    if (!restaurant) {
      return {
        title: "Admin Dashboard",
        description: "Restaurant Admin Dashboard",
      }
    }

    return {
      title: `${restaurant.name} - Admin`,
      description: `Admin Dashboard für ${restaurant.name}`,
      manifest: `/${slug}/admin/manifest.json`,
      appleWebApp: {
        capable: true,
        title: `${restaurant.name} Admin`,
        statusBarStyle: "default",
      }
    }
  } catch (error) {
    console.error("[v0] Error generating admin metadata:", error)
    return {
      title: "Admin Dashboard",
      description: "Restaurant Admin Dashboard",
    }
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
