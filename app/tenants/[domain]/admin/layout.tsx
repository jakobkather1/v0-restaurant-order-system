import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Restaurant Admin",
  description: "Verwaltungsbereich für dein Restaurant",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CustomDomainAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
