"use client"

import { useEffect, useState } from "react"

interface CookieConsent {
  necessary: boolean
  functional: boolean
  analytics: boolean
  [key: string]: boolean
}

const CONSENT_COOKIE_NAME = "cookie_consent"
const CONSENT_VERSION = "1"

/**
 * Safe JSON parser with fallback and self-healing
 * - Returns fallback if value is null, undefined, or empty
 * - Catches parse errors and deletes corrupted cookies
 */
function safeJSONParse<T>(value: string | null | undefined, fallback: T): T {
  // Guard against null, undefined, or empty string
  if (value === null || value === undefined || value.trim() === "") {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    // Self-healing: delete the corrupted cookie
    if (typeof document !== "undefined") {
      document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
    return fallback
  }
}

/**
 * Get the raw cookie value safely
 * Handles edge cases with = characters in encoded values
 */
function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  
  const cookies = document.cookie.split("; ")
  for (const cookie of cookies) {
    const eqIndex = cookie.indexOf("=")
    if (eqIndex === -1) continue
    
    const cookieName = cookie.substring(0, eqIndex)
    if (cookieName === name) {
      // Get everything after the first = to handle encoded = in value
      const rawValue = cookie.substring(eqIndex + 1)
      if (!rawValue) return null
      
      try {
        return decodeURIComponent(rawValue)
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Hook to check if user has consented to a specific cookie category
 * Usage: const hasAnalyticsConsent = useCookieConsent('analytics')
 */
export function useCookieConsent(category?: string): {
  consent: CookieConsent | null
  hasConsent: (cat: string) => boolean
  isLoaded: boolean
} {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Validate consent with server
    fetch("/api/consent")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasConsent && data.consent) {
          setConsent(data.consent)
        } else {
          // Clear invalid/expired consent
          setConsent(null)
        }
        setIsLoaded(true)
      })
      .catch((error) => {
        console.error("[v0] Error validating consent:", error)
        // Fallback to client-side check
        const cookieValue = getCookieValue(CONSENT_COOKIE_NAME)
        
        if (cookieValue) {
          const parsed = safeJSONParse<{ version?: string; preferences?: CookieConsent } | CookieConsent | null>(
            cookieValue,
            null
          )
          
          if (parsed) {
            // Check if this is the new format with version and preferences
            if ("version" in parsed && parsed.version === CONSENT_VERSION && parsed.preferences) {
              setConsent(parsed.preferences)
            } else if (typeof parsed === "object" && "necessary" in parsed) {
              // Fallback for old format
              setConsent(parsed as CookieConsent)
            }
          }
        }
        setIsLoaded(true)
      })
  }, [])

  const hasConsent = (cat: string): boolean => {
    return consent ? consent[cat] === true : false
  }

  return {
    consent,
    hasConsent,
    isLoaded,
  }
}

/**
 * Check if analytics is enabled globally
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false

  const cookieValue = getCookieValue(CONSENT_COOKIE_NAME)
  if (!cookieValue) return false

  const parsed = safeJSONParse<{ version?: string; consent?: CookieConsent } | CookieConsent | null>(
    cookieValue,
    null
  )
  
  if (!parsed) return false
  
  // Check new format with version and consent properties
  if ("version" in parsed && parsed.version === CONSENT_VERSION && parsed.consent) {
    return parsed.consent.analytics === true
  }
  
  // Fallback for old format
  if (typeof parsed === "object" && "analytics" in parsed) {
    return (parsed as CookieConsent).analytics === true
  }
  
  return false
}
