import { neon } from "@neondatabase/serverless"

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error("[v0] DATABASE_URL not set")
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log("[v0] Running migration: Adding permission fields to restaurants table...")

    const result = await sql`
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_edit_menu BOOLEAN DEFAULT TRUE;
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_edit_settings BOOLEAN DEFAULT TRUE;
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT TRUE;
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS can_manage_orders BOOLEAN DEFAULT TRUE;
    `

    console.log("[v0] ✅ Migration completed successfully!")
    console.log("[v0] Added permission fields to restaurants table")
    console.log("[v0] Default: All permissions set to TRUE (Super-Admin can see analytics/revenue)")

    process.exit(0)
  } catch (error) {
    console.error("[v0] ❌ Migration failed:", (error as Error)?.message)
    process.exit(1)
  }
}

runMigration()
