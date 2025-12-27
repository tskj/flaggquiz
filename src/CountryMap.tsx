import { useEffect, useState, useMemo, memo } from 'react'
import { geoPath, geoMercator, geoCentroid, geoBounds } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { countryToISO } from './countryISOCodes'

// TopoJSON from world-atlas
const TOPOJSON_URL_50M = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json'
const TOPOJSON_URL_10M = 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json'

// Module-level cache for TopoJSON data (shared across all instances)
let cachedData: { countries50m: FeatureCollection; countries10m: FeatureCollection } | null = null
let loadingPromise: Promise<{ countries50m: FeatureCollection; countries10m: FeatureCollection }> | null = null

// Preload function - call this early to start loading data
export function preloadMapData(): Promise<void> {
  if (cachedData) return Promise.resolve()
  if (!loadingPromise) {
    loadingPromise = Promise.all([
      fetch(TOPOJSON_URL_50M).then(res => res.json()),
      fetch(TOPOJSON_URL_10M).then(res => res.json())
    ]).then(([topo50m, topo10m]: [Topology, Topology]) => {
      const geo50m = topo50m.objects.countries as GeometryCollection
      const geo10m = topo10m.objects.countries as GeometryCollection
      cachedData = {
        countries50m: feature(topo50m, geo50m) as FeatureCollection,
        countries10m: feature(topo10m, geo10m) as FeatureCollection
      }
      return cachedData
    })
  }
  return loadingPromise.then(() => {})
}

interface CountryMapProps {
  highlightedCountry: string // English name from our country list
  width?: number
  height?: number
  mode?: 'quiz' | 'overview' // quiz = show neighbors, overview = zoomed in on country
}

interface CountryFeature extends Feature<Geometry> {
  id?: string
  properties: { name: string }
}

function CountryMapInner({
  highlightedCountry,
  width = 400,
  height = 300,
  mode = 'quiz',
}: CountryMapProps) {
  // Quiz mode shows neighbors (zoom out), overview zooms in on the country
  const zoomFactor = mode === 'overview' ? 3.5 : 0.5
  const strokeWidth = mode === 'overview' ? 0.5 : 1
  const [data, setData] = useState(cachedData)
  const [loading, setLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)

  // Load data (uses cache if available)
  useEffect(() => {
    if (cachedData) {
      setData(cachedData)
      setLoading(false)
      return
    }

    preloadMapData()
      .then(() => {
        setData(cachedData)
        setLoading(false)
      })
      .catch((err) => {
        setError('Failed to load map data')
        setLoading(false)
        console.error(err)
      })
  }, [])

  const countries50m = data?.countries50m ?? null
  const countries10m = data?.countries10m ?? null
  const targetISO = countryToISO[highlightedCountry]

  // All useMemo hooks must be called before any early returns
  const targetFeature50m = useMemo(() =>
    countries50m?.features.find((f) => (f as CountryFeature).id === targetISO) as CountryFeature | undefined,
    [countries50m, targetISO]
  )

  const targetFeature10m = useMemo(() =>
    countries10m?.features.find((f) => (f as CountryFeature).id === targetISO) as CountryFeature | undefined,
    [countries10m, targetISO]
  )

  const pathGenerator = useMemo(() => {
    if (!targetFeature50m) return null

    const center = geoCentroid(targetFeature50m)
    const paddingPx = 20
    const projection = geoMercator()
      .fitExtent(
        [[paddingPx, paddingPx], [width - paddingPx, height - paddingPx]],
        targetFeature50m
      )

    const currentScale = projection.scale()
    projection.scale(currentScale * zoomFactor)
    projection.center(center)
    projection.translate([width / 2, height / 2])

    return geoPath(projection)
  }, [targetFeature50m, width, height, zoomFactor])

  const neighborPaths = useMemo(() => {
    if (!countries50m || !pathGenerator) return []
    return countries50m.features
      .filter((f) => (f as CountryFeature).id !== targetISO)
      .map((feature, index) => {
        const countryFeature = feature as CountryFeature
        const d = pathGenerator(feature)
        if (!d) return null
        // Use index as part of key to handle duplicate IDs in TopoJSON data
        return { key: `${countryFeature.id || countryFeature.properties.name}-${index}`, d }
      })
      .filter(Boolean) as { key: string; d: string }[]
  }, [countries50m, targetISO, pathGenerator])

  const targetPath = useMemo(() => {
    if (!pathGenerator || !targetFeature50m) return ''

    // Check if 10m feature has degenerate geometry (e.g., Vatican in world-atlas)
    let featureToRender = targetFeature50m
    if (targetFeature10m) {
      const bounds = geoBounds(targetFeature10m)
      const lngSpan = bounds[1][0] - bounds[0][0]
      const latSpan = bounds[1][1] - bounds[0][1]
      // Only use 10m if it has meaningful extent (> 0.001 degrees in both dimensions)
      if (lngSpan > 0.001 && latSpan > 0.001) {
        featureToRender = targetFeature10m
      }
    }

    return pathGenerator(featureToRender) || ''
  }, [pathGenerator, targetFeature10m, targetFeature50m])

  // Early returns after all hooks
  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a3a5c', borderRadius: '8px' }}>
        <span style={{ color: '#666' }}>Laster kart...</span>
      </div>
    )
  }

  if (error || !countries50m || !countries10m) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a3a5c', borderRadius: '8px' }}>
        <span style={{ color: '#f66' }}>{error || 'Kunne ikke laste kart'}</span>
      </div>
    )
  }

  if (!targetFeature50m || !pathGenerator) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a3a5c', borderRadius: '8px' }}>
        <span style={{ color: '#888' }}>Kart ikke tilgjengelig</span>
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: '#1a3a5c', borderRadius: '8px', width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ocean background */}
      <rect width={width} height={height} fill="#1a3a5c" />

      {/* Render non-target countries first (50m) */}
      {neighborPaths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          fill="#2d2d44"
          stroke="#1a3a5c"
          strokeWidth={strokeWidth}
        />
      ))}
      {/* Render target country on top (10m for high detail) */}
      <path
        d={targetPath}
        fill="#4ade80"
        stroke="#1a3a5c"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

// Memoized export to prevent unnecessary re-renders
export const CountryMap = memo(CountryMapInner)
