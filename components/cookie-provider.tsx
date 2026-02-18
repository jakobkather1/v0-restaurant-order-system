"use client"

import React from "react"

import { useState, useCallback } from "react"
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
  const [showBanner, setShowBanner] = useState(false)

  const openCookieSettings = useCallback(() => {
    // Clear consent cookie to show banner again
    document.cookie = "cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    setShowBanner(true)
    window.location.reload()
  }, [])

  if (!settings || !settings.is_active) {
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
