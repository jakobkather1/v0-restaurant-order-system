"use client"

import dynamic from "next/dynamic"
import type React from "react"

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

interface ClientCookieWrapperProps {
  settings: CookieSettings | null
  categories: CookieCategory[]
  children: React.ReactNode
}

// Dynamic import in a client component - this is safe
const CookieProvider = dynamic(
  () => import("./cookie-provider").then((mod) => ({ default: mod.CookieProvider })),
  { ssr: false }
)

export function ClientCookieWrapper({ settings, categories, children }: ClientCookieWrapperProps) {
  return (
    <>
      {children}
      <CookieProvider settings={settings} categories={categories}>
        <></>
      </CookieProvider>
    </>
  )
}
