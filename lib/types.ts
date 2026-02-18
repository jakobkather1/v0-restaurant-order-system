export interface Restaurant {
  id: number
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  hero_image_url: string | null
  primary_color: string
  background_color: string // Added background and text color fields
  text_color: string
  slogan: string | null
  banner_text: string | null
  address: string | null
  email: string | null
  phone: string | null
  owner_name: string | null
  impressum: string | null
  opening_hours: Record<string, { open: string; close: string }>
  fee_type: "percentage" | "fixed"
  fee_value: number
  admin_password_hash: string | null
  info_text: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  google_business_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  city: string | null
  postal_code: string | null
  country: string
  latitude: number | null
  longitude: number | null
  cuisine_type: string | null
  price_range: string
  accepts_reservations: boolean
  payment_methods: string[]
  custom_domain: string | null
  legal_name: string | null
  legal_address: string | null
  legal_contact: string | null
  tax_id: string | null
  privacy_policy_content: string | null
  legal_disclaimer: string | null
  allow_super_admin_revenue_view: boolean
  super_admin_restaurant_password: string | null
  encrypted_admin_password: string | null
  admin_password_set: boolean
  ai_assistant_enabled: boolean // Added AI assistant enabled field
  checkout_info_text: string | null // Added checkout info text field
  accepts_preorders: boolean // Added pre-order support field
  manually_closed: boolean // Manual closure override
  // Stripe Connect fields
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean
  stripe_connected_at: string | null
  // SEO Footer fields
  seo_footer_enabled: boolean
  seo_footer_description: string | null
  seo_footer_delivery_areas: string[]
  seo_footer_popular_categories: string[]
  seo_footer_show_social_media: boolean
  seo_footer_show_payment_methods: boolean
}

export interface DomainRequest {
  id: number
  restaurant_id: number
  requested_domain: string
  status: "pending" | "completed" | "rejected"
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  completed_by: string | null
}

// ... rest of existing types remain unchanged ...
