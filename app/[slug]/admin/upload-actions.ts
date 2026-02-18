"use server"

import { put } from "@vercel/blob"
import { getRestaurantAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function uploadRestaurantImage(formData: FormData) {
  const session = await getRestaurantAdminSession()
  
  if (!session) {
    return { error: "Nicht autorisiert" }
  }

  const imageType = formData.get("imageType") as string
  const file = formData.get("file") as File

  if (!file || !imageType) {
    return { error: "Datei und Bildtyp erforderlich" }
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "Nur Bilddateien sind erlaubt" }
  }

  // Validate file size (max 4.5MB for server upload)
  if (file.size > 4.5 * 1024 * 1024) {
    return { error: "Datei zu groß. Maximal 4.5MB erlaubt." }
  }

  try {
    const blob = await put(`${session.restaurantId}/${imageType}-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: "public",
    })

    if (imageType === "logo") {
      await sql`
        UPDATE restaurants 
        SET logo_url = ${blob.url}, updated_at = NOW()
        WHERE id = ${session.restaurantId}
      `
    } else {
      await sql`
        UPDATE restaurants 
        SET hero_image_url = ${blob.url}, updated_at = NOW()
        WHERE id = ${session.restaurantId}
      `
    }

    // Get restaurant slug for revalidation
    const restaurantResult = await sql`SELECT slug FROM restaurants WHERE id = ${session.restaurantId}`
    const slug = restaurantResult[0]?.slug

    // Revalidate all paths to show updated images immediately
    if (slug) {
      revalidatePath(`/${slug}`, "page")
      revalidatePath(`/${slug}`, "layout")
      revalidatePath(`/${slug}/admin/dashboard`, "page")
      revalidatePath("/", "layout")
    }

    console.log(`[v0] Image uploaded successfully: ${blob.url}`)
    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { error: "Fehler beim Hochladen des Bildes" }
  }
}
