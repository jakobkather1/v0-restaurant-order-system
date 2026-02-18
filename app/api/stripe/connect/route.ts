import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getStripe, isStripeConfigured, isStripeLiveMode, getStripeMode, logStripeError, Stripe } from "@/lib/stripe"

/**
 * List of blocked/invalid domains that Stripe rejects
 */
const BLOCKED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "example.com",
  "example.org",
  "test.com",
  "yourdomain.com",
]

/**
 * Validates and sanitizes a URL for Stripe Connect
 * Returns null if URL is invalid or uses a blocked domain
 */
function getValidStripeUrl(baseUrl: string | null | undefined, path?: string): string | null {
  if (!baseUrl) return null
  
  const cleanBase = baseUrl.trim().replace(/\/+$/, "")
  const cleanPath = (path || "").trim().replace(/^\/+/, "")
  
  if (!cleanBase) return null
  
  const fullUrl = cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase
  
  try {
    const urlObj = new URL(fullUrl)
    
    // Must be https (Stripe requires secure URLs for production)
    if (urlObj.protocol !== "https:") return null
    
    // Check against blocked domains
    const hostname = urlObj.hostname.toLowerCase()
    if (BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked))) {
      return null
    }
    
    // Ensure ASCII-only characters (percent-encode if needed)
    const asciiUrl = new URL(fullUrl).toString()
    
    // Final validation - only allow ASCII characters
    if (!/^[\x00-\x7F]*$/.test(asciiUrl)) {
      return null
    }
    
    return asciiUrl.replace(/\/+$/, "")
  } catch {
    return null
  }
}

/**
 * Gets a valid base URL for redirect callbacks (less strict than business URL)
 */
function getCallbackBaseUrl(request: NextRequest): string | null {
  const sources = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    request.headers.get("origin")?.trim(),
    request.headers.get("referer")?.trim(),
  ]
  
  for (const source of sources) {
    if (source) {
      try {
        const urlObj = new URL(source)
        if (["http:", "https:"].includes(urlObj.protocol)) {
          return urlObj.origin
        }
      } catch {
        continue
      }
    }
  }
  
  return null
}

// POST: Create a connected account and return onboarding link
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe integration not configured. Please check environment variables." },
        { status: 500 }
      )
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Failed to initialize Stripe client." },
        { status: 500 }
      )
    }

    const { restaurantId, restaurantName, restaurantSlug, email } = await request.json()

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    // Get callback base URL first - we need this for onboarding
    const callbackBaseUrl = getCallbackBaseUrl(request)
    if (!callbackBaseUrl) {
      return NextResponse.json(
        { error: "Could not determine callback URL. Please try again." },
        { status: 400 }
      )
    }

    // Check if restaurant already has a Stripe account
    const existingRestaurant = await sql`
      SELECT stripe_account_id, slug FROM restaurants WHERE id = ${restaurantId}
    `

    let accountId = existingRestaurant[0]?.stripe_account_id
    const slug = restaurantSlug || existingRestaurant[0]?.slug

    // Create a new connected account if one doesn't exist
    if (!accountId) {
      // Try to build a valid business URL - this is OPTIONAL for Stripe
      const businessUrl = getValidStripeUrl(callbackBaseUrl, slug || undefined)
      
      // Sanitize restaurant name - remove any special characters that might cause issues
      const cleanName = (restaurantName || "Restaurant").trim().substring(0, 100)

      // Build business_profile - only include URL if it's valid
      const businessProfile: Stripe.AccountCreateParams.BusinessProfile = {
        name: cleanName,
        mcc: "5812", // Restaurants
      }
      
      // Only add URL if we have a valid one (not localhost, example.com, etc.)
      if (businessUrl) {
        businessProfile.url = businessUrl
        businessProfile.product_description = `Online ordering for ${cleanName}`
      }

      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "DE",
          email: email?.trim() || undefined,
          business_type: "company",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: businessProfile,
        })

        accountId = account.id

        // Save the account ID to the database WITH the live mode flag
        // This ensures we don't mix test and live accounts
        const isLiveMode = isStripeLiveMode()
        await sql`
          UPDATE restaurants 
          SET 
            stripe_account_id = ${accountId}, 
            stripe_is_live_mode = ${isLiveMode},
            updated_at = NOW()
          WHERE id = ${restaurantId}
        `
      } catch (stripeError: unknown) {
        logStripeError("Account Creation", stripeError)
        const err = stripeError as Stripe.errors.StripeError
        
        return NextResponse.json(
          { 
            error: err.message || "Failed to create Stripe account",
            code: err.code,
          },
          { status: 400 }
        )
      }
    }

    // Create an account link for onboarding
    // Callback URLs can use localhost/preview URLs - they're less strict
    const refreshUrl = `${callbackBaseUrl}/api/stripe/connect/refresh?restaurantId=${restaurantId}`
    const returnUrl = `${callbackBaseUrl}/api/stripe/connect/callback?restaurantId=${restaurantId}`
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url, accountId })
  } catch (error) {
    console.error("Stripe Connect error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Stripe account" },
      { status: 500 }
    )
  }
}

// GET: Check the status of a connected account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    // SILENT GUARD: First check DB - don't call Stripe if no account exists
    const restaurant = await sql`
      SELECT stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, stripe_is_live_mode
      FROM restaurants WHERE id = ${restaurantId}
    `

    // If no stripe_account_id in DB, return immediately without calling Stripe
    if (!restaurant[0]?.stripe_account_id) {
      return NextResponse.json({ connected: false, onboardingComplete: false })
    }

    // ENVIRONMENT GUARD: Check if we're mixing live/test modes
    // If the current key is live but the stored account is test (or vice versa), clear it
    const currentIsLive = isStripeLiveMode()
    const storedIsLive = restaurant[0].stripe_is_live_mode
    
    if (storedIsLive !== null && storedIsLive !== currentIsLive) {
      console.error(`STRIPE_DIAGNOSTIC: Mode mismatch detected!`, {
        storedAccountMode: storedIsLive ? "live" : "test",
        currentKeyMode: currentIsLive ? "live" : "test",
        accountId: restaurant[0].stripe_account_id,
        message: "Clearing mismatched account. User must reconnect with matching mode."
      })
      
      // Clear the mismatched account
      await sql`
        UPDATE restaurants SET
          stripe_account_id = NULL,
          stripe_onboarding_complete = false,
          stripe_charges_enabled = false,
          stripe_payouts_enabled = false,
          stripe_connected_at = NULL,
          stripe_is_live_mode = NULL,
          updated_at = NOW()
        WHERE id = ${restaurantId}
      `
      
      return NextResponse.json({ 
        connected: false,
        onboardingComplete: false,
        error: `Your Stripe account was created in ${storedIsLive ? "live" : "test"} mode, but you are now using ${currentIsLive ? "live" : "test"} keys. Please reconnect your Stripe account.`,
        needsReconnect: true,
        modeMismatch: true,
      })
    }

    // Check if Stripe is configured before making API call
    if (!isStripeConfigured()) {
      // Return cached DB values if Stripe is not configured
      return NextResponse.json({ 
        connected: true,
        onboardingComplete: restaurant[0].stripe_onboarding_complete || false,
        chargesEnabled: restaurant[0].stripe_charges_enabled || false,
        payoutsEnabled: restaurant[0].stripe_payouts_enabled || false,
        accountId: restaurant[0].stripe_account_id,
        fromCache: true,
      })
    }

    const stripe = getStripe()
    if (!stripe) {
      // Return cached DB values if Stripe client failed
      return NextResponse.json({ 
        connected: true,
        onboardingComplete: restaurant[0].stripe_onboarding_complete || false,
        chargesEnabled: restaurant[0].stripe_charges_enabled || false,
        payoutsEnabled: restaurant[0].stripe_payouts_enabled || false,
        accountId: restaurant[0].stripe_account_id,
        fromCache: true,
      })
    }

    // Get the latest status from Stripe
    let account
    try {
      account = await stripe.accounts.retrieve(restaurant[0].stripe_account_id)
    } catch (stripeError: unknown) {
      logStripeError("Status Check", stripeError)
      
      // Check if this is a 403 or account_invalid error - means the account doesn't exist
      // or is not accessible with the current API key (e.g., test account with live key)
      const err = stripeError as { code?: string; statusCode?: number; message?: string }
      const isInvalidAccount = 
        err.code === "account_invalid" || 
        err.statusCode === 403 ||
        err.message?.includes("does not have access to account")
      
      if (isInvalidAccount) {
        // Clear the invalid account from the database so user can reconnect
        await sql`
          UPDATE restaurants SET
            stripe_account_id = NULL,
            stripe_onboarding_complete = false,
            stripe_charges_enabled = false,
            stripe_payouts_enabled = false,
            stripe_connected_at = NULL,
            stripe_is_live_mode = NULL,
            updated_at = NOW()
          WHERE id = ${restaurantId}
        `
        
        // Return as not connected so user can set up a new account
        return NextResponse.json({ 
          connected: false,
          onboardingComplete: false,
          error: "Stripe account was disconnected or is no longer accessible. Please reconnect.",
          needsReconnect: true,
        })
      }
      
      // For other errors (network, rate limit), return cached DB values
      return NextResponse.json({ 
        connected: true,
        onboardingComplete: restaurant[0].stripe_onboarding_complete || false,
        chargesEnabled: restaurant[0].stripe_charges_enabled || false,
        payoutsEnabled: restaurant[0].stripe_payouts_enabled || false,
        accountId: restaurant[0].stripe_account_id,
        fromCache: true,
      })
    }

    const onboardingComplete = account.details_submitted || false
    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false

    // Update database with latest status (also update live mode flag if not set)
    const currentLiveMode = isStripeLiveMode()
    if (onboardingComplete) {
      await sql`
        UPDATE restaurants SET
          stripe_onboarding_complete = ${onboardingComplete},
          stripe_charges_enabled = ${chargesEnabled},
          stripe_payouts_enabled = ${payoutsEnabled},
          stripe_is_live_mode = ${currentLiveMode},
          stripe_connected_at = NOW(),
          updated_at = NOW()
        WHERE id = ${restaurantId}
      `
    } else {
      await sql`
        UPDATE restaurants SET
          stripe_onboarding_complete = ${onboardingComplete},
          stripe_charges_enabled = ${chargesEnabled},
          stripe_payouts_enabled = ${payoutsEnabled},
          stripe_is_live_mode = ${currentLiveMode},
          updated_at = NOW()
        WHERE id = ${restaurantId}
      `
    }

    return NextResponse.json({
      connected: true,
      accountId: restaurant[0].stripe_account_id,
      onboardingComplete,
      chargesEnabled,
      payoutsEnabled,
      dashboardUrl: account.details_submitted 
        ? `https://dashboard.stripe.com/${account.id}` 
        : null,
    })
  } catch (error) {
    // Safely handle rate limits and other non-JSON errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRateLimit = errorMessage.includes("Too Many Requests") || errorMessage.includes("429")
    
    if (isRateLimit) {
      console.error("STRIPE_DIAGNOSTIC [GET Handler]: Rate limit exceeded - using cached data")
      // Try to return cached DB values on rate limit
      try {
        const restaurant = await sql`
          SELECT stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled
          FROM restaurants WHERE id = ${new URL(request.url).searchParams.get("restaurantId")}
        `
        
        if (restaurant[0]?.stripe_account_id) {
          return NextResponse.json({
            connected: true,
            accountId: restaurant[0].stripe_account_id,
            onboardingComplete: restaurant[0].stripe_onboarding_complete || false,
            chargesEnabled: restaurant[0].stripe_charges_enabled || false,
            payoutsEnabled: restaurant[0].stripe_payouts_enabled || false,
            fromCache: true,
            rateLimited: true,
          })
        }
      } catch (dbError) {
        console.error("Failed to retrieve cached Stripe status:", dbError)
      }
    }
    
    logStripeError("GET Handler", error)
    // Return safe fallback - don't crash the page
    return NextResponse.json({ 
      connected: false, 
      onboardingComplete: false,
      error: isRateLimit ? "Rate limit exceeded - please try again in a moment" : "Failed to check status"
    })
  }
}
