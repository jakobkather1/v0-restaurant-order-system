import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  textColor?: string
}

export function Breadcrumb({ items, textColor = "#6b7280" }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
      <ol className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap">
        <li className="flex items-center gap-1.5 sm:gap-2">
          <Link 
            href="/" 
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: textColor }}
          >
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
          {items.length > 0 && (
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: textColor, opacity: 0.5 }} />
          )}
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5 sm:gap-2">
            {item.href && index < items.length - 1 ? (
              <>
                <Link 
                  href={item.href} 
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: textColor }}
                >
                  {item.label}
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: textColor, opacity: 0.5 }} />
              </>
            ) : (
              <span 
                className="font-medium" 
                style={{ color: textColor }}
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
