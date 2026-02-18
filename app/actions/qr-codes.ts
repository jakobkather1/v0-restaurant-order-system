'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface QRCode {
  id: number
  restaurant_id: number
  url: string
  label: string
  created_at: string
}

export async function getQRCodes(restaurantId: number): Promise<QRCode[]> {
  const result = await sql`
    SELECT * FROM qr_codes 
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at ASC
  `
  return result.rows as QRCode[]
}

export async function createQRCode(
  restaurantId: number,
  url: string,
  label: string
): Promise<{ success: boolean; error?: string; qrCode?: QRCode }> {
  try {
    // Check if restaurant already has 3 QR codes
    const countResult = await sql`
      SELECT COUNT(*) as count FROM qr_codes 
      WHERE restaurant_id = ${restaurantId}
    `
    const count = parseInt(countResult.rows[0].count)
    
    if (count >= 3) {
      return { success: false, error: 'Maximale Anzahl von 3 QR-Codes erreicht' }
    }

    // Validate URL
    if (!url || url.trim().length === 0) {
      return { success: false, error: 'URL ist erforderlich' }
    }

    // Validate label
    if (!label || label.trim().length === 0) {
      return { success: false, error: 'Bezeichnung ist erforderlich' }
    }

    const result = await sql`
      INSERT INTO qr_codes (restaurant_id, url, label)
      VALUES (${restaurantId}, ${url.trim()}, ${label.trim()})
      RETURNING *
    `

    revalidatePath('/[slug]/admin')
    
    return { success: true, qrCode: result.rows[0] as QRCode }
  } catch (error) {
    console.error('Error creating QR code:', error)
    return { success: false, error: 'Fehler beim Erstellen des QR-Codes' }
  }
}

export async function deleteQRCode(
  qrCodeId: number,
  restaurantId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      DELETE FROM qr_codes 
      WHERE id = ${qrCodeId} AND restaurant_id = ${restaurantId}
    `

    revalidatePath('/[slug]/admin')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting QR code:', error)
    return { success: false, error: 'Fehler beim Löschen des QR-Codes' }
  }
}

export async function updateQRCode(
  qrCodeId: number,
  restaurantId: number,
  url: string,
  label: string
): Promise<{ success: boolean; error?: string; qrCode?: QRCode }> {
  try {
    // Validate URL
    if (!url || url.trim().length === 0) {
      return { success: false, error: 'URL ist erforderlich' }
    }

    // Validate label
    if (!label || label.trim().length === 0) {
      return { success: false, error: 'Bezeichnung ist erforderlich' }
    }

    const result = await sql`
      UPDATE qr_codes 
      SET url = ${url.trim()}, label = ${label.trim()}
      WHERE id = ${qrCodeId} AND restaurant_id = ${restaurantId}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return { success: false, error: 'QR-Code nicht gefunden' }
    }

    revalidatePath('/[slug]/admin')
    
    return { success: true, qrCode: result.rows[0] as QRCode }
  } catch (error) {
    console.error('Error updating QR code:', error)
    return { success: false, error: 'Fehler beim Aktualisieren des QR-Codes' }
  }
}
