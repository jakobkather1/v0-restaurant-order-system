import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getStripe, logStripeError, Stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

interface CancelRequest {
  reason?: string
  refundAmount?: number // Optional: for partial refunds (in cents)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  console.log("CANCEL-API: Request started")
  
  try {
    const { orderId } = await params
    console.log("CANCEL-API: Order ID:", orderId)
    
    const body: CancelRequest = await request.json()
    console.log("CANCEL-API: Request body:", body)

    // Fetch order details with created_at for monthly revenue calculation
    console.log("CANCEL-API: Fetching order details...")
    const orderResult = await sql`
      SELECT 
        id,
        restaurant_id,
        total,
        stripe_payment_intent_id,
        refund_status,
        refund_amount,
        is_cancelled,
        customer_name,
        created_at
      FROM orders 
      WHERE id = ${orderId}
    `
    
    console.log("CANCEL-API: Order query result:", orderResult.length, "rows")

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })
    }

    const order = orderResult[0]

    // Check if already cancelled
    if (order.is_cancelled) {
      return NextResponse.json({ error: "Bestellung bereits storniert" }, { status: 400 })
    }

    const orderTotal = Number(order.total)
    const alreadyRefunded = Number(order.refund_amount || 0)
    const remainingAmount = orderTotal - alreadyRefunded

    // Determine refund amount (default to full remaining amount)
    const refundAmount = body.refundAmount 
      ? Math.min(body.refundAmount / 100, remainingAmount) // Convert cents to euros
      : remainingAmount

    if (refundAmount <= 0) {
      return NextResponse.json({ error: "Kein Rückerstattungsbetrag verfügbar" }, { status: 400 })
    }

    if (refundAmount > remainingAmount) {
      return NextResponse.json({ 
        error: `Rückerstattung überschreitet verfügbaren Betrag (${remainingAmount.toFixed(2)}€)` 
      }, { status: 400 })
    }

    let stripeRefundId: string | null = null
    let stripeRefundStatus = "succeeded"

    // Process Stripe refund if payment was made online
    if (order.stripe_payment_intent_id) {
      console.log("CANCEL-API: Processing Stripe refund...")
      
      const stripe = getStripe()
      if (!stripe) {
        console.error("CANCEL-API: Stripe not configured")
        return NextResponse.json({ 
          error: "Stripe nicht konfiguriert - Online-Zahlungen können nicht zurückerstattet werden" 
        }, { status: 503 })
      }

      try {
        // Convert euros to cents for Stripe
        const refundAmountCents = Math.round(refundAmount * 100)

        console.log("CANCEL-API: Creating Stripe refund:", {
          payment_intent: order.stripe_payment_intent_id,
          amount: refundAmountCents,
          euros: refundAmount,
          reason: body.reason || "requested_by_customer",
        })

        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: (body.reason as any) || "requested_by_customer",
          metadata: {
            order_id: orderId.toString(),
            restaurant_id: order.restaurant_id.toString(),
            customer_name: order.customer_name,
          },
        })

        stripeRefundId = refund.id
        stripeRefundStatus = refund.status

        console.log("[v0] Stripe refund created:", {
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
        })
      } catch (error) {
        logStripeError("Refund Creation", error)
        
        if (error instanceof Stripe.errors.StripeInvalidRequestError) {
          return NextResponse.json({ 
            error: `Stripe-Rückerstattung fehlgeschlagen: ${error.message}` 
          }, { status: 400 })
        }

        return NextResponse.json({ 
          error: "Rückerstattung fehlgeschlagen - Bitte später erneut versuchen" 
        }, { status: 500 })
      }
    }

    // Calculate new refund totals
    const newRefundTotal = alreadyRefunded + refundAmount
    const isFullRefund = newRefundTotal >= orderTotal - 0.01 // Account for rounding

    // Update order status and move to archive
    console.log("[v0] Moving order to archive:", {
      orderId,
      is_cancelled: true,
      is_completed: true,
      refund_status: isFullRefund ? "full" : "partial",
      refund_amount: newRefundTotal
    })
    
    await sql`
      UPDATE orders SET
        is_cancelled = true,
        is_completed = true,
        cancelled_at = NOW(),
        refund_status = ${isFullRefund ? "full" : "partial"},
        refund_amount = ${newRefundTotal},
        refund_reason = ${body.reason || "Stornierung durch Restaurant"},
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = ${orderId}
    `
    
    console.log("CANCEL-API: Order successfully moved to archive")

    // Log refund in history table (optional - don't fail if table doesn't exist)
    try {
      await sql`
        INSERT INTO order_refunds (
          order_id,
          refund_amount,
          refund_reason,
          stripe_refund_id,
          created_by
        ) VALUES (
          ${orderId},
          ${refundAmount},
          ${body.reason || "Stornierung durch Restaurant"},
          ${stripeRefundId},
          'admin'
        )
      `
      console.log("CANCEL-API: Refund logged in history table")
    } catch (refundLogError) {
      console.warn("CANCEL-API: Could not log refund (table may not exist):", refundLogError)
      // Don't fail cancellation if logging fails
    }

    // Update monthly revenue statistics - subtract refunded amount in real-time
    try {
      const orderDate = new Date(order.created_at)
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-01`
      
      console.log("[v0] Updating monthly revenue for month:", orderMonth, "subtracting:", refundAmount)
      
      await sql`
        UPDATE monthly_revenue SET
          total_revenue = GREATEST(0, total_revenue - ${refundAmount})
        WHERE restaurant_id = ${order.restaurant_id}
        AND month = ${orderMonth}
      `
      
      console.log("[v0] Monthly revenue updated successfully")
    } catch (revenueError) {
      console.error("[v0] Error updating monthly revenue:", revenueError)
      // Don't fail the cancellation if revenue update fails
      // The refund was successful, which is the most critical part
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      stripeRefundId,
      stripeRefundStatus,
      isFullRefund,
      message: isFullRefund 
        ? `Bestellung vollständig storniert. Rückerstattung: ${refundAmount.toFixed(2)}€`
        : `Teilrückerstattung erfolgreich: ${refundAmount.toFixed(2)}€`,
    })
  } catch (error) {
    console.error("CANCEL-API: CRITICAL ERROR:", error)
    console.error("CANCEL-API: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json({ 
      error: "Fehler beim Stornieren der Bestellung",
      details: errorMessage 
    }, { status: 500 })
  }
}
