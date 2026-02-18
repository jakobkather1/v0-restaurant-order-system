// Temporary debug file to check middleware behavior
// Check what happens when accessing: https://www.xn--doctordner-kcb.de/lieferung/bammental

export function analyzeUrl(url: string) {
  const hostname = new URL(url).hostname
  const pathname = new URL(url).pathname
  
  // Remove www.
  const cleanDomain = hostname.replace(/^www\./, '')
  
  console.log('[v0] Middleware would process:')
  console.log('[v0] Original hostname:', hostname)
  console.log('[v0] Clean domain:', cleanDomain)
  console.log('[v0] Pathname:', pathname)
  console.log('[v0] Rewrite to:', `/tenants/${cleanDomain}${pathname}`)
}

// Test
analyzeUrl('https://www.xn--doctordner-kcb.de/lieferung/bammental')
