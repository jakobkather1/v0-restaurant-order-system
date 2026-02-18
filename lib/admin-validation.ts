import type { Restaurant, Category, MenuItem, DeliveryZone, Allergen } from "@/lib/types"

interface ValidationResult {
  isComplete: boolean
  missingItems?: string[]
}

export function validateRestaurantSetup(
  restaurant: Restaurant,
  categories: Category[],
  menuItems: MenuItem[],
  deliveryZones: DeliveryZone[],
  allergens?: Allergen[]
): Record<string, ValidationResult> {
  return {
    website_general: {
      isComplete: !!(
        restaurant.name &&
        restaurant.description &&
        restaurant.phone &&
        restaurant.email &&
        restaurant.address
      ),
      missingItems: [
        !restaurant.name && "Name",
        !restaurant.description && "Beschreibung",
        !restaurant.phone && "Telefon",
        !restaurant.email && "E-Mail",
        !restaurant.address && "Adresse",
      ].filter(Boolean) as string[],
    },
    website_design: {
      isComplete: !!(restaurant.primary_color && restaurant.logo_url),
      missingItems: [
        !restaurant.primary_color && "Primärfarbe",
        !restaurant.logo_url && "Logo",
      ].filter(Boolean) as string[],
    },
    website_legal: {
      isComplete: !!(
        restaurant.impressum &&
        restaurant.privacy_policy &&
        restaurant.terms
      ),
      missingItems: [
        !restaurant.impressum && "Impressum",
        !restaurant.privacy_policy && "Datenschutz",
        !restaurant.terms && "AGB",
      ].filter(Boolean) as string[],
    },
    restaurant_menu: {
      isComplete: categories.length > 0 && menuItems.length > 0,
      missingItems: [
        categories.length === 0 && "Kategorien",
        menuItems.length === 0 && "Gerichte",
      ].filter(Boolean) as string[],
    },
    restaurant_hours: {
      isComplete: !!(restaurant.opening_hours && Object.keys(restaurant.opening_hours).length > 0),
      missingItems: [
        !restaurant.opening_hours && "Öffnungszeiten",
      ].filter(Boolean) as string[],
    },
    restaurant_delivery: {
      isComplete: deliveryZones.length > 0,
      missingItems: [
        deliveryZones.length === 0 && "Lieferzonen",
      ].filter(Boolean) as string[],
    },
    payments: {
      isComplete: !!(restaurant.stripe_account_id && restaurant.stripe_onboarding_complete),
      missingItems: [
        !restaurant.stripe_account_id && "Stripe-Konto",
        !restaurant.stripe_onboarding_complete && "Stripe-Onboarding",
      ].filter(Boolean) as string[],
    },
    legal: {
      isComplete: !!(restaurant.agb_accepted_at && restaurant.avv_accepted_at),
      missingItems: [
        !restaurant.agb_accepted_at && "AGBs akzeptieren",
        !restaurant.avv_accepted_at && "AVV akzeptieren",
      ].filter(Boolean) as string[],
    },
    website_seo: {
      isComplete: !!(restaurant.seo_title && restaurant.seo_description),
      missingItems: [
        !restaurant.seo_title && "SEO Titel",
        !restaurant.seo_description && "SEO Beschreibung",
      ].filter(Boolean) as string[],
    },
    website_domain: {
      isComplete: !!(restaurant.custom_domain),
      missingItems: [
        !restaurant.custom_domain && "Eigene Domain",
      ].filter(Boolean) as string[],
    },
    restaurant_allergens: {
      isComplete: !!(allergens && allergens.length > 0),
      missingItems: [
        (!allergens || allergens.length === 0) && "Allergene",
      ].filter(Boolean) as string[],
    },
  }
}

export function getIncompleteMainCategories(
  validations: Record<string, ValidationResult>
): Set<string> {
  const incomplete = new Set<string>()

  // Check website category
  if (
    !validations.website_general?.isComplete ||
    !validations.website_design?.isComplete ||
    !validations.website_legal?.isComplete ||
    !validations.website_seo?.isComplete ||
    !validations.website_domain?.isComplete
  ) {
    incomplete.add("website")
  }

  // Check restaurant category
  if (
    !validations.restaurant_menu?.isComplete ||
    !validations.restaurant_hours?.isComplete ||
    !validations.restaurant_delivery?.isComplete ||
    !validations.restaurant_allergens?.isComplete
  ) {
    incomplete.add("restaurant")
  }

  // Check payments
  if (!validations.payments?.isComplete) {
    incomplete.add("payments")
  }

  // Check legal/platform
  if (!validations.legal?.isComplete) {
    incomplete.add("legal")
  }

  return incomplete
}

export function getIncompleteSubTabs(
  validations: Record<string, ValidationResult>,
  category: "website" | "restaurant"
): Set<string> {
  const incomplete = new Set<string>()

  if (category === "website") {
    if (!validations.website_general?.isComplete) incomplete.add("general")
    if (!validations.website_design?.isComplete) incomplete.add("design")
    if (!validations.website_legal?.isComplete) incomplete.add("legal")
    if (!validations.website_seo?.isComplete) incomplete.add("seo")
    if (!validations.website_domain?.isComplete) incomplete.add("domain")
  } else if (category === "restaurant") {
    if (!validations.restaurant_menu?.isComplete) incomplete.add("menu1")
    if (!validations.restaurant_hours?.isComplete) incomplete.add("hours")
    if (!validations.restaurant_delivery?.isComplete) incomplete.add("delivery")
    if (!validations.restaurant_allergens?.isComplete) incomplete.add("allergens")
  }

  return incomplete
}
