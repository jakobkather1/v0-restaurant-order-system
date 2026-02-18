"use client"

import React from "react"

interface ThemeWrapperProps {
  primaryColor?: string | null
  children: React.ReactNode
}

function hexToOklch(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "")
  
  // Convert hex to RGB
  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255
  
  // Simple sRGB to linear RGB conversion
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)
  
  // Convert to XYZ
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl
  
  // Convert XYZ to Lab
  const xn = 0.95047
  const yn = 1.00000
  const zn = 1.08883
  
  const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * x / xn + 16/116)
  const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * y / yn + 16/116)
  const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * z / zn + 16/116)
  
  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bVal = 200 * (fy - fz)
  
  // Convert Lab to LCh
  const lightness = L / 100
  const chroma = Math.sqrt(a * a + bVal * bVal) / 100
  let hue = Math.atan2(bVal, a) * 180 / Math.PI
  if (hue < 0) hue += 360
  
  return `${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(3)}`
}

function getContrastColor(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "")
  
  // Convert to RGB
  const r = Number.parseInt(cleanHex.substring(0, 2), 16)
  const g = Number.parseInt(cleanHex.substring(2, 4), 16)
  const b = Number.parseInt(cleanHex.substring(4, 6), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? "0.145 0 0" : "0.985 0 0"
}

export function ThemeWrapper({ primaryColor, children }: ThemeWrapperProps) {
  // If no custom color, just render children without override
  if (!primaryColor || !primaryColor.startsWith("#")) {
    return <>{children}</>
  }

  try {
    const primaryOklch = hexToOklch(primaryColor)
    const foregroundOklch = getContrastColor(primaryColor)
    
    const cssVariables = `
      :root {
        --primary: oklch(${primaryOklch});
        --primary-foreground: oklch(${foregroundOklch});
        --ring: oklch(${primaryOklch});
      }
    `
    
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
        {children}
      </>
    )
  } catch (error) {
    return <>{children}</>
  }
}
