export function DbErrorPage({ slug, error }: { slug: string; error: string }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Datenbankfehler</h1>
            <p className="text-gray-400 text-sm">Die Verbindung zur Datenbank ist fehlgeschlagen</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded p-4 font-mono text-sm">
          <p className="text-gray-400 mb-2">Angefragter Slug:</p>
          <p className="text-amber-400">&quot;{slug}&quot;</p>

          <p className="text-gray-400 mt-4 mb-2">Fehlermeldung:</p>
          <p className="text-red-400 break-all">{error}</p>
        </div>

        <div className="text-sm text-gray-400 space-y-2">
          <p className="font-semibold text-white">Mögliche Ursachen:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>DATABASE_URL Umgebungsvariable fehlt oder ist ungültig</li>
            <li>Neon-Datenbank ist nicht erreichbar</li>
            <li>Das Restaurant &quot;{slug}&quot; existiert nicht in der Datenbank</li>
            <li>Netzwerkverbindung unterbrochen</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <a
            href={`/${slug}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors text-center"
          >
            Seite neu laden
          </a>
          <a
            href="/super-admin"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-center"
          >
            Zum Super Admin
          </a>
        </div>
      </div>
    </div>
  )
}
