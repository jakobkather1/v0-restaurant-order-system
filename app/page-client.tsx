"use client"

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6 px-4 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900">Order Terminal</h1>
        <p className="text-xl text-gray-700">
          Professionelles Online-Bestellsystem für Restaurants
        </p>
        <p className="text-gray-600">
          Besuche die Seite eines teilnehmenden Restaurants, um online zu bestellen.
        </p>
        <div className="pt-4">
          <p className="text-sm text-gray-500">
            Bist du Restaurantbesitzer? <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">Melde dich an</a>
          </p>
        </div>
      </div>
    </div>
  )
}
