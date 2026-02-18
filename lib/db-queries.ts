import "server-only"

import { sql } from "./db"

/**
 * Database Query Helpers using PostgreSQL Functions (RPC)
 * 
 * These functions use PostgreSQL stored procedures for better security and performance.
 * Benefits:
 * - SQL injection protection
 * - Query plan caching
 * - Reduced network overhead
 * - Centralized business logic
 */

// ============================================================================
// Restaurant Queries
// ============================================================================

export async function getRestaurantBySlug(slug: string) {
  const result = await sql`SELECT * FROM get_restaurant_by_slug(${slug})`
  return result[0] || null
}

export async function getRestaurantById(restaurantId: number) {
  const result = await sql`SELECT * FROM get_restaurant_by_id(${restaurantId})`
  return result[0] || null
}

// ============================================================================
// Menu Queries
// ============================================================================

export async function getMenuItems(restaurantId: number) {
  return await sql`SELECT * FROM get_menu_items(${restaurantId})`
}

export async function getMenuItemBySlug(restaurantId: number, dishSlug: string) {
  const result = await sql`SELECT * FROM get_menu_item_by_slug(${restaurantId}, ${dishSlug})`
  return result[0] || null
}

export async function getMenuItemById(itemId: number) {
  const result = await sql`SELECT * FROM get_menu_item_by_id(${itemId})`
  return result[0] || null
}

// ============================================================================
// Category Queries
// ============================================================================

export async function getCategories(restaurantId: number) {
  return await sql`SELECT * FROM get_categories(${restaurantId})`
}

export async function getCategoryBySlug(restaurantId: number, categorySlug: string) {
  const result = await sql`SELECT * FROM get_category_by_slug(${restaurantId}, ${categorySlug})`
  return result[0] || null
}

export async function getCategoryById(categoryId: number) {
  const result = await sql`SELECT * FROM get_category_by_id(${categoryId})`
  return result[0] || null
}

// ============================================================================
// Delivery Zone Queries
// ============================================================================

export async function getDeliveryZones(restaurantId: number) {
  return await sql`SELECT * FROM get_delivery_zones(${restaurantId})`
}

export async function getDeliveryZoneBySlug(restaurantId: number, zoneSlug: string) {
  const result = await sql`SELECT * FROM get_delivery_zone_by_slug(${restaurantId}, ${zoneSlug})`
  return result[0] || null
}

// ============================================================================
// Order Queries
// ============================================================================

export async function getOrderById(orderId: string) {
  const result = await sql`SELECT * FROM get_order_by_id(${orderId})`
  return result[0] || null
}

export async function getOrderItems(orderId: string) {
  return await sql`SELECT * FROM get_order_items(${orderId})`
}

export async function getRestaurantOrders(restaurantId: number, limit = 50) {
  return await sql`SELECT * FROM get_restaurant_orders(${restaurantId}, ${limit})`
}

// ============================================================================
// Opening Hours Queries
// ============================================================================

export async function getOpeningHours(restaurantId: number) {
  return await sql`SELECT * FROM get_opening_hours(${restaurantId})`
}

export async function isRestaurantOpen(restaurantId: number) {
  const result = await sql`SELECT is_restaurant_open(${restaurantId}) as is_open`
  return result[0]?.is_open || false
}

// ============================================================================
// Review Queries
// ============================================================================

export async function getReviews(restaurantId: number, limit = 20) {
  return await sql`SELECT * FROM get_reviews(${restaurantId}, ${limit})`
}

export async function getAverageRating(restaurantId: number) {
  const result = await sql`SELECT get_average_rating(${restaurantId}) as avg_rating`
  return result[0]?.avg_rating || 0
}

// ============================================================================
// Statistics Queries
// ============================================================================

export async function getRestaurantStats(restaurantId: number, days = 30) {
  const result = await sql`SELECT * FROM get_restaurant_stats(${restaurantId}, ${days})`
  return result[0] || null
}
