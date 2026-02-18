import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { validateConsent, logConsentChange } from "@/lib/consent-validation"
import type { NextRequest } from "next/server"
import crypto from "crypto"

// Get current consent status
export async function GET(request: NextRequest) {
  const consentCookie = request.cookies.get("cookie_consent")
  
  if (!consentCookie) {
    return NextResponse.json({ hasConsent: false })
  }

  try {
    const consent = JSON.parse(consentCookie.value)
    
    // Validate consent if signature exists
    if (consent.signature && consent.sessionId) {
      const validation = await validateConsent(consent.sessionId, consent.signature)
      
      if (!validation.isValid) {
        // Invalid or expired consent - clear it
        const response = NextResponse.json({ hasConsent: false, reason: "expired_or_invalid" })
        response.cookies.delete("cookie_consent")
        return response
      }
    }

    return NextResponse.json({ 
      hasConsent: true, 
      consent: consent.preferences,
      grantedAt: consent.timestamp 
    })
  } catch (error) {
    console.error("[v0] Error parsing consent cookie:", error)
    const response = NextResponse.json({ hasConsent: false, reason: "parse_error" })
    response.cookies.delete("cookie_consent")
    return response
  }
}

// Save consent preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preferences, ip, userAgent } = body

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 })
    }

    // Generate session ID if not exists
    const sessionId = request.cookies.get("session_id")?.value || crypto.randomUUID()
    
    // Determine action type
    const allTrue = Object.values(preferences).every(v => v === true)
    const allFalse = Object.values(preferences).every((v, i) => i === 0 ? true : v === false) // except necessary
    const action = allTrue ? "accept_all" : allFalse ? "reject_all" : "custom"
    
    // Log to audit table with correct signature
    const result = await logConsentChange(
      sessionId,
      ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent || request.headers.get("user-agent"),
      preferences,
      action
    )
    
    // Create signed consent object for cookie
    const signedConsent = {
      version: "1",
      preferences,
      timestamp: Date.now(),
      sessionId,
      signature: result.signature,
      expiresAt: result.expiresAt
    }

    // Set cookie with proper security settings
    const response = NextResponse.json({ success: true })
    
    // Set session ID cookie if new
    if (!request.cookies.get("session_id")) {
      response.cookies.set("session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }
    
    // Set consent cookie
    response.cookies.set("cookie_consent", JSON.stringify(signedConsent), {
      httpOnly: false, // Must be readable by client for analytics
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (error) {
    console.error("[v0] Error saving consent:", error)
    return NextResponse.json({ error: "Failed to save consent" }, { status: 500 })
  }
}

// Revoke consent
export async function DELETE(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value || crypto.randomUUID()
  
  const response = NextResponse.json({ success: true })
  response.cookies.delete("cookie_consent")
  
  // Log revocation with correct signature
  await logConsentChange(
    sessionId,
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    request.headers.get("user-agent"),
    { necessary: true, functional: false, analytics: false, marketing: false },
    "revoke"
  )
  
  return response
}
