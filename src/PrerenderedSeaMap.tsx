import { useState, useEffect } from 'react'
import { SeaMap } from './SeaMap'

interface PrerenderedSeaMapProps {
  seaName: string
  center: [number, number]
  zoom: number
  width?: number
  height?: number
}

// Pre-rendered sizes available (must match scripts/prerenderSeaMaps.ts SIZES)
const PRERENDERED_SIZES: { width: number; height: number }[] = [
  { width: 200, height: 112 },   // Results thumbnails
  { width: 672, height: 378 },   // Main quiz view (16:9)
]

// Sanitize sea name to match filename format
function getSafeSeaName(seaName: string): string {
  return seaName.replace(/[^a-zA-Z0-9-]/g, '_')
}

// Check if a size combo has pre-rendered images
function hasPrerenderedSize(width: number, height: number): boolean {
  return PRERENDERED_SIZES.some(s => s.width === width && s.height === height)
}

// Get the pre-rendered image URL (respects Vite base path)
function getPrerenderedUrl(seaName: string, width: number, height: number): string {
  const safeName = getSafeSeaName(seaName)
  const base = import.meta.env.BASE_URL || '/'
  return `${base}sea-maps/${safeName}-${width}x${height}.png`
}

/**
 * Uses pre-rendered PNG images for sea maps.
 * Falls back to live SVG rendering only for non-prerendered sizes.
 */
export function PrerenderedSeaMap({
  seaName,
  center,
  zoom,
  width = 672,
  height = 378,
}: PrerenderedSeaMapProps) {
  const [imageError, setImageError] = useState(false)

  // Reset error state when sea changes
  useEffect(() => {
    setImageError(false)
  }, [seaName])

  // Use pre-rendered if we have a matching size combo
  const canUsePrerendered = hasPrerenderedSize(width, height) && !imageError

  if (canUsePrerendered) {
    const imageUrl = getPrerenderedUrl(seaName, width, height)

    return (
      <img
        src={imageUrl}
        alt={seaName}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    )
  }

  // Fall back to live rendering for non-prerendered sizes
  return (
    <SeaMap
      center={center}
      zoom={zoom}
      width={width}
      height={height}
    />
  )
}
