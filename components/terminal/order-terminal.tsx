"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type {
  Restaurant,
  Category,
  MenuItem,
  ItemVariant,
  Topping,
  DeliveryZone,
  CartItem,
  Review,
  Allergen,
} from "@/lib/types"
import { TerminalHeader } from "./terminal-header"
import { TerminalHero } from "./terminal-hero"
import { RestaurantInfoBar } from "./restaurant-info-bar"
import { MenuSection, CategoryBar } from "./menu-section"
import { ReviewsSection } from "./reviews-section"
import { SeoFooter } from "./seo-footer"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

// Dynamic imports for components only needed on interaction (reduces initial bundle by ~150KB)
const ItemDialog = dynamic(() => import("./item-dialog").then(mod => ({ default: mod.ItemDialog })), { ssr: false })
const CartDrawer = dynamic(() => import("./cart-drawer").then(mod => ({ default: mod.CartDrawer })), { ssr: false })
const CheckoutFlow = dynamic(() => import("./checkout-flow").then(mod => ({ default: mod.CheckoutFlow })), { ssr: false })
const PizzaAssistant = dynamic(() => import("./pizza-assistant").then(mod => ({ default: mod.PizzaAssistant })), { ssr: false })
const DeliveryPreferenceModal = dynamic(() => import("./delivery-preference-modal").then(mod => ({ default: mod.DeliveryPreferenceModal })), { ssr: false })

interface OrderTerminalProps {
  restaurant: Restaurant
  categories: Category[]
  menuItems: MenuItem[]
  variants: ItemVariant[]
  toppings: Topping[]
  deliveryZones: DeliveryZone[]
  isOpen: boolean
  reviewStats?: { avgRating: number; reviewCount: number }
  reviews?: Review[]
  allergens?: Allergen[]
  dishAllergens?: Record<number, number[]>
  isCustomDomain?: boolean
}

export function OrderTerminal({
  restaurant,
  categories,
  menuItems,
  variants,
  toppings,
  deliveryZones,
  isOpen,
  reviewStats,
  reviews,
  allergens,
  dishAllergens,
  isCustomDomain = false,
}: OrderTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [orderNote, setOrderNote] = useState("")
  const [categoryBarState, setCategoryBarState] = useState<{
    categories: Category[]
    activeCategory: number | null
    scrollToCategory: (id: number) => void
    searchSectionRef: React.RefObject<HTMLDivElement>
    hasSearchQuery: boolean
  } | null>(null)
  const [showCategoryBar, setShowCategoryBar] = useState(false)
  
  // Delivery preference state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [orderType, setOrderType] = useState<"pickup" | "delivery" | null>(null)
  const [prefilledAddress, setPrefilledAddress] = useState<{
    street: string
    number: string
    postalCode: string
    city: string
    zone: DeliveryZone
  } | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--restaurant-bg", restaurant.background_color || "#ffffff")
    root.style.setProperty("--restaurant-text", restaurant.text_color || "#1f2937")
    root.style.setProperty("--restaurant-primary", restaurant.primary_color || "#0369a1")

    // Apply to body
    document.body.style.backgroundColor = restaurant.background_color || "#ffffff"
    document.body.style.color = restaurant.text_color || "#1f2937"

    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = ""
      document.body.style.color = ""
    }
  }, [restaurant.background_color, restaurant.text_color, restaurant.primary_color])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurant.id}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch {
        // Invalid cart data
      }
    }
  }, [restaurant.id])
  
  // Load delivery preference from localStorage
  useEffect(() => {
    const savedOrderType = localStorage.getItem(`orderType_${restaurant.id}`)
    const savedAddress = localStorage.getItem(`deliveryAddress_${restaurant.id}`)
    
    if (savedOrderType) {
      setOrderType(savedOrderType as "pickup" | "delivery")
    }
    
    if (savedAddress) {
      try {
        setPrefilledAddress(JSON.parse(savedAddress))
      } catch {
        // Invalid address data
      }
    }
    
    // Show modal only if no preference is saved
    if (!savedOrderType) {
      setShowDeliveryModal(true)
    }
  }, [restaurant.id])

  // Track scroll position to show/hide category bar - responsive for all devices
  useEffect(() => {
    // Hide category bar during checkout, cart, assistant, or when search is active
    if (showCheckout || showCart || showAssistant || !categoryBarState?.searchSectionRef.current || categoryBarState.hasSearchQuery) {
      setShowCategoryBar(false)
      return
    }
    
    const handleScroll = () => {
      const searchSection = categoryBarState.searchSectionRef.current
      if (!searchSection) return
      
      const rect = searchSection.getBoundingClientRect()
      // Show category bar when search section scrolls past top (no header offset needed with top-0)
      setShowCategoryBar(rect.bottom <= 0)
    }

    const handleResize = () => {
      handleScroll() // Recalculate on resize
    }

    handleScroll() // Check initial state
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [categoryBarState, showCheckout, showCart, showAssistant])

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(`cart_${restaurant.id}`, JSON.stringify(cart))
  }, [cart, restaurant.id])

  function getItemVariants(itemId: number) {
    return variants.filter((v) => v.menu_item_id === itemId)
  }

  function addToCart(item: CartItem) {
    if (editingCartIndex !== null) {
      // Editing existing item
      const newCart = [...cart]
      newCart[editingCartIndex] = item
      setCart(newCart)
      setEditingCartIndex(null)
    } else {
      // Check if identical item already exists in cart
      const existingIndex = cart.findIndex((cartItem) => {
        // Same menu item
        if (cartItem.menuItem.id !== item.menuItem.id) return false
        
        // Same variant (or both null)
        if (cartItem.variant?.id !== item.variant?.id) return false
        
        // Same toppings (compare IDs)
        const cartToppingIds = cartItem.toppings.map(t => t.id).sort().join(',')
        const newToppingIds = item.toppings.map(t => t.id).sort().join(',')
        if (cartToppingIds !== newToppingIds) return false
        
        // Same notes
        if (cartItem.notes !== item.notes) return false
        
        return true
      })
      
      if (existingIndex !== -1) {
        // Item exists, increase quantity
        const newCart = [...cart]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + item.quantity
        }
        setCart(newCart)
      } else {
        // New item, add to cart
        setCart([...cart, item])
      }
    }
    setSelectedItem(null)
  }

  function addUpsellToCart(item: MenuItem, variant?: ItemVariant) {
    const basePrice = Number(item.base_price)
    const variantPrice = variant ? Number(variant.price_modifier) : 0
    const totalPrice = basePrice + variantPrice

    const cartItem: CartItem = {
      menuItem: item,
      variant: variant || null,
      toppings: [],
      quantity: 1,
      notes: "",
      totalPrice,
    }

    // Check if identical item already exists
    const existingIndex = cart.findIndex((c) => {
      return c.menuItem.id === item.id && 
             c.variant?.id === variant?.id && 
             c.toppings.length === 0 && 
             c.notes === ""
    })

    if (existingIndex !== -1) {
      // Item exists, increase quantity
      const newCart = [...cart]
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + 1
      }
      setCart(newCart)
    } else {
      // New item, add to cart
      setCart([...cart, cartItem])
    }
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index))
  }

  function updateCartItemQuantity(index: number, quantity: number) {
    if (quantity < 1) {
      removeFromCart(index)
      return
    }
    const newCart = [...cart]
    newCart[index] = { ...newCart[index], quantity }
    setCart(newCart)
  }

  function editCartItem(index: number) {
    const item = cart[index]
    setEditingCartIndex(index)
    setSelectedItem(item.menuItem)
    setShowCart(false)
  }

  function clearCart() {
    setCart([])
    localStorage.removeItem(`cart_${restaurant.id}`)
  }

  function handleCheckoutClick() {
    setShowCart(false)
    setShowCheckout(true)
  }
  
  function handleSelectPickup() {
    setOrderType("pickup")
    setPrefilledAddress(null)
    localStorage.setItem(`orderType_${restaurant.id}`, "pickup")
    localStorage.removeItem(`deliveryAddress_${restaurant.id}`)
  }
  
  function handleSelectDelivery(address: {
    street: string
    number: string
    postalCode: string
    city: string
    zone: DeliveryZone
  }) {
    setOrderType("delivery")
    setPrefilledAddress(address)
    localStorage.setItem(`orderType_${restaurant.id}`, "delivery")
    localStorage.setItem(`deliveryAddress_${restaurant.id}`, JSON.stringify(address))
  }

  function handleChangeOrderType(type: "pickup" | "delivery") {
    if (type === "pickup") {
      // Directly switch to pickup
      setOrderType("pickup")
      localStorage.setItem(`orderType_${restaurant.id}`, "pickup")
    } else {
      // Switch to delivery - check if address exists
      const savedAddress = localStorage.getItem(`deliveryAddress_${restaurant.id}`)
      if (savedAddress && prefilledAddress) {
        // Address already exists, just switch
        setOrderType("delivery")
        localStorage.setItem(`orderType_${restaurant.id}`, "delivery")
      } else {
        // No address, open modal
        setShowDeliveryModal(true)
      }
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalItems = cartItemCount

  const upsellItems = menuItems.filter(
    (item) => item.is_upsell && item.is_available,
  )

  const primaryColor = restaurant.primary_color

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item)
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {restaurant.banner_text && (
        <div
          className="text-white py-1.5 sm:py-2 w-full overflow-hidden text-sm sm:text-base"
          style={{ backgroundColor: restaurant.primary_color }}
        >
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="mx-4">{restaurant.banner_text}</span>
            <span className="mx-4">{restaurant.banner_text}</span>
            <span className="mx-4">{restaurant.banner_text}</span>
          </div>
        </div>
      )}

      <TerminalHeader restaurant={restaurant} isCustomDomain={isCustomDomain} />
      
      {/* Delivery Preference Modal */}
      <DeliveryPreferenceModal
        open={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        deliveryZones={deliveryZones}
        onSelectPickup={handleSelectPickup}
        onSelectDelivery={handleSelectDelivery}
        primaryColor={primaryColor}
      />

      <main className="w-full">
        <TerminalHero restaurant={restaurant} />
        
      <RestaurantInfoBar
        restaurant={restaurant}
        isOpen={isOpen}
        isCustomDomain={isCustomDomain}
        reviewStats={reviewStats}
        deliveryZones={deliveryZones}
        selectedZone={prefilledAddress?.zone}
        orderType={orderType}
        textColor={restaurant.text_color || "#1f2937"}
        onChangeOrderType={handleChangeOrderType}
      />

        {/* Sticky container for all content sections */}
        <div className="relative">
          {/* Global Fixed Category Bar - Responsive on all devices */}
          {showCategoryBar && categoryBarState && (
            <div 
              data-category-bar="true"
              className="fixed top-0 left-0 right-0 z-[100] w-full py-2 sm:py-3 border-b transition-all duration-200 shadow-md"
              style={{ 
                backgroundColor: restaurant.background_color || "#ffffff"
              }}
            >
              <CategoryBar
                categories={categoryBarState.categories}
                activeCategory={categoryBarState.activeCategory}
                primaryColor={primaryColor}
                restaurant={restaurant}
                onScrollToCategory={categoryBarState.scrollToCategory}
              />
            </div>
          )}

          <MenuSection
            categories={categories}
            menuItems={menuItems}
            variants={variants}
            toppings={toppings}
            restaurant={restaurant}
            primaryColor={primaryColor}
            onSelectItem={handleSelectItem}
            allergens={allergens}
            dishAllergens={dishAllergens}
            onCategoryBarStateChange={setCategoryBarState}
          />

          {reviews.length > 0 && (
            <ReviewsSection 
              restaurantId={restaurant.id}
              reviews={reviews} 
              avgRating={reviewStats.avgRating}
              reviewCount={reviewStats.count}
              primaryColor={primaryColor}
              backgroundColor={restaurant.background_color}
              textColor={restaurant.text_color}
            />
          )}
        </div>
      </main>

      {/* AI Assistant */}
      {restaurant.settings?.ai_assistant_enabled !== false && menuItems.length > 0 && (
        <PizzaAssistant
          restaurant={restaurant}
          menuItems={menuItems}
          categories={categories}
          variants={variants}
          toppings={toppings}
          onAddToCart={addUpsellToCart}
          primaryColor={primaryColor}
          onOpenChange={setShowAssistant}
        />
      )}

      {cartItemCount > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
          <Button
            size="lg"
            onClick={() => setShowCart(true)}
            className="rounded-full shadow-lg h-12 sm:h-14 px-4 sm:px-6 min-w-[120px]"
            style={{ backgroundColor: restaurant.primary_color }}
          >
            <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-bold text-sm sm:text-base">{cartTotal.toFixed(2)}€</span>
            <span className="ml-2 bg-white/20 rounded-full px-1.5 sm:px-2 py-0.5 text-xs sm:text-sm">
              {cartItemCount}
            </span>
          </Button>
        </div>
      )}

      {selectedItem && (
        <ItemDialog
          item={selectedItem}
          variants={getItemVariants(selectedItem.id)}
          toppings={selectedItem.toppings_allowed ? toppings : []}
          primaryColor={primaryColor}
          backgroundColor={restaurant.background_color}
          textColor={restaurant.text_color}
          editingItem={editingCartIndex !== null ? cart[editingCartIndex] : null}
          onAdd={addToCart}
          onClose={() => {
            setSelectedItem(null)
            setEditingCartIndex(null)
          }}
          allergens={allergens}
          dishAllergens={dishAllergens}
        />
      )}

      <CartDrawer
        open={showCart}
        onOpenChange={setShowCart}
        cart={cart}
        restaurant={restaurant}
        isOpen={isOpen}
        deliveryZones={deliveryZones}
        selectedZone={prefilledAddress?.zone}
        orderType={orderType}
        onUpdateQuantity={updateCartItemQuantity}
        onRemove={removeFromCart}
        onEdit={editCartItem}
        onCheckout={handleCheckoutClick}
      />

      <CheckoutFlow
        open={showCheckout}
        onOpenChange={setShowCheckout}
        cart={cart}
        restaurant={restaurant}
        deliveryZones={deliveryZones}
        isOpen={isOpen}
        upsellItems={upsellItems}
        allMenuItems={menuItems.filter((item) => item.is_available)}
        getItemVariants={getItemVariants}
        toppings={toppings}
        onAddItem={addUpsellToCart}
        onSuccess={clearCart}
        prefilledOrderType={orderType}
        prefilledAddress={prefilledAddress}
      />

      {/* SEO Footer */}
      <SeoFooter restaurant={restaurant} isCustomDomain={isCustomDomain} deliveryZones={deliveryZones} />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  )
}
