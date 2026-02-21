"use server"

import { sql } from "@/lib/db"
import { verifyPassword, setRestaurantAdminSession } from "@/lib/auth"

export async function loginRestaurantAdminCentral(username: string, password: string) {
  console.log("[v0] Central Login - Starting for username:", username)
  
  try {
    // Find restaurant by admin_username
    const result = await sql`
      SELECT id, admin_password_hash, slug, name, admin_username
      FROM restaurants 
      WHERE admin_username = ${username}
      LIMIT 1
    `
    
    if (result.length === 0) {
      console.log("[v0] Central Login - No restaurant found with username:", username)
      return { success: false, error: "Ungültiger Benutzername oder Passwort" }
    }

    const restaurant = result[0]
    console.log("[v0] Central Login - Found restaurant:", restaurant.name, "ID:", restaurant.id)

    if (!restaurant.admin_password_hash) {
      console.log("[v0] Central Login - No password hash set for restaurant")
      return { success: false, error: "Kein Passwort für dieses Restaurant gesetzt" }
    }

    // Verify password
    console.log("[v0] Central Login - Verifying password...")
    const isValid = await verifyPassword(password, restaurant.admin_password_hash)
    
    if (!isValid) {
      console.log("[v0] Central Login - Invalid password")
      return { success: false, error: "Ungültiger Benutzername oder Passwort" }
    }

    console.log("[v0] Central Login - Password valid, setting session...")
    
    // Set admin session
    await setRestaurantAdminSession(restaurant.id)
    
    console.log("[v0] Central Login - Session set, returning redirect URL")
    
    // Return redirect URL for client-side navigation
    return { 
      success: true, 
      redirectUrl: `/${restaurant.slug}/admin/dashboard`
    }
  } catch (error) {
    console.error("[v0] Central Login - Error:", error)
    return { 
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." 
    }
  }
}
