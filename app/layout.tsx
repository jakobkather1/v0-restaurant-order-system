import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"
import { AnalyticsManager } from "@/components/analytics-manager"
import { CookieProvider } from "@/components/cookie-provider"
import { getCookieSettings, getCookieCategories } from "@/lib/cookie-settings"
import "./globals.css"

const geistSans = Geist({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

// No static metadata in root layout - all metadata is generated dynamically in page.tsx

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  minimumScale: 1.0,
  userScalable: false,
  themeColor: "#0c4a6e",
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Load cookie settings from database
  const settings = await getCookieSettings()
  const categories = await getCookieCategories()

  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://c-2.eu-central-1.aws.neon.tech" />
      </head>
      <body className={`font-sans antialiased w-screen max-w-full`}>
        <ServiceWorkerProvider />
        <CookieProvider settings={settings} categories={categories}>
          <AnalyticsManager />
          {children}
        </CookieProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app',
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: 'any' },
          { url: '/api/favicon', sizes: '32x32', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
      }
    };
