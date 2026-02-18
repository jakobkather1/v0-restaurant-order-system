import { NextResponse } from "next/server"
import { getRestaurantByIdentifier, getMenuForRestaurant } from "@/lib/db"
import { getRestaurantAdminSession } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const restaurant = await getRestaurantByIdentifier(slug)

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const session = await getRestaurantAdminSession()
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const menu = await getMenuForRestaurant(restaurant.id)
    return NextResponse.json(menu)
  } catch (error) {
    const message = (error as Error)?.message || ""
    if (message.includes("Too Many") || message.includes("429")) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
