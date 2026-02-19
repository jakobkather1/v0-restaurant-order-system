"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Cookie, Settings, Shield, BarChart3, Target, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CookieCategory {
  id: string
  name: string
  slug: string
  description: string
  is_required: boolean
}

interface CookieSettings {
  banner_title: string
  banner_description: string
  accept_all_text: string
  reject_all_text: string
  settings_text: string
  save_settings_text: string
  privacy_policy_url: string | null
  banner_position: "bottom" | "top" | "center"
  banner_style: "bar" | "popup" | "floating"
  show_reject_all: boolean
  is_active: boolean
}

interface CookieConsent {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
  [key: string]: boolean
}

const CONSENT_COOKIE_NAME = "cookie_consent"
const CONSENT_VERSION = "1"

/**
 * Safe JSON parser with fallback - prevents crashes from corrupted cookies
 */
function safeJSONParse<T>(value: string | null | undefined, fallback: T): T {
  if (value === null || value === undefined || value.trim() === "") {
    return fallback
  }
  try {
    return JSON.parse(value)
  } catch {
    // Self-healing: delete the corrupted cookie
    if (typeof document !== "undefined") {
      document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
    return fallback
  }
}

/**
 * Get the raw cookie value safely - handles = characters in encoded values
 */
function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  
  const cookies = document.cookie.split("; ")
  for (const cookie of cookies) {
    const eqIndex = cookie.indexOf("=")
    if (eqIndex === -1) continue
    
    const cookieName = cookie.substring(0, eqIndex)
    if (cookieName === name) {
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

// Get consent from cookie
function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null
  
  const cookieValue = getCookieValue(CONSENT_COOKIE_NAME)
  if (!cookieValue) return null
  
  const parsed = safeJSONParse<{ version?: string; consent?: CookieConsent } | null>(cookieValue, null)
  if (!parsed) return null
  if (parsed.version !== CONSENT_VERSION) return null
  return parsed.consent || null
}

// Set consent cookie - ensures valid JSON is written
function setConsentCookie(consent: CookieConsent) {
  // Ensure consent object is valid before stringifying
  const validConsent: CookieConsent = {
    necessary: consent.necessary ?? true,
    functional: consent.functional ?? false,
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    ...consent
  }
  
  const value = JSON.stringify({ version: CONSENT_VERSION, consent: validConsent, timestamp: Date.now() })
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1) // 1 year
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

// Category icon mapping
function getCategoryIcon(slug: string) {
  switch (slug) {
    case "necessary":
      return <Shield className="h-4 w-4 text-green-600" />
    case "functional":
      return <Settings className="h-4 w-4 text-blue-600" />
    case "analytics":
      return <BarChart3 className="h-4 w-4 text-purple-600" />
    case "marketing":
      return <Target className="h-4 w-4 text-orange-600" />
    default:
      return <Cookie className="h-4 w-4 text-amber-600" />
  }
}

interface CookieBannerProps {
  settings: CookieSettings
  categories: CookieCategory[]
}

export function CookieBanner({ settings, categories }: CookieBannerProps) {
  // IMPORTANT: Start with false to prevent hydration mismatch (server renders without banner)
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>(() => {
    const initial: CookieConsent = { necessary: true, functional: false, analytics: false, marketing: false }
    categories.forEach((cat) => {
      initial[cat.slug] = cat.is_required
    })
    return initial
  })

  // Check localStorage on mount (client-only) - ONLY ONCE
  useEffect(() => {
    if (!settings.is_active) {
      return
    }
    
    // Check localStorage for existing consent
    const storedConsent = localStorage.getItem('cookie-consent')
    
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent)
        console.log("[v0] Cookie banner: Found stored consent, hiding banner")
        setConsent(parsed)
        setIsVisible(false) // Keep banner hidden
      } catch (error) {
        console.error("[v0] Cookie banner: Failed to parse stored consent", error)
        localStorage.removeItem('cookie-consent')
        setIsVisible(true) // Show banner if consent is corrupted
      }
    } else {
      // No stored consent - show banner
      console.log("[v0] Cookie banner: No stored consent found, showing banner")
      setIsVisible(true)
    }
  }, [settings.is_active])

  // Handle accept all
  const handleAcceptAll = useCallback(async () => {
    const allAccepted: CookieConsent = { necessary: true, functional: true, analytics: true, marketing: true }
    categories.forEach((cat) => {
      allAccepted[cat.slug] = true
    })
    
    // Save to localStorage for persistence
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted))
    console.log("[v0] Cookie banner: Saved 'accept all' to localStorage")
    
    // Also save to server for audit logging (non-blocking)
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        preferences: allAccepted,
        userAgent: navigator.userAgent 
      }),
    }).catch(error => console.error("[v0] Failed to save consent to server:", error))
    
    setConsent(allAccepted)
    setIsVisible(false)
    
    // Dispatch event for other scripts to react
    window.dispatchEvent(new CustomEvent("cookieConsent", { detail: allAccepted }))
  }, [categories])

  // Handle reject all
  const handleRejectAll = useCallback(async () => {
    const onlyRequired: CookieConsent = { necessary: true, functional: false, analytics: false, marketing: false }
    categories.forEach((cat) => {
      onlyRequired[cat.slug] = cat.is_required
    })
    
    // Save to localStorage for persistence
    localStorage.setItem('cookie-consent', JSON.stringify(onlyRequired))
    console.log("[v0] Cookie banner: Saved 'reject all' to localStorage")
    
    // Also save to server for audit logging (non-blocking)
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        preferences: onlyRequired,
        userAgent: navigator.userAgent 
      }),
    }).catch(error => console.error("[v0] Failed to save consent to server:", error))
    
    setConsent(onlyRequired)
    setIsVisible(false)
    
    window.dispatchEvent(new CustomEvent("cookieConsent", { detail: onlyRequired }))
  }, [categories])

  // Handle save settings
  const handleSaveSettings = useCallback(async () => {
    // Save to localStorage for persistence
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    console.log("[v0] Cookie banner: Saved custom settings to localStorage")
    
    // Also save to server for audit logging (non-blocking)
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        preferences: consent,
        userAgent: navigator.userAgent 
      }),
    }).catch(error => console.error("[v0] Failed to save consent to server:", error))
    
    setIsVisible(false)
    
    window.dispatchEvent(new CustomEvent("cookieConsent", { detail: consent }))
  }, [consent])

  // Toggle category
  const toggleCategory = (slug: string) => {
    const category = categories.find((c) => c.slug === slug)
    if (category?.is_required) return // Can't toggle required categories
    
    setConsent((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }))
  }

  // Don't render if settings are inactive or banner should be hidden
  if (!settings.is_active || !isVisible) return null

  // Position classes
  const positionClasses = {
    bottom: "bottom-0 left-0 right-0",
    top: "top-0 left-0 right-0",
    center: "inset-0 flex items-center justify-center",
  }

  // Style classes
  const styleClasses = {
    bar: "w-full",
    popup: "max-w-lg mx-auto",
    floating: "max-w-sm m-4 ml-auto",
  }

  return (
    <>
      {/* Backdrop for center position */}
      {settings.banner_position === "center" && (
        <div className="fixed inset-0 bg-black/50 z-[9998]" />
      )}

      <div className={cn("fixed z-[9999] p-4", positionClasses[settings.banner_position])}>
        <div
          className={cn(
            "bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden",
            styleClasses[settings.banner_style]
          )}
        >
          {/* Main Banner */}
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <Cookie className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{settings.banner_title}</h3>
                <p className="text-sm text-gray-600 mb-4">{settings.banner_description}</p>

                {/* Settings Accordion */}
                {showSettings && (
                  <div className="mb-4 space-y-3 border-t pt-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category.slug)}
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {category.name}
                              {category.is_required && (
                                <span className="ml-2 text-xs text-gray-500">(Erforderlich)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{category.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={consent[category.slug] ?? false}
                          onCheckedChange={() => toggleCategory(category.slug)}
                          disabled={category.is_required}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  {/* Primary action - Prominent */}
                  <Button onClick={handleAcceptAll} size="sm" className="sm:flex-1">
                    {settings.accept_all_text}
                  </Button>
                  
                  {/* Settings toggle - Secondary */}
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="outline"
                    size="sm"
                    className="gap-1 sm:flex-1"
                  >
                    {showSettings ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Schließen
                      </>
                    ) : (
                      <>
                        {settings.settings_text}
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  {/* Save settings when accordion is open */}
                  {showSettings && (
                    <Button onClick={handleSaveSettings} size="sm" className="sm:flex-1">
                      {settings.save_settings_text}
                    </Button>
                  )}
                </div>
                
                {/* Reject button - Subtle and separated */}
                {settings.show_reject_all && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={handleRejectAll}
                      className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                    >
                      {settings.reject_all_text}
                    </button>
                  </div>
                )}

                {/* Privacy Policy Link */}
                {settings.privacy_policy_url && (
                  <p className="mt-3 text-xs text-gray-500">
                    Mehr Informationen in unserer{" "}
                    <a
                      href={settings.privacy_policy_url}
                      className="underline hover:text-gray-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Datenschutzerklärung
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Small button to re-open cookie settings
export function CookieSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 z-[9997] p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      aria-label="Cookie-Einstellungen öffnen"
    >
      <Cookie className="h-5 w-5 text-amber-600" />
    </button>
  )
}

// Hook to check consent
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null)

  useEffect(() => {
    setConsent(getStoredConsent())

    const handleConsentChange = (e: CustomEvent<CookieConsent>) => {
      setConsent(e.detail)
    }

    window.addEventListener("cookieConsent", handleConsentChange as EventListener)
    return () => {
      window.removeEventListener("cookieConsent", handleConsentChange as EventListener)
    }
  }, [])

  return consent
}

// Utility to check if a specific category is consented
export function hasConsent(category: string): boolean {
  const consent = getStoredConsent()
  return consent?.[category] ?? false
}
