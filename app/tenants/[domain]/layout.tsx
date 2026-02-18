import React from "react"
import type { Metadata, Viewport } from "next"
import { sql } from "@/lib/db"
import { ThemeWrapper } from "@/components/theme-wrapper"

export const dynamic = "force-dynamic"

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ domain: string }>
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c4a6e"
}

export async function generateMetadata({ params }: TenantLayoutProps): Promise<Metadata> {
  const { domain } = await params
  
  try {
    // Try to find restaurant - check both with and without www prefix
    const domainVariations = [
      domain,
      `www.${domain}`,
      domain.replace(/^www\./, '')
    ]
    
    const restaurants = await sql`
      SELECT name
      FROM restaurants
      WHERE custom_domain = ANY(${domainVariations})
      LIMIT 1
    `
    
    const restaurant = restaurants[0]
    
    if (!restaurant) {
      return {
        title: "Restaurant",
        description: "Online bestellen",
        icons: {
          icon: '/api/favicon',
          shortcut: '/api/favicon',
          apple: '/api/favicon',
        }
      }
    }
    
    return {
      title: restaurant.name,
      description: `Online bestellen bei ${restaurant.name}`,
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
      description: "Online bestellen",
      icons: {
        icon: '/api/favicon',
        shortcut: '/api/favicon',
        apple: '/api/favicon',
      }
    }
  }
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { domain } = await params
  
  // Try to find restaurant - check both with and without www prefix
  const domainVariations = [
    domain,
    `www.${domain}`,
    domain.replace(/^www\./, '')
  ]
  
  // Fetch restaurant's primary color
  let primaryColor: string | null = null
  try {
    const result = await sql`
      SELECT primary_color
      FROM restaurants
      WHERE custom_domain = ANY(${domainVariations})
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
