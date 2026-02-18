"use client"

import { useEffect, useState } from "react"
import { useCookieConsent } from "@/hooks/use-cookie-consent"
import { Analytics } from "@vercel/analytics/next"

/**
 * Analytics Manager - Loads Vercel Analytics only when user has consented to analytics cookies
 * This component checks cookie consent before initializing tracking and dynamically updates
 * when consent changes without requiring a page reload
 */
export function AnalyticsManager() {
  const { hasConsent, isLoaded } = useCookieConsent()
  const [shouldRenderAnalytics, setShouldRenderAnalytics] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const analyticsConsent = hasConsent("analytics")
    
    // Only initialize analytics if user has consented
    if (analyticsConsent) {
      console.log("[v0] Analytics enabled - user has consented")
      setShouldRenderAnalytics(true)
    } else {
      console.log("[v0] Analytics disabled - user has not consented")
      setShouldRenderAnalytics(false)
    }
  }, [isLoaded, hasConsent])

  // Listen for consent changes from cookie banner
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      const consent = event.detail
      if (consent?.analytics) {
        console.log("[v0] Analytics consent granted - activating analytics")
        setShouldRenderAnalytics(true)
      } else {
        console.log("[v0] Analytics consent revoked - deactivating analytics")
        setShouldRenderAnalytics(false)
      }
    }

    window.addEventListener("cookieConsent", handleConsentChange as EventListener)
    
    return () => {
      window.removeEventListener("cookieConsent", handleConsentChange as EventListener)
    }
  }, [])

  // Don't render Analytics component if consent not given
  if (!shouldRenderAnalytics) {
    return null
  }

  // Only load Analytics when analytics consent is given
  return <Analytics />
}
