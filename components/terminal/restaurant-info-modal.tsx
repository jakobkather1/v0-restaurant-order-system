"use client"

import type { Restaurant } from "@/lib/types"
import { MapPin, Phone, Mail, Clock, FileText, Shield, LogIn, Info } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RestaurantInfoModalProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
  variant?: "icon" | "button"
  textColor?: string
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

export function RestaurantInfoModal({ restaurant, isCustomDomain = false, variant = "button", textColor = "#1f2937" }: RestaurantInfoModalProps) {
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

  const adminLink = isCustomDomain ? "/admin" : `/${restaurant.slug}/admin`
  const legalLink = isCustomDomain ? "/legal" : `/${restaurant.slug}/legal`
  const platformLegalLink = "/platform-legal"

  const groupedHours = groupOpeningHours(hours)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "button" ? (
          <button
            className="flex items-center gap-1.5 px-2 py-1.5 hover:opacity-80 transition-opacity cursor-pointer"
            style={{ color: textColor }}
          >
            <Info className="h-3 w-3 flex-shrink-0" style={{ color: textColor }} />
            <span className="font-medium text-[10px] sm:text-xs leading-tight" style={{ color: textColor }}>
              Restaurant Info
            </span>
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            aria-label="Restaurant Informationen"
          >
            <Info className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{restaurant.name}</DialogTitle>
          <DialogDescription>Kontakt, Öffnungszeiten und rechtliche Informationen</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Kontakt */}
          <div>
            <div className="font-bold text-lg mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: restaurant.primary_color }} />
              Kontakt
            </div>
            <div className="space-y-3 pl-7">
              {restaurant.address && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" style={{ color: restaurant.primary_color }} />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" style={{ color: restaurant.primary_color }} />
                  <span className="break-all">{restaurant.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Öffnungszeiten */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: restaurant.primary_color }} />
                Öffnungszeiten
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isOpen
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {isOpen ? "Jetzt geöffnet" : "Geschlossen"}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border bg-card p-3 pl-7">
              {groupedHours.map((group, index) => {
                const isCurrentDayGroup = group.dayKeys.includes(DAYS[currentDayIndex].key)
                return (
                  <div key={index} className="flex justify-between items-center gap-2 text-sm py-1">
                    <span className="text-muted-foreground">{formatDayRange(group.days)}</span>
                    <span
                      className={`font-medium ${
                        isCurrentDayGroup && isOpen ? "text-green-600 dark:text-green-400" : ""
                      }`}
                    >
                      {group.hours}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Zusatzinformationen */}
          {restaurant.owner_name && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Inhaber:</strong> {restaurant.owner_name}
              </p>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {restaurant.name}. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
