"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logoutRestaurantAdmin } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  UtensilsCrossed,
  Settings,
  Truck,
  Tag,
  BarChart3,
  LogOut,
  Palette,
  Search,
  Star,
  FileText,
  Globe,
  Clock,
  Mail,
  ChevronRight,
  Menu,
  X,
  Store,
  Shield,
  AlertTriangle,
  CreditCard,
  QrCode,
} from "lucide-react"
import type {
  Restaurant,
  Category,
  MenuItem,
  ItemVariant,
  Topping,
  DeliveryZone,
  MonthlyRevenue,
  DiscountCode,
  Order,
  Allergen,
} from "@/lib/types"
import { OrdersTab } from "./tabs/orders-tab"
import { MenuTabV2 } from "./tabs/menu-tab-v2"
import { DeliveryTab } from "./tabs/delivery-tab"
import { DeliveryTimesTab } from "./tabs/delivery-times-tab"
import { DiscountsTab } from "./tabs/discounts-tab"
import { AnalyticsTab } from "./tabs/analytics-tab"
import { WebsiteSettingsSection } from "./sections/website-settings-section"
import { ReviewsTab } from "./tabs/reviews-tab"
import { SecurityTab } from "./tabs/security-tab"
import { AllergensTab } from "./tabs/allergens-tab"
import { StripeTab } from "./tabs/stripe-tab"
import { QRCodeTab } from "./tabs/qr-code-tab"
import { OpeningHoursTab } from "./tabs/opening-hours-tab"
import { AgbAvvTab } from "./tabs/agb-avv-tab"
import { cn } from "@/lib/utils"
import { validateRestaurantSetup, getIncompleteMainCategories, getIncompleteSubTabs } from "@/lib/admin-validation"
import { useMemo } from "react"

interface AdminDashboardProps {
  restaurant: Restaurant
  orders: Order[]
  categories: Category[]
  menuItems: MenuItem[]
  variants: ItemVariant[]
  toppings: Topping[]
  deliveryZones: DeliveryZone[]
  deliveryTimes: Array<{
    id: number
    delivery_zone_id: number | null
    preparation_minutes: number
  }>
  revenue: MonthlyRevenue[]
  discountCodes: DiscountCode[]
  allergens?: Allergen[]
  isCustomDomain?: boolean
  platformSettings?: Record<string, string>
}

type MainCategory = "orders" | "analytics" | "website" | "restaurant" | "reviews" | "payments" | "security" | "legal"
type WebsiteSubTab = "general" | "design" | "legal" | "seo" | "domain" | "qr-code"
type RestaurantSubTab = "menu1" | "delivery" | "delivery-times" | "discounts" | "allergens" | "hours"

export function AdminDashboard({
  restaurant,
  orders,
  categories,
  menuItems,
  variants,
  toppings,
  deliveryZones,
  deliveryTimes,
  revenue,
  discountCodes,
  allergens = [],
  isCustomDomain = false,
  platformSettings = {},
}: AdminDashboardProps) {
  const [mainCategory, setMainCategory] = useState<MainCategory>("orders")
  const [websiteSubTab, setWebsiteSubTab] = useState<WebsiteSubTab | null>(null)
  const [restaurantSubTab, setRestaurantSubTab] = useState<RestaurantSubTab | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Validate setup completeness
  const validations = useMemo(
    () => validateRestaurantSetup(restaurant, categories, menuItems, deliveryZones, allergens),
    [restaurant, categories, menuItems, deliveryZones, allergens]
  )
  
  const incompleteMainCategories = useMemo(
    () => getIncompleteMainCategories(validations),
    [validations]
  )
  
  const incompleteWebsiteTabs = useMemo(
    () => getIncompleteSubTabs(validations, "website"),
    [validations]
  )
  
  const incompleteRestaurantTabs = useMemo(
    () => getIncompleteSubTabs(validations, "restaurant"),
    [validations]
  )

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutRestaurantAdmin(restaurant.slug, isCustomDomain)
    } catch {
      // redirect() throws an error, which is expected behavior
      const adminPath = isCustomDomain ? "/admin" : `/${restaurant.slug}/admin`
      router.push(adminPath)
    }
  }

  const mainNavItems = [
    {
      id: "orders" as MainCategory,
      label: "Bestellungen",
      icon: ClipboardList,
      badge: orders.filter((o) => o.status === "pending").length,
    },
    { id: "analytics" as MainCategory, label: "Umsatz", icon: BarChart3 },
    { id: "reviews" as MainCategory, label: "Bewertungen", icon: Star },
    { id: "website" as MainCategory, label: "Website", icon: Globe },
    { id: "restaurant" as MainCategory, label: "Restaurant", icon: Store },
    { id: "payments" as MainCategory, label: "Zahlungen", icon: CreditCard },
    { id: "security" as MainCategory, label: "Sicherheit", icon: Shield },
    { id: "legal" as MainCategory, label: "Platform", icon: FileText },
  ]

  const websiteSubItems = [
    { id: "general" as WebsiteSubTab, label: "Allgemein", icon: Settings },
    { id: "design" as WebsiteSubTab, label: "Design", icon: Palette },
    { id: "legal" as WebsiteSubTab, label: "Rechtliches", icon: FileText },
    { id: "seo" as WebsiteSubTab, label: "SEO", icon: Search },
    { id: "domain" as WebsiteSubTab, label: "Eigene Domain", icon: Globe },
    { id: "qr-code" as WebsiteSubTab, label: "QR-Code", icon: QrCode },
  ]

  const restaurantSubItems = [
    { id: "menu1" as RestaurantSubTab, label: "Speisekarte", icon: UtensilsCrossed },
    { id: "hours" as RestaurantSubTab, label: "Öffnungszeiten", icon: Clock },
    { id: "delivery" as RestaurantSubTab, label: "Lieferzonen", icon: Truck },
    { id: "delivery-times" as RestaurantSubTab, label: "Lieferzeiten", icon: Clock },
    { id: "discounts" as RestaurantSubTab, label: "Rabatte", icon: Tag },
    { id: "allergens" as RestaurantSubTab, label: "Allergene", icon: AlertTriangle },
  ]

  function handleNavClick(id: MainCategory) {
    // For 'website' and 'restaurant', only toggle the dropdown without switching content
    if (id === "website" || id === "restaurant") {
      // If already on this category, keep it open to show sub-items
      // If not, switch to it but don't auto-select a sub-tab
      setMainCategory(id)
      return
    }
    
    // For other tabs, switch normally
    setMainCategory(id)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  function handleSubNavClick(tab: WebsiteSubTab | RestaurantSubTab, type: "website" | "restaurant") {
    if (type === "website") {
      setMainCategory("website")
      setWebsiteSubTab(tab as WebsiteSubTab)
    } else {
      setMainCategory("restaurant")
      setRestaurantSubTab(tab as RestaurantSubTab)
    }
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm shrink-0">
        <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: restaurant.primary_color }}
            >
              {restaurant.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-gray-900 truncate text-sm sm:text-base block">{restaurant.name}</span>
              <p className="text-xs text-gray-500 hidden sm:block">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-gray-600 hover:text-gray-900 h-9 px-2 sm:px-3"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isLoggingOut ? "..." : "Abmelden"}</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-12 sm:top-14 md:top-16 z-40 h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex flex-col gap-0.5 sm:gap-1 p-2 sm:p-3 h-full overflow-y-auto overscroll-contain">
            {mainNavItems.filter(item => item && item.label).map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 sm:gap-3 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5 text-sm font-medium transition-colors",
                    mainCategory === item.id
                      ? "bg-sky-50 text-sky-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {item.badge && item.badge > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                        {item.badge}
                      </span>
                    )}
                    {!item.badge && incompleteMainCategories.has(item.id) && (
                      <span className="flex h-2 w-2 rounded-full bg-red-500" title="Setup unvollständig" />
                    )}
                    {(item.id === "website" || item.id === "restaurant" || item.id === "security") && (
                      <ChevronRight
                        className={cn("h-4 w-4 transition-transform", mainCategory === item.id && "rotate-90")}
                      />
                    )}
                  </div>
                </button>

                {/* Website Subnav */}
                {item.id === "website" && mainCategory === "website" && (
                  <div className="ml-2 sm:ml-3 md:ml-4 mt-0.5 sm:mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-2 sm:pl-3">
                    {websiteSubItems.filter(sub => sub && sub.label).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubNavClick(sub.id, "website")}
                        className={cn(
                          "flex items-center justify-between gap-1.5 sm:gap-2 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm transition-colors",
                          websiteSubTab === sub.id
                            ? "bg-sky-50 text-sky-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <sub.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {incompleteWebsiteTabs.has(sub.id) && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500" title="Setup unvollständig" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Restaurant Subnav */}
                {item.id === "restaurant" && mainCategory === "restaurant" && (
                  <div className="ml-2 sm:ml-3 md:ml-4 mt-0.5 sm:mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-2 sm:pl-3">
                    {restaurantSubItems.filter(sub => sub && sub.label).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubNavClick(sub.id, "restaurant")}
                        className={cn(
                          "flex items-center justify-between gap-1.5 sm:gap-2 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm transition-colors",
                          restaurantSubTab === sub.id
                            ? "bg-sky-50 text-sky-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <sub.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {incompleteRestaurantTabs.has(sub.id) && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500" title="Setup unvollständig" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full lg:ml-64 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
            {/* Orders */}
            {mainCategory === "orders" && <OrdersTab orders={orders} restaurantId={restaurant.id} />}

            {/* Analytics */}
            {mainCategory === "analytics" && <AnalyticsTab revenue={revenue} restaurant={restaurant} />}

            {/* Reviews */}
            {mainCategory === "reviews" && <ReviewsTab restaurantId={restaurant.id} />}

            {/* Security */}
            {mainCategory === "security" && <SecurityTab restaurant={restaurant} />}

            {/* Payments / Stripe */}
            {mainCategory === "payments" && <StripeTab restaurant={restaurant} />}

            {/* Legal / AGBs & AVV */}
            {mainCategory === "legal" && (
              <AgbAvvTab
                restaurant={restaurant}
                platformAgbs={platformSettings.platform_agbs || ""}
                platformAvv={platformSettings.platform_avv || ""}
              />
            )}
  
  {/* Website Settings - Only show content when a sub-tab is selected */}
  {mainCategory === "website" && websiteSubTab && (
    <WebsiteSettingsSection 
      restaurant={restaurant} 
      activeTab={websiteSubTab}
      categories={categories}
      deliveryZones={deliveryZones}
    />
  )}

            {/* Restaurant Settings - Only show content when a sub-tab is selected */}
            {mainCategory === "restaurant" && restaurantSubTab && (
              <>
                {restaurantSubTab === "menu1" && (
                  <MenuTabV2
                    slug={restaurant.slug}
                    restaurantId={restaurant.id}
                    initialCategories={categories}
                    initialMenuItems={menuItems}
                    initialVariants={variants}
                    initialToppings={toppings}
                  />
                )}
                {restaurantSubTab === "hours" && <OpeningHoursTab restaurant={restaurant} />}
                {restaurantSubTab === "delivery" && <DeliveryTab deliveryZones={deliveryZones} />}
                {restaurantSubTab === "delivery-times" && (
                  <DeliveryTimesTab
                    restaurant={restaurant}
                    deliveryZones={deliveryZones}
                    deliveryTimes={deliveryTimes}
                  />
                )}
                {restaurantSubTab === "discounts" && <DiscountsTab discountCodes={discountCodes} />}
                {restaurantSubTab === "allergens" && (
                  <AllergensTab restaurantId={restaurant.id} allergens={allergens} />
                )}
              </>
            )}
            
            {/* Placeholder when no sub-tab is selected */}
            {mainCategory === "website" && !websiteSubTab && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Website-Einstellungen</h3>
                  <p className="text-gray-600">Wählen Sie einen Bereich aus der Seitenleiste aus</p>
                </div>
              </div>
            )}
            
            {mainCategory === "restaurant" && !restaurantSubTab && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurant-Einstellungen</h3>
                  <p className="text-gray-600">Wählen Sie einen Bereich aus der Seitenleiste aus</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
