import { useState, useEffect } from 'react'
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
const PRERENDERED_SIZES: { width: number; height: number; mode: 'quiz' | 'overview' }[] = [
  { width: 128, height: 85, mode: 'overview' },   // Results thumbnails
  { width: 200, height: 133, mode: 'overview' },  // Capital choice quiz options
  { width: 672, height: 378, mode: 'quiz' },      // Main quiz view (16:9)
]

// Sanitize country name to match filename format
function getSafeCountryName(country: string): string {
  return country.replace(/[^a-zA-Z0-9-]/g, '_')
}

// Check if a size+mode combo has pre-rendered images
function hasPrerenderedSize(width: number, height: number, mode: 'quiz' | 'overview'): boolean {
  return PRERENDERED_SIZES.some(s => s.width === width && s.height === height && s.mode === mode)
}

// Get the pre-rendered image URL (respects Vite base path)
function getPrerenderedUrl(country: string, width: number, height: number, mode: 'quiz' | 'overview', showInsets?: boolean): string {
  const safeName = getSafeCountryName(country)
  const base = import.meta.env.BASE_URL || '/'
  // Quiz mode has insets/noinsets variants
  const insetsSuffix = mode === 'quiz' ? (showInsets ? '-insets' : '-noinsets') : ''
  return `${base}maps/${safeName}-${width}x${height}-${mode}${insetsSuffix}.png`
}

/**
 * A wrapper around CountryMap that uses pre-rendered PNG images when available.
 * Falls back to live SVG rendering for non-prerendered sizes.
 * For quiz mode, supports toggling between insets view and zoomed-out view.
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
  const [showInsets, setShowInsets] = useState(true)

  // Reset insets state when country changes
  useEffect(() => {
    setShowInsets(true)
  }, [highlightedCountry])

  // Use pre-rendered if we have a matching size+mode combo
  const canUsePrerendered = hasPrerenderedSize(width, height, mode) && !imageError

  // Preload both images for quiz mode so toggling is instant
  useEffect(() => {
    if (canUsePrerendered && mode === 'quiz') {
      const preloadInsets = new Image()
      preloadInsets.src = getPrerenderedUrl(highlightedCountry, width, height, mode, true)
      const preloadNoInsets = new Image()
      preloadNoInsets.src = getPrerenderedUrl(highlightedCountry, width, height, mode, false)
    }
  }, [highlightedCountry, width, height, mode, canUsePrerendered])

  if (canUsePrerendered) {
    const imageUrl = getPrerenderedUrl(highlightedCountry, width, height, mode, showInsets)

    const handleClick = () => {
      if (allowZoomToggle && mode === 'quiz') {
        setShowInsets(prev => !prev)
      }
      onMapClick?.()
    }

    return (
      <img
        src={imageUrl}
        alt={highlightedCountry}
        className="w-full h-full object-cover"
        style={{ cursor: allowZoomToggle && mode === 'quiz' ? 'pointer' : 'default' }}
        onClick={handleClick}
        onError={() => setImageError(true)}
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
