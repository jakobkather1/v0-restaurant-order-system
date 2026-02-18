import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRestaurantByIdentifier, getPlatformSettings } from "@/lib/db"
import Markdown from "react-markdown"

interface LegalPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const restaurant = await getRestaurantByIdentifier(decodedSlug)

  if (!restaurant) return {}

  return {
    title: `Rechtliches - ${restaurant.name}`,
    description: "Impressum und Datenschutzerklärung",
  }
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const [restaurant, platformSettings] = await Promise.all([getRestaurantByIdentifier(decodedSlug), getPlatformSettings()])

  if (!restaurant) {
    notFound()
  }

  const platformName = platformSettings.platform_name || "Restaurant Bestellsystem"

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold mb-8">Rechtliches</h1>

        {/* Impressum Section */}
        <section className="mb-12 pb-12 border-b">
          <h2 className="text-2xl font-bold mb-6">Impressum</h2>
          <div className="space-y-4 text-muted-foreground">
            {restaurant.legal_name && (
              <div>
                <strong>Betreiber:</strong> {restaurant.legal_name}
              </div>
            )}
            {restaurant.legal_address && (
              <div>
                <strong>Adresse:</strong>
                <p className="whitespace-pre-line">{restaurant.legal_address}</p>
              </div>
            )}
            {restaurant.legal_contact && (
              <div>
                <strong>Kontakt:</strong>
                <p className="whitespace-pre-line">{restaurant.legal_contact}</p>
              </div>
            )}
            {restaurant.tax_id && (
              <div>
                <strong>Steuernummer:</strong> {restaurant.tax_id}
              </div>
            )}
            {restaurant.legal_disclaimer && (
              <div>
                <strong>Haftungshinweis:</strong>
                <p className="whitespace-pre-line mt-2">{restaurant.legal_disclaimer}</p>
              </div>
            )}
          </div>
        </section>

        {/* Privacy Policy Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Datenschutzerklärung</h2>
          {restaurant.privacy_policy_content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Markdown>{restaurant.privacy_policy_content}</Markdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic">Keine Datenschutzerklärung hinterlegt.</p>
          )}
        </section>
      </div>
    </div>
  )
}
