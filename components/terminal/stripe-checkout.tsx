"use client"

import React from "react"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, AlertCircle, Lock } from "lucide-react"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  restaurantId: number
  amount: number
  orderId?: number
  customerEmail?: string
  primaryColor: string
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ 
  primaryColor, 
  onSuccess, 
  onError,
  amount 
}: { 
  primaryColor: string
  onSuccess: () => void
  onError: (error: string) => void
  amount: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: "if_required",
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message || "Ein Fehler ist aufgetreten")
        onError(error.message || "Zahlungsfehler")
      } else {
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten")
        onError("Ein unerwarteter Fehler ist aufgetreten")
      }
    } else {
      onSuccess()
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <Lock className="h-3 w-3" />
        Sichere Zahlung mit SSL-Verschlüsselung
      </div>

      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full h-12 text-base font-semibold rounded-xl"
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Wird verarbeitet...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            {amount.toFixed(2)}€ bezahlen
          </>
        )}
      </Button>
    </form>
  )
}

export function StripeCheckout({
  restaurantId,
  amount,
  orderId,
  customerEmail,
  primaryColor,
  onSuccess,
  onError,
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            amount,
            orderId,
            customerEmail,
          }),
        })

        const data = await response.json()

        if (response.ok && data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || "Fehler beim Erstellen der Zahlung")
          onError(data.error || "Fehler beim Erstellen der Zahlung")
        }
      } catch (err) {
        setError("Netzwerkfehler beim Erstellen der Zahlung")
        onError("Netzwerkfehler beim Erstellen der Zahlung")
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [restaurantId, amount, orderId, customerEmail, onError])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
        <p className="text-sm text-gray-500">Zahlungsformular wird geladen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Zahlung nicht verfügbar</p>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <p className="text-xs text-gray-500 mt-3">
          Bitte versuche es später erneut oder wähle Barzahlung.
        </p>
      </div>
    )
  }

  if (!clientSecret) {
    return null
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: primaryColor,
            borderRadius: "8px",
          },
        },
        locale: "de",
      }}
    >
      <CheckoutForm 
        primaryColor={primaryColor} 
        onSuccess={onSuccess} 
        onError={onError}
        amount={amount}
      />
    </Elements>
  )
}

// Simple check if restaurant has Stripe connected
export function useStripeAvailable(restaurantId: number) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkStripe() {
      try {
        const response = await fetch(`/api/stripe/connect?restaurantId=${restaurantId}`)
        const data = await response.json()
        setAvailable(data.connected && data.chargesEnabled)
      } catch {
        setAvailable(false)
      } finally {
        setLoading(false)
      }
    }

    checkStripe()
  }, [restaurantId])

  return { available, loading }
}
