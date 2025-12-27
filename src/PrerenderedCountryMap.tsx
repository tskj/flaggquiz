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
function getPrerenderedUrl(country: string, width: number, height: number, mode: 'quiz' | 'overview', variant: 'default' | 'zoomed-out'): string {
  const safeName = getSafeCountryName(country)
  const base = import.meta.env.BASE_URL || '/'
  const variantSuffix = mode === 'quiz' ? `-${variant}` : ''
  return `${base}maps/${safeName}-${width}x${height}-${mode}${variantSuffix}.png`
}

/**
 * A wrapper around CountryMap that uses pre-rendered PNG images when available.
 * Falls back to live SVG rendering for non-prerendered sizes.
 * For quiz mode, supports toggling between default view and zoomed-out view.
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
  const [isZoomedOut, setIsZoomedOut] = useState(false)

  // Reset zoom state when country changes
  useEffect(() => {
    setIsZoomedOut(false)
    setImageError(false)
  }, [highlightedCountry])

  // Use pre-rendered if we have a matching size+mode combo
  const canUsePrerendered = hasPrerenderedSize(width, height, mode) && !imageError

  // Preload both images for quiz mode so toggling is instant
  useEffect(() => {
    if (canUsePrerendered && mode === 'quiz') {
      const preloadDefault = new Image()
      preloadDefault.src = getPrerenderedUrl(highlightedCountry, width, height, mode, 'default')
      const preloadZoomedOut = new Image()
      preloadZoomedOut.src = getPrerenderedUrl(highlightedCountry, width, height, mode, 'zoomed-out')
    }
  }, [highlightedCountry, width, height, mode, canUsePrerendered])

  if (canUsePrerendered) {
    const variant = isZoomedOut ? 'zoomed-out' : 'default'
    const imageUrl = getPrerenderedUrl(highlightedCountry, width, height, mode, variant)

    const handleClick = () => {
      if (allowZoomToggle && mode === 'quiz') {
        setIsZoomedOut(prev => !prev)
      }
      onMapClick?.()
    }

    return (
      <div className="relative w-full h-full">
        <img
          src={imageUrl}
          alt={highlightedCountry}
          className="w-full h-full object-cover"
          style={{ cursor: allowZoomToggle && mode === 'quiz' ? 'pointer' : 'default' }}
          onClick={handleClick}
          onError={() => setImageError(true)}
        />
        {/* Hint text overlay */}
        {allowZoomToggle && mode === 'quiz' && (
          <span
            className="absolute bottom-1 right-2 text-[10px] text-white/25 pointer-events-none"
          >
            {isZoomedOut ? 'Klikk for å zoome inn' : 'Klikk for å zoome ut'}
          </span>
        )}
      </div>
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
