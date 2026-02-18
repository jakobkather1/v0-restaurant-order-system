import type { Restaurant } from "@/lib/types"
import Image from "next/image"

interface TerminalHeroProps {
  restaurant: Restaurant
}

export function TerminalHero({ restaurant }: TerminalHeroProps) {
  const heroImageUrl = restaurant.hero_image_url

  return (
    <section className="relative">
      {heroImageUrl ? (
        <div className="relative h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px]">
          <Image
            src={heroImageUrl || "/placeholder.svg"}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
            unoptimized={heroImageUrl.includes('blob.vercel-storage.com')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight">
              {restaurant.slogan || restaurant.name}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="py-10 sm:py-14 md:py-20 lg:py-24 text-center text-white"
          style={{ backgroundColor: restaurant.primary_color }}
        >
          <div className="container mx-auto px-4">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight">
              {restaurant.slogan || restaurant.name}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
