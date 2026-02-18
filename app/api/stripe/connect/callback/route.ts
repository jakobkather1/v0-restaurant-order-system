import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getStripe, logStripeError } from "@/lib/stripe"

// GET: Handle return from Stripe onboarding
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

    // Get the account status from Stripe
    const account = await stripe.accounts.retrieve(restaurant[0].stripe_account_id)

    const onboardingComplete = account.details_submitted || false
    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false

    // Update database with latest status
    await sql`
      UPDATE restaurants SET
        stripe_onboarding_complete = ${onboardingComplete},
        stripe_charges_enabled = ${chargesEnabled},
        stripe_payouts_enabled = ${payoutsEnabled},
        stripe_connected_at = ${onboardingComplete ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${restaurantId}
    `

    // Redirect back to admin dashboard with success message
    const slug = restaurant[0].slug
    const status = onboardingComplete ? "success" : "incomplete"
    
    return NextResponse.redirect(
      new URL(`/${slug}/admin/dashboard?stripe=${status}`, request.url)
    )
  } catch (error) {
    logStripeError("Callback", error)
    return NextResponse.redirect(new URL("/admin/dashboard?error=stripe_callback_failed", request.url))
  }
}
