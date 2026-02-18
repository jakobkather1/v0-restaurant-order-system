import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed, Database } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-24 w-24 rounded-full bg-sky-100 flex items-center justify-center mx-auto">
          <UtensilsCrossed className="h-12 w-12 text-sky-700" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Not Found</h1>
          <p className="text-muted-foreground">
            The restaurant you&apos;re looking for doesn&apos;t exist or the database hasn&apos;t been set up yet.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <Database className="h-4 w-4" />
            First time setup?
          </div>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>
              Run <code className="bg-amber-100 px-1 rounded">scripts/001-create-tables.sql</code>
            </li>
            <li>
              Go to <code className="bg-amber-100 px-1 rounded">/super-admin</code> to create a restaurant
            </li>
            <li>
              Access your restaurant at <code className="bg-amber-100 px-1 rounded">/[slug]</code>
            </li>
          </ol>
        </div>

        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  )
}
