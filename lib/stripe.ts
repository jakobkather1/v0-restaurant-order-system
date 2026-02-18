import "server-only"
import Stripe from "stripe"

// Validate Stripe credentials on module load
// Trim the key to avoid whitespace issues
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim()

/**
 * Check if a Stripe key has a valid prefix
 * Accepts both Secret Keys (sk_) and Restricted Keys (rk_)
 */
function isValidStripeKeyPrefix(key: string): boolean {
  return key.startsWith("sk_") || key.startsWith("rk_")
}

if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_DIAGNOSTIC: STRIPE_SECRET_KEY is not set")
} else if (!isValidStripeKeyPrefix(STRIPE_SECRET_KEY)) {
  console.error(
    "STRIPE_DIAGNOSTIC: STRIPE_SECRET_KEY is invalid - must start with 'sk_' (Secret Key) or 'rk_' (Restricted Key)"
  )
}

/**
 * Check if Stripe is properly configured
 * Accepts both Secret Keys (sk_) and Restricted Keys (rk_)
 */
export function isStripeConfigured(): boolean {
  return !!(STRIPE_SECRET_KEY && isValidStripeKeyPrefix(STRIPE_SECRET_KEY))
}

/**
 * Check if we are using live mode keys
 * Returns true for sk_live_* or rk_live_*, false for sk_test_* or rk_test_*
 */
export function isStripeLiveMode(): boolean {
  if (!STRIPE_SECRET_KEY) return false
  return STRIPE_SECRET_KEY.includes("_live_")
}

/**
 * Get current Stripe mode as string for logging/display
 */
export function getStripeMode(): "live" | "test" | "unknown" {
  if (!STRIPE_SECRET_KEY) return "unknown"
  if (STRIPE_SECRET_KEY.includes("_live_")) return "live"
  if (STRIPE_SECRET_KEY.includes("_test_")) return "test"
  return "unknown"
}

/**
 * Singleton Stripe client with timeout and no retries for fast failures
 */
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) {
    return null
  }

  if (!stripeInstance) {
    try {
      stripeInstance = new Stripe(STRIPE_SECRET_KEY!, {
        apiVersion: "2025-05-28.basil",
        timeout: 5000, // 5 second timeout
        maxNetworkRetries: 0, // No retries - fail fast
      })
    } catch (error) {
      console.error("STRIPE_DIAGNOSTIC: Failed to initialize Stripe client", {
        message: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  return stripeInstance
}

/**
 * Log detailed Stripe error for diagnostics
 * Safely handles non-JSON responses like rate limit errors
 */
export function logStripeError(context: string, error: unknown): void {
  try {
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`STRIPE_DIAGNOSTIC [${context}]:`, {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
      })
    } else if (error instanceof Error) {
      console.error(`STRIPE_DIAGNOSTIC [${context}]:`, {
        message: error.message,
        name: error.name,
      })
    } else if (typeof error === 'string') {
      // Handle plain text error messages (e.g., "Too Many Requests")
      console.error(`STRIPE_DIAGNOSTIC [${context}]:`, error)
    } else {
      console.error(`STRIPE_DIAGNOSTIC [${context}]:`, String(error))
    }
  } catch (loggingError) {
    // If logging itself fails, output a safe fallback
    console.error(`STRIPE_DIAGNOSTIC [${context}]: Error occurred but couldn't be logged safely`)
  }
}

export { Stripe }
