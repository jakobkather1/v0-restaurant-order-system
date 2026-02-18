"use client"

import type { Restaurant } from "@/lib/types"
import { MapPin, Phone, Mail, Clock, FileText, Shield, LogIn } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface FooterProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
}

const DAYS = [
  { key: "mon", label: "Montag", short: "Mo" },
  { key: "tue", label: "Dienstag", short: "Di" },
  { key: "wed", label: "Mittwoch", short: "Mi" },
  { key: "thu", label: "Donnerstag", short: "Do" },
  { key: "fri", label: "Freitag", short: "Fr" },
  { key: "sat", label: "Samstag", short: "Sa" },
  { key: "sun", label: "Sonntag", short: "So" },
]

function getCurrentDayIndex(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function isCurrentlyOpen(hours: Record<string, { open: string; close: string }>): boolean {
  const now = new Date()
  const currentDayKey = DAYS[getCurrentDayIndex()].key
  const dayHours = hours[currentDayKey]

  if (!dayHours?.open || !dayHours?.close) return false

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [openHour, openMin] = dayHours.open.split(":").map(Number)
  const [closeHour, closeMin] = dayHours.close.split(":").map(Number)
  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime
  }

  return currentTime >= openTime && currentTime < closeTime
}

function groupOpeningHours(hours: Record<string, { open: string; close: string }>) {
  const groups: Array<{ days: string[]; dayKeys: string[]; hours: string }> = []
  let currentGroup: { days: string[]; dayKeys: string[]; hours: string } | null = null

  DAYS.forEach((day) => {
    const dayHours = hours[day.key]
    const hoursString = dayHours?.open && dayHours?.close ? `${dayHours.open} - ${dayHours.close}` : "Geschlossen"

    if (currentGroup && currentGroup.hours === hoursString) {
      currentGroup.days.push(day.short)
      currentGroup.dayKeys.push(day.key)
    } else {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = { days: [day.short], dayKeys: [day.key], hours: hoursString }
    }
  })

  if (currentGroup) groups.push(currentGroup)
  return groups
}

function formatDayRange(days: string[]): string {
  if (days.length === 1) return days[0]
  if (days.length === 2) return `${days[0]}, ${days[1]}`
  return `${days[0]} - ${days[days.length - 1]}`
}

export function Footer({ restaurant, isCustomDomain = false }: FooterProps) {
  const hours = restaurant.opening_hours || {}
  const [isOpen, setIsOpen] = useState(false)
  const [currentDayIndex, setCurrentDayIndex] = useState(0)

  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isCurrentlyOpen(hours))
      setCurrentDayIndex(getCurrentDayIndex())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000)
    return () => clearInterval(interval)
  }, [hours])
  
  // Determine the correct links based on domain type
  const adminLink = isCustomDomain ? "/admin" : `/${restaurant.slug}/admin`
  const legalLink = isCustomDomain ? "/legal" : `/${restaurant.slug}/legal`
  
  // Platform Legal is always global, not restaurant-specific
  const platformLegalLink = "/platform-legal"

  const groupedHours = groupOpeningHours(hours)

  const textColor = restaurant.text_color || "#1f2937"

  return (
    <footer id="contact" className="border-t bg-muted/30 py-8 sm:py-10 md:py-12" style={{ color: textColor }}>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Contact */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Kontakt</h3>
            <div className="space-y-2 sm:space-y-3">
              {restaurant.address && (
                <div className="flex items-start gap-2 sm:gap-3 text-sm opacity-80">
                  <MapPin
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5"
                    style={{ color: restaurant.primary_color }}
                  />
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-2 sm:gap-3 text-sm opacity-80 hover:opacity-100 py-1"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: restaurant.primary_color }} />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="flex items-center gap-2 sm:gap-3 text-sm opacity-80 hover:opacity-100 py-1"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: restaurant.primary_color }} />
                  <span className="break-all">{restaurant.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Opening Hours */}
          <div className="sm:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: restaurant.primary_color }} />
                <span className="hidden xs:inline">Öffnungszeiten</span>
                <span className="xs:hidden">Zeiten</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                  isOpen
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {isOpen ? "Offen" : "Geschlossen"}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border bg-card/50 p-2 sm:p-3">
              {groupedHours.map((group, index) => {
                const isCurrentDayGroup = group.dayKeys.includes(DAYS[currentDayIndex].key)
                return (
                  <div key={index} className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                    <span className="opacity-70">{formatDayRange(group.days)}</span>
                    <span
                      className={`font-medium ${
                        isCurrentDayGroup && isOpen ? "text-green-600 dark:text-green-400" : "opacity-70"
                      }`}
                    >
                      {group.hours}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Rechtliches</h3>
            <div className="space-y-1 sm:space-y-2">
              <Link
                href={legalLink}
                className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 py-1.5 sm:py-1"
              >
                <FileText className="h-4 w-4" />
                Impressum & Datenschutz
              </Link>
              <Link
                href={platformLegalLink}
                className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 py-1.5 sm:py-1"
              >
                <Shield className="h-4 w-4" />
                Technischer Betrieb
              </Link>
              <Link
                href={adminLink}
                className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 py-1.5 sm:py-1 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t"
              >
                <LogIn className="h-4 w-4" />
                Restaurant Login
              </Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Info</h3>
            {restaurant.owner_name && (
              <p className="text-sm opacity-80">
                <strong>Inhaber:</strong> {restaurant.owner_name}
              </p>
            )}
          </div>
        </div>

        <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm opacity-70">
          <p>
            © {new Date().getFullYear()} {restaurant.name}. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  )
}
