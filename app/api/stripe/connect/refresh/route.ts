import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getStripe, logStripeError } from "@/lib/stripe"

// GET: Refresh the onboarding link if it expired
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.redirect(new URL("/admin/dashboard?error=missing_restaurant", request.url))
    }

    // Get the restaurant's Stripe account ID
    const restaurant = await sql`
      SELECT stripe_account_id, slug FROM restaurants WHERE id = ${restaurantId}
    `

    if (!restaurant[0]?.stripe_account_id) {
      return NextResponse.redirect(new URL(`/${restaurant[0]?.slug || ""}/admin/dashboard?error=no_stripe_account`, request.url))
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.redirect(new URL(`/${restaurant[0]?.slug || ""}/admin/dashboard?error=stripe_not_configured`, request.url))
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || ""

    // Create a new account link
    const accountLink = await stripe.accountLinks.create({
      account: restaurant[0].stripe_account_id,
      refresh_url: `${origin}/api/stripe/connect/refresh?restaurantId=${restaurantId}`,
      return_url: `${origin}/api/stripe/connect/callback?restaurantId=${restaurantId}`,
      type: "account_onboarding",
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    logStripeError("Refresh", error)
    return NextResponse.redirect(new URL("/admin/dashboard?error=stripe_refresh_failed", request.url))
  }
}
