import React from "react"
import type { Metadata, Viewport } from "next"
import { sql } from "@/lib/db"
import { ThemeWrapper } from "@/components/theme-wrapper"

export const dynamic = "force-dynamic"

interface SlugLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c4a6e"
}

export async function generateMetadata({ params }: SlugLayoutProps): Promise<Metadata> {
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
        title: "Restaurant",
        description: "Online bestellen"
      }
    }
    
    return {
      title: restaurant.name,
      description: `Online bestellen bei ${restaurant.name}`,
      manifest: `/${slug}/manifest.json`,
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: 'any' },
          { url: '/api/favicon', sizes: '32x32', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
      },
      appleWebApp: {
        capable: true,
        title: restaurant.name,
        statusBarStyle: "default"
      }
    }
  } catch (error) {
    console.error("[v0] Error generating metadata:", error)
    return {
      title: "Restaurant",
      description: "Online bestellen"
    }
  }
}

export default async function SlugLayout({ children, params }: SlugLayoutProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  
  // Fetch restaurant's primary color
  let primaryColor: string | null = null
  try {
    const result = await sql`
      SELECT primary_color
      FROM restaurants
      WHERE slug = ${slug}
      LIMIT 1
    `
    primaryColor = result[0]?.primary_color || null
  } catch (error) {
    console.error("[v0] Error fetching primary color:", error)
  }
  
  return (
    <ThemeWrapper primaryColor={primaryColor}>
      {children}
    </ThemeWrapper>
  )
}
