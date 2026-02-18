"use client"

import { useState } from "react"
import { Star, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import type { Review } from "@/lib/types"
import { submitReview } from "@/app/[slug]/actions"

interface ReviewsSectionProps {
  restaurantId: number
  reviews: Review[]
  avgRating: number
  reviewCount: number
  primaryColor: string
  backgroundColor?: string
  textColor?: string
}

export function ReviewsSection({ 
  restaurantId, 
  reviews, 
  avgRating, 
  reviewCount, 
  primaryColor,
  backgroundColor = "#ffffff",
  textColor = "#1f2937"
}: ReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")
    formData.set("restaurantId", restaurantId.toString())
    formData.set("rating", rating.toString())

    const result = await submitReview(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setShowForm(false)
    }
    setLoading(false)
  }

  return (
    <section className="py-8 sm:py-12 bg-transparent">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ausgewählte Bewertungen</h2>
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm sm:text-base">
                  {avgRating.toFixed(1)} ({reviewCount})
                </span>
              </div>
            )}
          </div>
          {!showForm && !success && (
            <Button
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: primaryColor }}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
            >
              Bewertung schreiben
            </Button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4 sm:pt-6">
              <p className="text-green-700 text-sm sm:text-base">
                Vielen Dank für deine Bewertung! Sie wird nach Freigabe angezeigt.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {showForm && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4 sm:pt-6">
              <form action={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bewertung</label>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 touch-manipulation"
                      >
                        <Star
                          className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                            star <= (hoverRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Input
                      id="customerName"
                      name="customerName"
                      required
                      placeholder="Dein Name"
                      className="h-11 sm:h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail (optional)
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@beispiel.de"
                      className="h-11 sm:h-10"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Dein Kommentar
                  </label>
                  <Textarea
                    id="comment"
                    name="comment"
                    required
                    rows={3}
                    placeholder="Erzähl uns von deiner Erfahrung..."
                    className="resize-none"
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full sm:w-auto h-11 sm:h-10"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Wird gesendet..." : "Absenden"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto h-11 sm:h-10"
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <Card 
                key={review.id}
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${backgroundColor} 95%, ${textColor} 5%)`,
                  color: textColor
                }}
              >
                <CardContent className="p-4 sm:pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
                      {review.customer_name}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm opacity-80">{review.comment}</p>
                  <p className="text-[10px] sm:text-xs mt-2 opacity-60">
                    {new Date(review.created_at).toLocaleDateString("de-DE")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !success && (
            <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
              Noch keine Bewertungen. Sei der Erste!
            </p>
          )
        )}
      </div>
    </section>
  )
}
