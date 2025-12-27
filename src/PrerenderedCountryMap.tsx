import { useState } from 'react'
import { CountryMap } from './CountryMap'

interface PrerenderedCountryMapProps {
  highlightedCountry: string
  width?: number
  height?: number
  mode?: 'quiz' | 'overview'
  allowZoomToggle?: boolean
  onMapClick?: () => void
  capitalCoords?: [number, number]
}

// Pre-rendered sizes available (must match scripts/prerenderMaps.ts SIZES)
const PRERENDERED_SIZES = [
  { width: 128, height: 85 },   // Results thumbnails (w-32 with 3:2 aspect)
  { width: 200, height: 133 },  // Capital choice quiz options (3:2 aspect)
]

// Sanitize country name to match filename format
function getSafeCountryName(country: string): string {
  return country.replace(/[^a-zA-Z0-9-]/g, '_')
}

// Check if a size has pre-rendered images
function hasPrerenderedSize(width: number, height: number): boolean {
  return PRERENDERED_SIZES.some(s => s.width === width && s.height === height)
}

// Get the pre-rendered image URL (respects Vite base path)
function getPrerenderedUrl(country: string, width: number, height: number): string {
  const safeName = getSafeCountryName(country)
  const base = import.meta.env.BASE_URL || '/'
  return `${base}maps/${safeName}-${width}x${height}.png`
}

/**
 * A wrapper around CountryMap that uses pre-rendered PNG images when available.
 * Falls back to live SVG rendering for non-prerendered sizes or quiz mode.
 */
export function PrerenderedCountryMap({
  highlightedCountry,
  width = 400,
  height = 300,
  mode = 'quiz',
  allowZoomToggle = true,
  onMapClick,
  capitalCoords,
}: PrerenderedCountryMapProps) {
  const [imageError, setImageError] = useState(false)

  // Only use pre-rendered for overview mode with known sizes
  const canUsePrerendered = mode === 'overview' && hasPrerenderedSize(width, height) && !imageError

  if (canUsePrerendered) {
    const imageUrl = getPrerenderedUrl(highlightedCountry, width, height)

    return (
      <img
        src={imageUrl}
        alt={highlightedCountry}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    )
  }

  // Fall back to live rendering
  return (
    <CountryMap
      highlightedCountry={highlightedCountry}
      width={width}
      height={height}
      mode={mode}
      allowZoomToggle={allowZoomToggle}
      onMapClick={onMapClick}
      capitalCoords={capitalCoords}
    />
  )
}
