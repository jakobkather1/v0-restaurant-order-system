import "server-only"
import { sql } from "@/lib/db"
import crypto from "crypto"

const CONSENT_SECRET = process.env.CONSENT_SECRET || "default-secret-change-in-production"

export interface CookieConsent {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
  [key: string]: boolean
}

export interface ConsentData {
  version: string
  consent: CookieConsent
  timestamp: number
  sessionId: string
  expiresAt: number
}

/**
 * Generiert eine HMAC-Signatur für Consent-Daten zur Tamper-Detection
 */
export function signConsent(data: ConsentData): string {
  const payload = JSON.stringify({
    consent: data.consent,
    timestamp: data.timestamp,
    sessionId: data.sessionId,
    version: data.version,
  })
  
  return crypto
    .createHmac("sha256", CONSENT_SECRET)
    .update(payload)
    .digest("hex")
}

/**
 * Verifiziert die HMAC-Signatur von Consent-Daten
 */
export function verifyConsentSignature(data: ConsentData, signature: string): boolean {
  const expectedSignature = signConsent(data)
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  )
}

/**
 * Generiert eine eindeutige Session-ID für anonymes Tracking
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Helper function to detect transient errors
function isTransientError(error: unknown): boolean {
  const message = (error as Error)?.message || ""
  return (
    message.includes("Too Many") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("timeout") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("network")
  )
}

// Retry helper for database calls
async function withRetry<T>(
  fn: () => Promise<T>,
  fallback: T,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If it's a transient error and we have retries left, wait and try again
      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = 500 * Math.pow(2, attempt) // 500ms, 1000ms
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Otherwise return fallback
      break
    }
  }

  console.error("[v0] Failed after retries:", lastError)
  return fallback
}

/**
 * Speichert Consent in der Audit-Log-Datenbank
 */
export async function logConsent(
  sessionId: string,
  ipAddress: string | null,
  userAgent: string | null,
  consent: CookieConsent,
  action: "accept_all" | "reject_all" | "custom" | "revoke"
): Promise<{ success: boolean; signature: string; expiresAt: number }> {
  const timestamp = Date.now()
  const expiresAt = timestamp + 365 * 24 * 60 * 60 * 1000 // 12 Monate
  
  const consentData: ConsentData = {
    version: "1",
    consent,
    timestamp,
    sessionId,
    expiresAt,
  }
  
  const signature = signConsent(consentData)
  
  return withRetry(
    async () => {
      // Speichere in DB - stringify consent für SQL übergabe
      const consentJson = JSON.stringify(consent)
      
      await sql`
        SELECT log_consent(
          ${sessionId},
          ${ipAddress || '0.0.0.0'}::inet,
          ${userAgent || ''}::text,
          ${consentJson}::jsonb,
          ${action},
          ${signature}
        )
      `
      
      return { success: true, signature, expiresAt }
    },
    { success: false, signature: "", expiresAt }
  )
}

/**
 * Validiert Consent serverseitig anhand der Signatur und DB
 */
export async function validateConsent(
  sessionId: string,
  signature: string
): Promise<{ isValid: boolean; needsReconsent: boolean }> {
  return withRetry(
    async () => {
      const result = await sql`
        SELECT validate_consent(${sessionId}, ${signature}) AS is_valid
      `
      
      if (!result || result.length === 0) {
        return { isValid: false, needsReconsent: true }
      }
      
      const isValid = result[0].is_valid
      
      // Prüfe, ob Consent abgelaufen ist (wird von DB-Funktion bereits geprüft)
      return { isValid, needsReconsent: !isValid }
    },
    { isValid: false, needsReconsent: true }
  )
}

/**
 * Widerruft alle Consents für eine Session
 */
export async function revokeConsent(sessionId: string): Promise<boolean> {
  return withRetry(
    async () => {
      await sql`SELECT revoke_consent(${sessionId})`
      return true
    },
    false
  )
}

/**
 * Prüft, ob Consent abgelaufen ist (12 Monate)
 */
export function isConsentExpired(timestamp: number): boolean {
  const now = Date.now()
  const twelveMonthsInMs = 365 * 24 * 60 * 60 * 1000
  return now - timestamp > twelveMonthsInMs
}

/**
 * Alias for logConsent - logs consent changes to audit database
 * @deprecated Use logConsent instead
 */
export const logConsentChange = logConsent
