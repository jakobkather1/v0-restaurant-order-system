import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getStripe, isStripeConfigured, logStripeError } from "@/lib/stripe"

// POST: Create a payment intent for the connected account
export async function POST(request: NextRequest) {
  try {
    // Check Stripe configuration first
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe integration not configured" },
        { status: 500 }
      )
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Failed to initialize Stripe" },
        { status: 500 }
      )
    }

    const { restaurantId, amount, orderId, customerEmail, metadata } = await request.json()

    if (!restaurantId || !amount) {
      return NextResponse.json(
        { error: "Restaurant ID and amount required" },
        { status: 400 }
      )
    }

    // Get the restaurant's Stripe account
    const restaurant = await sql`
      SELECT stripe_account_id, stripe_charges_enabled, name, fee_type, fee_value
      FROM restaurants WHERE id = ${restaurantId}
    `

    if (!restaurant[0]?.stripe_account_id) {
      return NextResponse.json(
        { error: "Restaurant has not connected Stripe" },
        { status: 400 }
      )
    }

    if (!restaurant[0].stripe_charges_enabled) {
      return NextResponse.json(
        { error: "Restaurant's Stripe account is not ready for payments" },
        { status: 400 }
      )
    }

    // Calculate platform fee
    const feeType = restaurant[0].fee_type || "percentage"
    const feeValue = restaurant[0].fee_value || 0
    let applicationFeeAmount = 0

    if (feeType === "percentage") {
      applicationFeeAmount = Math.round(amount * (feeValue / 100))
    } else {
      // Fixed fee per order (in cents)
      applicationFeeAmount = Math.round(feeValue * 100)
    }

    // Create payment intent with the connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "eur",
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: restaurant[0].stripe_account_id,
      },
      receipt_email: customerEmail || undefined,
      metadata: {
        restaurantId: restaurantId.toString(),
        orderId: orderId?.toString() || "",
        restaurantName: restaurant[0].name,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    logStripeError("Payment Intent", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment" },
      { status: 500 }
    )
  }
}
