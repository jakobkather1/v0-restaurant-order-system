import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log("[v0] VAPID Validator: Starting validation...")
  
  // Read all VAPID-related environment variables - ONLY NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const envVars = {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_EMAIL: process.env.VAPID_EMAIL,
  }

  console.log("[v0] VAPID Validator: Environment variables status:")
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? `SET (${value.length} chars)` : 'NOT SET'}`)
  })

  // Validation results
  const results = {
    allVarsPresent: false,
    publicKey: {
      exists: false,
      length: 0,
      valid: false,
      error: null as string | null
    },
    privateKey: {
      exists: false,
      length: 0,
      valid: false,
      error: null as string | null
    },
    email: {
      exists: false,
      valid: false,
      value: null as string | null,
      error: null as string | null
    },
    recommendation: ""
  }

  // Validate public key - ONLY use NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const publicKey = envVars.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (publicKey) {
    results.publicKey.exists = true
    results.publicKey.length = publicKey.length
    
    if (publicKey.length < 80) {
      results.publicKey.error = `Too short (${publicKey.length} chars, expected ~87 chars for base64url)`
    } else if (publicKey.length > 100) {
      results.publicKey.error = `Too long (${publicKey.length} chars, expected ~87 chars)`
    } else {
      results.publicKey.valid = true
    }
  } else {
    results.publicKey.error = "NEXT_PUBLIC_VAPID_PUBLIC_KEY not set in environment"
  }

  // Validate private key
  const privateKey = envVars.VAPID_PRIVATE_KEY
  if (privateKey) {
    results.privateKey.exists = true
    results.privateKey.length = privateKey.length
    
    if (privateKey.length < 40) {
      results.privateKey.error = `Too short (${privateKey.length} chars, expected ~43 chars for base64url)`
    } else if (privateKey.length > 50) {
      results.privateKey.error = `Too long (${privateKey.length} chars, expected ~43 chars)`
    } else {
      results.privateKey.valid = true
    }
  } else {
    results.privateKey.error = "VAPID_PRIVATE_KEY not set in environment"
  }

  // Validate email
  const email = envVars.VAPID_EMAIL
  if (email) {
    results.email.exists = true
    results.email.value = email
    
    if (!email.includes("@")) {
      results.email.error = "Not a valid email address"
    } else {
      results.email.valid = true
    }
  } else {
    results.email.error = "VAPID_EMAIL not set in environment"
  }

  // Overall status
  results.allVarsPresent = results.publicKey.valid && results.privateKey.valid && results.email.valid

  // Recommendation
  if (results.allVarsPresent) {
    results.recommendation = "✓ All VAPID keys are correctly configured"
  } else {
    const missing = []
    if (!results.publicKey.valid) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    if (!results.privateKey.valid) missing.push("VAPID_PRIVATE_KEY")
    if (!results.email.valid) missing.push("VAPID_EMAIL")
    
    results.recommendation = `Missing or invalid: ${missing.join(", ")}. Generate new VAPID keys using: node scripts/generate-vapid-keys.js`
  }

  console.log("[v0] VAPID Validator: Overall valid:", results.allVarsPresent)

  return NextResponse.json(results)
}
