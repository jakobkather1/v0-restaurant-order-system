"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, X, Plus, Sparkles, UtensilsCrossed, AlertCircle, ShoppingCart, Users } from "lucide-react"
import type { MenuItem, Category, Topping, ItemVariant, Restaurant, CartItem } from "@/lib/types"
import { ItemDialog } from "./item-dialog"

interface RecommendationItem {
  itemId: number
  itemName: string
  size?: string | null
  quantity?: number
  reason: string
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  recommendation?: RecommendationItem | null
  upsell?: RecommendationItem | null
  secondUpsell?: RecommendationItem | null
  additionalItems?: RecommendationItem[]
  addToCart?: boolean
  questionnaireType?: "order-with-me"
}

interface PizzaAssistantProps {
  restaurant: Restaurant
  menuItems: MenuItem[]
  categories: Category[]
  variants: ItemVariant[]
  toppings: Topping[]
  onAddToCart: (item: MenuItem, variant?: ItemVariant) => void
  onOpenChange?: (isOpen: boolean) => void
}

export function PizzaAssistant({
  restaurant,
  menuItems,
  categories,
  variants,
  toppings,
  onAddToCart,
  onOpenChange,
}: PizzaAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inChatHunger, setInChatHunger] = useState<string | null>(null)
  const [inChatMood, setInChatMood] = useState<string | null>(null)
  const [inChatPersons, setInChatPersons] = useState<number | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [selectedItemForDialog, setSelectedItemForDialog] = useState<MenuItem | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const restaurantName = restaurant.name
  const primaryColor = restaurant.settings?.primaryColor || "#ef4444"

  const getItemVariants = (itemId: number): ItemVariant[] => {
    const itemVariants = variants.filter((v) => v.menu_item_id === itemId)
    return itemVariants
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: `Willkommen beim Bestell-Berater von ${restaurantName}! Wie kann ich dir heute helfen?`,
          },
        ])
      }
    } else {
      document.body.style.overflow = ""
    }
    
    // Notify parent of open state change
    onOpenChange?.(isOpen)
  }, [isOpen, messages.length, restaurantName, onOpenChange])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const availableMenuItems = menuItems
    .filter((item) => item.is_available !== false)
    .map((item) => {
      const itemVariants = getItemVariants(item.id)
      return {
        ...item,
        category_name: categories.find((c) => c.id === item.category_id)?.name || "Sonstiges",
        variants: itemVariants,
      }
    })

  const availableToppings = toppings.filter((t) => t.is_available !== false)
  const availableCategories = categories.filter((c) => availableMenuItems.some((item) => item.category_id === c.id))

  const handleSend = async (
    messageText?: string,
    hungerLevel?: string | null,
    mood?: string | null,
    personCount?: number | null,
  ) => {
    const messageToSend = messageText || input.trim()
    if (!messageToSend || isLoading) return

    if (!messageText) {
      setInput("")
    }
    setShowQuickActions(false)
    setMessages((prev) => [...prev, { role: "user", content: messageToSend }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/pizza-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          menuItems: availableMenuItems,
          categories: availableCategories,
          toppings: availableToppings,
          hungerLevel: hungerLevel || null,
          mood: mood || null,
          personCount: personCount || null,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          restaurantName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message || "Entschuldigung, ich konnte keine passende Antwort generieren.",
          recommendation: data.recommendation,
          upsell: data.upsell,
          secondUpsell: data.secondUpsell,
          additionalItems: data.additionalItems || [],
          addToCart: data.addToCart,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Entschuldigung, es gab ein Problem. Lass uns nochmal versuchen! Was kann ich für dich tun?",
          },
        ])
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ups! Da ist etwas schiefgegangen. Probier es nochmal!",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSurpriseMe = () => {
    setShowQuickActions(false)
    handleSend("Überrasch mich! Empfiehl mir etwas Leckeres aus eurem Menü.")
  }

  const handleAllergyHelp = () => {
    setShowQuickActions(false)
    handleSend("Ich habe Allergien und brauche Hilfe bei der Auswahl. Welche Gerichte könnt ihr mir empfehlen?")
  }

  const handleOrderWithMe = () => {
    setShowQuickActions(false)
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Bestelle mit mir" },
      { role: "system", content: "questionnaire", questionnaireType: "order-with-me" },
    ])
    // Reset questionnaire state
    setInChatHunger(null)
    setInChatMood(null)
    setInChatPersons(null)
  }

  const handleQuestionnaireSubmit = () => {
    if (!inChatHunger || !inChatMood || !inChatPersons) return

    // Remove the questionnaire message and add the user's response
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.questionnaireType !== "order-with-me")
      return filtered
    })

    const hungerText =
      inChatHunger === "wenig" ? "wenig Hunger" : inChatHunger === "mittel" ? "mittleren Hunger" : "sehr großen Hunger"
    const moodText =
      inChatMood === "klassisch"
        ? "klassische Gerichte"
        : inChatMood === "abenteuer"
          ? "etwas Neues"
          : "etwas das mich glücklich macht"

    const userMessage = `Ich habe ${hungerText}, bin in der Stimmung für ${moodText} und wir sind ${inChatPersons} Person${inChatPersons > 1 ? "en" : ""}.`

    handleSend(userMessage, inChatHunger, inChatMood, inChatPersons)
  }

  const handleAddRecommendation = (rec: RecommendationItem) => {
    const item = menuItems.find((m) => m.id === rec.itemId)
    if (!item) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Dieses Gericht ist leider nicht mehr verfügbar. Soll ich dir eine Alternative empfehlen?",
        },
      ])
      return
    }

    const itemVariants = getItemVariants(item.id)
    
    // If item has variants, show dialog to let user choose
    if (itemVariants.length > 0) {
      setSelectedItemForDialog(item)
      return
    }

    // If no variants, add directly to cart
    for (let i = 0; i < qty; i++) {
      onAddToCart(item, selectedVariant)
    }

    const sizeText = selectedVariant ? ` (${selectedVariant.name})` : ""
    const qtyText = qty > 1 ? `${qty}x ` : ""

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `${qtyText}${item.name}${sizeText} wurde zum Warenkorb hinzugefügt! Kann ich dir noch etwas empfehlen?`,
      },
    ])
  }

  const RecommendationCard = ({
    rec,
    label,
    variant = "primary",
  }: {
    rec: RecommendationItem
    label: string
    variant?: "primary" | "secondary" | "outline"
  }) => (
    <Card
      className={`mt-2 ${variant === "primary" ? "border-2" : variant === "secondary" ? "border border-dashed" : "border"}`}
      style={variant === "primary" ? { borderColor: primaryColor } : {}}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <Badge
              className="mb-1 text-xs"
              style={variant === "primary" ? { backgroundColor: primaryColor } : {}}
              variant={variant !== "primary" ? "outline" : "default"}
            >
              {variant === "secondary" && <Sparkles className="h-3 w-3 mr-1" />}
              {label}
            </Badge>
            <p className="font-semibold text-sm">
              {rec.quantity && rec.quantity > 1 ? `${rec.quantity}x ` : ""}
              {rec.itemName}
              {rec.size && <span className="font-normal text-muted-foreground"> ({rec.size})</span>}
            </p>
            <p className="text-xs text-muted-foreground">{rec.reason}</p>
          </div>
          <Button
            size="sm"
            variant={variant === "primary" ? "default" : "outline"}
            onClick={() => handleAddRecommendation(rec)}
            style={variant === "primary" ? { backgroundColor: primaryColor } : {}}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const InChatQuestionnaire = () => (
    <Card className="mt-2 border-2" style={{ borderColor: primaryColor }}>
      <CardContent className="p-4 space-y-4">
        <div className="text-center mb-2">
          <p className="font-medium text-sm">Beantworte kurz diese Fragen:</p>
        </div>

        {/* Hunger Level */}
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">Wie hungrig bist du?</p>
          <div className="flex gap-2">
            {["wenig", "mittel", "sehr"].map((level) => (
              <Button
                key={level}
                variant={inChatHunger === level ? "default" : "outline"}
                size="sm"
                onClick={() => setInChatHunger(level)}
                className="flex-1 text-xs"
                style={inChatHunger === level ? { backgroundColor: primaryColor } : {}}
              >
                {level === "wenig" ? "Wenig" : level === "mittel" ? "Mittel" : "Sehr"}
              </Button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">Deine Stimmung?</p>
          <div className="flex gap-2">
            {["klassisch", "abenteuer", "happy"].map((m) => (
              <Button
                key={m}
                variant={inChatMood === m ? "default" : "outline"}
                size="sm"
                onClick={() => setInChatMood(m)}
                className="flex-1 text-xs"
                style={inChatMood === m ? { backgroundColor: primaryColor } : {}}
              >
                {m === "klassisch" ? "Klassisch" : m === "abenteuer" ? "Abenteuer" : "Happy"}
              </Button>
            ))}
          </div>
        </div>

        {/* Person Count */}
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">Wie viele Personen?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((count) => (
              <Button
                key={count}
                variant={inChatPersons === count ? "default" : "outline"}
                size="sm"
                onClick={() => setInChatPersons(count)}
                className="flex-1 text-xs"
                style={inChatPersons === count ? { backgroundColor: primaryColor } : {}}
              >
                <Users className="h-3 w-3 mr-1" />
                {count === 4 ? "4+" : count}
              </Button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleQuestionnaireSubmit}
          disabled={!inChatHunger || !inChatMood || !inChatPersons}
          className="w-full"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="h-4 w-4 mr-2" />
          Abschicken
        </Button>
      </CardContent>
    </Card>
  )

  const handleItemDialogAdd = (cartItem: CartItem) => {
    onAddToCart(cartItem.menuItem, cartItem.variant || undefined)
    setSelectedItemForDialog(null)
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Perfekt! ${cartItem.menuItem.name}${cartItem.variant ? ` (${cartItem.variant.name})` : ""} wurde zum Warenkorb hinzugefügt.`,
      },
    ])
  }

  return (
    <>
      {selectedItemForDialog && (
        <ItemDialog
          item={selectedItemForDialog}
          variants={getItemVariants(selectedItemForDialog.id)}
          toppings={toppings}
          primaryColor={primaryColor}
          backgroundColor={restaurant.background_color}
          textColor={restaurant.text_color}
          editingItem={null}
          onAdd={handleItemDialogAdd}
          onClose={() => setSelectedItemForDialog(null)}
        />
      )}

      <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow-lg animate-pulse"
          style={{ backgroundColor: primaryColor }}
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/50 touch-none"
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Card className="w-full sm:max-w-md h-full sm:h-[600px] sm:max-h-[90vh] flex flex-col shadow-2xl rounded-none sm:rounded-xl">
            <CardHeader
              className="flex flex-row items-center justify-between py-3 sm:py-3 px-4 border-b shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2 text-white">
                <div className="bg-white/20 rounded-full p-1.5 sm:p-2">
                  <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold">Bestell-Berater</CardTitle>
                  <p className="text-[10px] sm:text-xs opacity-80">Powered by AI</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div
                className="flex-1 p-4 overflow-y-auto overscroll-contain"
                ref={scrollRef}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      {msg.questionnaireType === "order-with-me" ? (
                        <div className="flex justify-start">
                          <div className="max-w-[90%]">
                            <InChatQuestionnaire />
                          </div>
                        </div>
                      ) : msg.role !== "system" ? (
                        <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] ${msg.role === "user" ? "order-1" : ""}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                msg.role === "user" ? "text-white rounded-br-sm" : "bg-muted rounded-bl-sm"
                              }`}
                              style={msg.role === "user" ? { backgroundColor: primaryColor } : {}}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {msg.recommendation && (
                              <RecommendationCard rec={msg.recommendation} label="Empfehlung" variant="primary" />
                            )}

                            {msg.upsell && (
                              <RecommendationCard rec={msg.upsell} label="Dazu passt" variant="secondary" />
                            )}

                            {msg.secondUpsell && (
                              <RecommendationCard rec={msg.secondUpsell} label="Noch ein Tipp" variant="outline" />
                            )}

                            {msg.additionalItems &&
                              msg.additionalItems.length > 0 &&
                              msg.additionalItems.map((item, i) => (
                                <RecommendationCard
                                  key={i}
                                  rec={item}
                                  label={`Für Person ${i + 2}`}
                                  variant="outline"
                                />
                              ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {showQuickActions && messages.length <= 1 && !isLoading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="rounded-2xl rounded-br-sm px-4 py-2 gap-2 border-2 hover:opacity-80 bg-transparent"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          color: "white",
                        }}
                        onClick={handleSurpriseMe}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Überrasch mich</span>
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="rounded-2xl rounded-br-sm px-4 py-2 gap-2 border-2 hover:opacity-80 bg-transparent"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          color: "white",
                        }}
                        onClick={handleAllergyHelp}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Hilf mir bei meinen Allergien</span>
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="rounded-2xl rounded-br-sm px-4 py-2 gap-2 border-2 hover:opacity-80 bg-transparent"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          color: "white",
                        }}
                        onClick={handleOrderWithMe}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Bestelle mit mir</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t bg-background">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Schreib eine Nachricht..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
