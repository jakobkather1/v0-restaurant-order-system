"use client"

import { useState, useEffect } from "react"
import { getRestaurantReviews, approveReview, deleteReview } from "@/app/[slug]/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Check, Trash2, Clock } from "lucide-react"
import type { Review } from "@/lib/types"

export function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    const data = await getRestaurantReviews()
    setReviews(data as Review[])
    setLoading(false)
  }

  async function handleApprove(id: number) {
    await approveReview(id)
    loadReviews()
  }

  async function handleDelete(id: number) {
    if (confirm("Bewertung wirklich löschen?")) {
      await deleteReview(id)
      loadReviews()
    }
  }

  const pendingReviews = reviews.filter((r) => !r.is_approved)
  const approvedReviews = reviews.filter((r) => r.is_approved)
  const avgRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Bewertungen werden geladen...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bewertungen</h2>
        <p className="text-gray-600">Verwalte Kundenbewertungen für dein Restaurant</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Durchschnitt</p>
                <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ausstehend</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Ausstehende Bewertungen</CardTitle>
            <CardDescription>Diese Bewertungen müssen freigegeben werden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.customer_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("de-DE")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleApprove(review.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 bg-transparent"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approved Reviews */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Freigegebene Bewertungen</CardTitle>
          <CardDescription>Diese Bewertungen sind auf deinem Terminal sichtbar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {approvedReviews.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Noch keine freigegebenen Bewertungen</p>
          ) : (
            approvedReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.customer_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("de-DE")}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 bg-transparent"
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
