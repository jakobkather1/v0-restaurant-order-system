"use client"

import type { Restaurant, DeliveryZone } from "@/lib/types"
import { Facebook, Instagram, MapPin, CreditCard, Smartphone, LogIn } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SeoFooterProps {
  restaurant: Restaurant
  isCustomDomain?: boolean
  deliveryZones?: DeliveryZone[]
}

export function SeoFooter({ restaurant, isCustomDomain, deliveryZones = [] }: SeoFooterProps) {
  const [showZonesDialog, setShowZonesDialog] = useState(false)
  // Don't render if SEO footer is disabled
  if (!restaurant.seo_footer_enabled) {
    return null
  }

  const legalLink = isCustomDomain ? "/legal" : `/${restaurant.slug}/legal`
  const impressumLink = legalLink
  const datenschutzLink = legalLink
  const adminLink = isCustomDomain ? "/admin" : `/${restaurant.slug}/admin`
  const platformLegalLink = "/platform-legal"
  const hasSocialLinks = restaurant.seo_footer_show_social_media && (restaurant.facebook_url || restaurant.instagram_url)
  const hasPaymentMethods = restaurant.seo_footer_show_payment_methods && restaurant.payment_methods && restaurant.payment_methods.length > 0

  // Convert hex color to rgba with 70% opacity
  const backgroundColor = restaurant.background_color 
    ? `${restaurant.background_color}B3` // Adding B3 (70% in hex) for transparency
    : 'rgba(15, 23, 42, 0.7)' // Default slate-900 with 70% opacity
  
  // Create a slightly darker background for accents (darker shade of the footer background)
  const accentBackgroundColor = restaurant.background_color
    ? `${restaurant.background_color}26` // Adding 26 (15% in hex) for very subtle accent
    : 'rgba(0, 0, 0, 0.15)' // Default dark overlay for accents
  
  const textColor = restaurant.text_color || '#ffffff'

  return (
    <footer 
      className="mt-12 sm:mt-16 border-t-2 border-slate-700"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* SEO Description */}
        {restaurant.seo_footer_description && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: textColor }}>
              {restaurant.name} - Ihr Restaurant in {restaurant.city}
            </h2>
            <div 
              className="text-sm sm:text-base leading-relaxed"
              style={{ color: textColor }}
              dangerouslySetInnerHTML={{ __html: restaurant.seo_footer_description }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Delivery Areas */}
          {restaurant.seo_footer_delivery_areas && restaurant.seo_footer_delivery_areas.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: textColor }}>
                <MapPin className="h-4 w-4" />
                Liefergebiete
              </h3>
              <ul className="space-y-2 text-sm">
                {restaurant.seo_footer_delivery_areas.map((area, index) => {
                  const areaSlug = area.toLowerCase().replace(/\s+/g, '-')
                  const link = isCustomDomain ? `/lieferung/${areaSlug}` : `/${restaurant.slug}/lieferung/${areaSlug}`
                  return (
                    <li key={index}>
                      <Link
                        href={link}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: textColor }}
                      >
                        {area}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Popular Categories */}
          {restaurant.seo_footer_popular_categories && restaurant.seo_footer_popular_categories.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3" style={{ color: textColor }}>Beliebte Kategorien</h3>
              <ul className="space-y-2 text-sm">
                {restaurant.seo_footer_popular_categories.map((category, index) => {
                  const categorySlug = category.toLowerCase().replace(/\s+/g, '-')
                  const link = isCustomDomain ? `/kategorie/${categorySlug}` : `/${restaurant.slug}/kategorie/${categorySlug}`
                  return (
                    <li key={index}>
                      <Link 
                        href={link} 
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: textColor }}
                      >
                        {category}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Contact & Info */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: textColor }}>Kontakt</h3>
            <ul className="space-y-2 text-sm">
              {restaurant.address && (
                <li style={{ color: textColor }}>
                  {restaurant.address}
                  {restaurant.postal_code && restaurant.city && (
                    <>
                      <br />
                      {restaurant.postal_code} {restaurant.city}
                    </>
                  )}
                </li>
              )}
              {restaurant.phone && (
                <li>
                  <a 
                    href={`tel:${restaurant.phone}`}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: textColor }}
                  >
                    {restaurant.phone}
                  </a>
                </li>
              )}
              {restaurant.email && (
                <li>
                  <a 
                    href={`mailto:${restaurant.email}`}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: textColor }}
                  >
                    {restaurant.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social & Payment */}
          <div>
            {hasSocialLinks && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: textColor }}>Folgen Sie uns</h3>
                <div className="flex gap-3">
                  {restaurant.facebook_url && (
                    <a
                      href={restaurant.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-opacity hover:opacity-70"
                      style={{ 
                        backgroundColor: accentBackgroundColor,
                        color: textColor
                      }}
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {restaurant.instagram_url && (
                    <a
                      href={restaurant.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-opacity hover:opacity-70"
                      style={{ 
                        backgroundColor: accentBackgroundColor,
                        color: textColor
                      }}
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {hasPaymentMethods && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: textColor }}>Zahlungsmethoden</h3>
                <div className="flex flex-wrap gap-2">
                  {restaurant.payment_methods.map((method, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ 
                        backgroundColor: accentBackgroundColor,
                        color: textColor
                      }}
                    >
                      {method.toLowerCase().includes('bar') && <span>💵</span>}
                      {method.toLowerCase().includes('karte') && <CreditCard className="h-3 w-3" />}
                      {method.toLowerCase().includes('paypal') && <span>P</span>}
                      {method}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6" style={{ borderTopColor: accentBackgroundColor, borderTopWidth: '1px' }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm" style={{ color: textColor }}>
            <p>© {new Date().getFullYear()} {restaurant.name}. Alle Rechte vorbehalten.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href={impressumLink}
                className="hover:opacity-80 transition-opacity"
                style={{ color: textColor }}
              >
                Impressum
              </Link>
              <Link 
                href={datenschutzLink}
                className="hover:opacity-80 transition-opacity"
                style={{ color: textColor }}
              >
                Datenschutz
              </Link>
              <Link 
                href={platformLegalLink}
                className="hover:opacity-80 transition-opacity"
                style={{ color: textColor }}
              >
                Technischer Betrieb
              </Link>
              <Link
                href={adminLink}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ color: textColor }}
              >
                <LogIn className="h-3.5 w-3.5" />
                Restaurant Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Zones Dialog */}
      <Dialog open={showZonesDialog} onOpenChange={setShowZonesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Unsere Liefergebiete</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {deliveryZones && deliveryZones.length > 0 ? (
              deliveryZones.map((zone) => (
                <div
                  key={zone.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-2">{zone.name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Postleitzahlen:</span>
                      <span className="text-muted-foreground">{zone.postal_codes.join(", ")}</span>
                    </div>
                    
                    {zone.minimum_order_value > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[120px]">Mindestbestellwert:</span>
                        <span className="text-muted-foreground">{Number(zone.minimum_order_value).toFixed(2)}€</span>
                      </div>
                    )}
                    
                    {zone.delivery_fee > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[120px]">Liefergebühr:</span>
                        <span className="text-muted-foreground">{Number(zone.delivery_fee).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Keine Lieferzonen verfügbar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
