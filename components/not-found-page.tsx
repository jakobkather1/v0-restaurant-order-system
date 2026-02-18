import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Restaurant nicht gefunden</h2>
          <p className="text-muted-foreground">
            Das gesuchte Restaurant existiert nicht oder ist aktuell nicht verfügbar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/super-admin">
              <Search className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
