import { Metadata } from "next"
import HomePageClient from "./page-client"

// Static metadata for preview - production will use database values
export const metadata: Metadata = {
  title: "Order Terminal",
  description: "Professionelles Online-Bestellsystem für Restaurants",
}

export default function HomePage() {
  return <HomePageClient />
}
