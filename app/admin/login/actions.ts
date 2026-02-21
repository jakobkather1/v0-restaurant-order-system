"use server"

import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { verifyPassword, setRestaurantAdminSession } from "@/lib/auth"

export async function loginRestaurantAdminCentral(username: string, password: string) {
  console.log("[v0] Central Login - Starting for username:", username)
  
  // Find restaurant by admin_username
  const result = await sql`
    SELECT id, admin_password_hash, slug, name, admin_username
    FROM restaurants 
    WHERE admin_username = ${username}
    LIMIT 1
  `
  
  if (result.length === 0) {
    console.log("[v0] Central Login - No restaurant found with username:", username)
    return { error: "Ungültiger Benutzername oder Passwort" }
  }

  const restaurant = result[0]
  console.log("[v0] Central Login - Found restaurant:", restaurant.name, "ID:", restaurant.id)

  if (!restaurant.admin_password_hash) {
    console.log("[v0] Central Login - No password hash set for restaurant")
    return { error: "Kein Passwort für dieses Restaurant gesetzt" }
  }

  // Verify password
  console.log("[v0] Central Login - Verifying password...")
  const isValid = await verifyPassword(password, restaurant.admin_password_hash)
  
  if (!isValid) {
    console.log("[v0] Central Login - Invalid password")
    return { error: "Ungültiger Benutzername oder Passwort" }
  }

  console.log("[v0] Central Login - Password valid, setting session...")
  
  // Set admin session
  await setRestaurantAdminSession(restaurant.id)
  
  console.log("[v0] Central Login - Session set, redirecting to dashboard")
  
  // Redirect directly to restaurant admin dashboard (server-side redirect)
  // Note: redirect() throws a NEXT_REDIRECT error which is expected
  redirect(`/${restaurant.slug}/admin/dashboard`)
}
