"use client"

import React from "react"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CookieBanner, CookieSettingsButton } from "./cookie-banner"

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

interface CookieProviderProps {
  settings: CookieSettings | null
  categories: CookieCategory[]
  children: React.ReactNode
}

export function CookieProvider({ settings, categories, children }: CookieProviderProps) {
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)

  const openCookieSettings = useCallback(() => {
    // Clear consent from localStorage to show banner again
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie-consent')
    }
    setShowBanner(true)
    window.location.reload()
  }, [])

  // Hide banner on admin routes
  const isAdminRoute = pathname?.includes('/admin') || pathname?.includes('/super-admin')
  
  if (!settings || !settings.is_active || isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <CookieBanner settings={settings} categories={categories} />
      <CookieSettingsButton onClick={openCookieSettings} />
    </>
  )
}
