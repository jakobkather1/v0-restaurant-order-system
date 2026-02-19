import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Hauptplattform-Domain
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "order-terminal.de"

// Vercel Deployment Domains (Previews sollten auch die Plattform sein)
const VERCEL_DEPLOYMENT_DOMAINS = [".vercel.app", ".vercel.dev", ".vusercontent.net", ".vercel.run"]

// Reserved paths that must always go to the main app (except /admin - that's restaurant-specific)
const RESERVED_PATHS = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/manifest.json",
  ".json",
  ".txt",
  ".xml",
  "/super-admin",
  "/platform-legal",
]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname } = request.nextUrl

  // Always skip reserved paths
  if (RESERVED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Extract hostname without port
  const hostWithoutPort = hostname.split(":")[0].toLowerCase()

  // Check if this is the main platform domain
  const isPlatformDomain =
    hostWithoutPort === PLATFORM_DOMAIN ||
    hostWithoutPort === `www.${PLATFORM_DOMAIN}`

  // Check if this is a Vercel deployment (include it in platform)
  const isVercelDomain = VERCEL_DEPLOYMENT_DOMAINS.some((domain) =>
    hostWithoutPort.includes(domain)
  )

  // Check if this is localhost (development)
  const isLocalhost = hostWithoutPort.startsWith("localhost")

  // If it's the main platform, localhost, or Vercel deployment domain, pass through normally
  // These should all use slug-based routing (/doctordoener, /bella-marina, etc.)
  if (isPlatformDomain || isLocalhost || isVercelDomain) {
    return NextResponse.next()
  }

  // Only non-Vercel custom domains get rewritten to tenant system
  // Clean the domain (remove www., normalize)
  const cleanDomain = hostWithoutPort.replace(/^www\./, "")

  console.log("[v0] Middleware - Custom domain detected")
  console.log("[v0] Middleware - Original hostname:", hostname)
  console.log("[v0] Middleware - Clean domain:", cleanDomain)
  console.log("[v0] Middleware - Original pathname:", pathname)
  console.log("[v0] Middleware - Rewriting to:", `/tenants/${cleanDomain}${pathname}`)

  // Rewrite to tenant route - keep the URL in the browser as-is
  const url = request.nextUrl.clone()
  url.pathname = `/tenants/${cleanDomain}${pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|public|favicon\\.ico).*)",
  ],
}
