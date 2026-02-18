import type { Metadata } from "next"
import { getPlatformSettings } from "@/lib/db"
import Markdown from "react-markdown"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const platformSettings = await getPlatformSettings()
  const platformName = platformSettings.platform_name || "Restaurant Bestellsystem"

  return {
    title: `Technischer Betrieb - ${platformName}`,
    description: "Informationen zum technischen Betreiber des Bestellsystems",
  }
}

export default async function PlatformLegalPage() {
  const platformSettings = await getPlatformSettings()

  const platformName = platformSettings.platform_name || "Restaurant Bestellsystem"
  const platformLegalName = platformSettings.platform_legal_name || ""
  const platformLegalAddress = platformSettings.platform_legal_address || ""
  const platformLegalContact = platformSettings.platform_legal_contact || ""
  const platformTaxId = platformSettings.platform_tax_id || ""
  const platformImprint = platformSettings.platform_imprint || ""
  const platformPrivacyPolicy = platformSettings.platform_privacy_policy || ""
  const platformTermsOfService = platformSettings.platform_terms_of_service || ""

  const hasCompanyInfo = platformLegalName || platformLegalAddress || platformLegalContact || platformTaxId
  const hasImprint = !!platformImprint
  const hasPrivacy = !!platformPrivacyPolicy
  const hasTerms = !!platformTermsOfService

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Technischer Betrieb - {platformName}</h1>

        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Diese Seite enthält Informationen zum technischen Betreiber des Restaurant-Bestellsystems.
            <br />
            Die einzelnen Restaurants sind nicht verantwortlich für diese Angaben.
          </p>
        </div>

        {/* Company Info Section */}
        {hasCompanyInfo && (
          <section className="mb-12 pb-8 border-b">
            <h2 className="text-2xl font-bold mb-6">Plattformbetreiber</h2>
            <div className="bg-white rounded-lg border p-6 space-y-4">
              {platformLegalName && (
                <div>
                  <p className="font-semibold text-lg">{platformLegalName}</p>
                </div>
              )}
              {platformLegalAddress && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Adresse</p>
                  <p className="whitespace-pre-line">{platformLegalAddress}</p>
                </div>
              )}
              {platformLegalContact && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kontakt</p>
                  <p className="whitespace-pre-line">{platformLegalContact}</p>
                </div>
              )}
              {platformTaxId && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Steuernummer / USt-IdNr.</p>
                  <p>{platformTaxId}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Platform Impressum */}
        {hasImprint && (
          <section className="mb-12 pb-8 border-b">
            <h2 className="text-2xl font-bold mb-6">Impressum des Betreibers</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="prose prose-sm max-w-none">
                <Markdown>{platformImprint}</Markdown>
              </div>
            </div>
          </section>
        )}

        {/* Platform Privacy Policy */}
        {hasPrivacy && (
          <section className="mb-12 pb-8 border-b">
            <h2 className="text-2xl font-bold mb-6">Datenschutzerklärung des Betreibers</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="prose prose-sm max-w-none">
                <Markdown>{platformPrivacyPolicy}</Markdown>
              </div>
            </div>
          </section>
        )}

        {/* Platform Terms of Service */}
        {hasTerms && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Nutzungsbedingungen</h2>
            <div className="bg-white rounded-lg border p-6">
              <div className="prose prose-sm max-w-none">
                <Markdown>{platformTermsOfService}</Markdown>
              </div>
            </div>
          </section>
        )}

        {/* Fallback if nothing is configured */}
        {!hasCompanyInfo && !hasImprint && !hasPrivacy && !hasTerms && (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            <p>Die rechtlichen Informationen zum Plattformbetreiber wurden noch nicht konfiguriert.</p>
          </div>
        )}
      </div>
    </div>
  )
}
