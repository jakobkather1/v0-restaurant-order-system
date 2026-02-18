"use client"

import { useState } from "react"
import type { Restaurant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Image from "next/image"
import { RestaurantInfoModal } from "./restaurant-info-modal"

interface TerminalHeaderProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
}

export function TerminalHeader({ restaurant, isCustomDomain }: TerminalHeaderProps) {
  const [open, setOpen] = useState(false)
  const bgColor = restaurant.background_color || "#ffffff"

  return (
    <header 
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ backgroundColor: `color-mix(in srgb, ${bgColor} 95%, transparent)` }}
    >
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {restaurant.logo_url ? (
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <Image
                src={restaurant.logo_url || "/placeholder.svg"}
                alt={restaurant.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 32px, 40px"
                quality={90}
                unoptimized={restaurant.logo_url.includes('blob.vercel-storage.com')}
              />
            </div>
          ) : (
            <div
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white font-bold text-sm sm:text-base flex-shrink-0"
              style={{ backgroundColor: restaurant.primary_color }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-base sm:text-xl font-bold truncate">{restaurant.name}</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <a href="#menu" className="text-sm font-medium hover:text-primary transition-colors">
            Speisekarte
          </a>
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Phone className="h-4 w-4" style={{ color: restaurant.primary_color }} />
              <span className="hidden lg:inline">{restaurant.phone}</span>
            </a>
          )}
        </nav>

        {/* Mobile Menu - Hamburger */}
        <div className="flex items-center md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
              <SheetHeader className="p-4 border-b" style={{ backgroundColor: `${restaurant.primary_color}10` }}>
                <div className="flex items-center gap-3">
                  {restaurant.logo_url ? (
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <Image
                        src={restaurant.logo_url || "/placeholder.svg"}
                        alt={restaurant.name}
                        fill
                        className="object-contain"
                        sizes="48px"
                        quality={90}
                        unoptimized={restaurant.logo_url.includes('blob.vercel-storage.com')}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold"
                      style={{ backgroundColor: restaurant.primary_color }}
                    >
                      {restaurant.name.charAt(0)}
                    </div>
                  )}
                  <SheetTitle className="text-left">{restaurant.name}</SheetTitle>
                </div>
              </SheetHeader>

              <nav className="flex flex-col p-4">
                <a
                  href="#menu"
                  className="flex items-center justify-between py-4 text-lg font-medium hover:text-primary transition-colors border-b"
                  onClick={() => setOpen(false)}
                >
                  Speisekarte
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </a>

                <div className="mt-6 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kontakt</p>
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Phone className="h-5 w-5 flex-shrink-0" style={{ color: restaurant.primary_color }} />
                      <span className="font-medium">{restaurant.phone}</span>
                    </a>
                  )}
                  {restaurant.email && (
                    <a
                      href={`mailto:${restaurant.email}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Mail className="h-5 w-5 flex-shrink-0" style={{ color: restaurant.primary_color }} />
                      <span className="font-medium break-all text-sm">{restaurant.email}</span>
                    </a>
                  )}
                  {restaurant.address && (
                    <div className="flex items-start gap-3 py-3 px-4 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: restaurant.primary_color }} />
                      <span className="text-sm">{restaurant.address}</span>
                    </div>
                  )}
                </div>
            </nav>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  )
}
