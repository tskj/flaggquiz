import { useEffect, useState, useMemo, memo } from 'react'
import { geoPath, geoAzimuthalEqualArea, geoCentroid, geoBounds, geoArea } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry, Polygon } from 'geojson'
import { countryToISO } from './countryISOCodes'

interface PolygonParts {
  mainForProjection: Feature<Polygon>  // Largest polygon (possibly clipped), used for projection bounds
  mainForRendering: Feature<Polygon>   // Original largest polygon for rendering
  nearbyPolygons: Feature<Polygon>[]   // All polygons to render in main view (includes main + nearby islands)
  insets: Feature<Polygon>[]           // Distant territories for inset boxes
  spansDateLine: boolean               // Whether the country spans the date line
}

// Clip a polygon to only include coordinates in the eastern part (for projection calculation)
function clipToEasternHemisphere(poly: Feature<Polygon>): Feature<Polygon> {
  const coords = poly.geometry.coordinates[0]

  // Filter to only keep coordinates with lng > 0 (eastern hemisphere)
  const clippedCoords = coords.filter(point => point[0] > 0)

  if (clippedCoords.length < 4) {
    // Not enough points, return original
    return poly
  }

  // Close the polygon if needed
  const first = clippedCoords[0]
  const last = clippedCoords[clippedCoords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    clippedCoords.push([...first] as [number, number])
  }

  return {
    type: 'Feature',
    properties: poly.properties,
    geometry: {
      type: 'Polygon',
      coordinates: [clippedCoords]
    }
  }
}

// Extract polygons into: main (for projection), nearby (for main view), and insets (for boxes)
function getPolygonParts(feat: Feature<Geometry>): PolygonParts {
  const geom = feat.geometry
  if (geom.type === 'Polygon') {
    const poly = feat as Feature<Polygon>
    return {
      mainForProjection: poly,
      mainForRendering: poly,
      nearbyPolygons: [poly],
      insets: [],
      spansDateLine: false
    }
  }
  if (geom.type === 'MultiPolygon') {
    // Calculate area for each polygon
    const polygons: { poly: Feature<Polygon>; area: number }[] = geom.coordinates.map(coords => {
      const poly: Feature<Polygon> = {
        type: 'Feature',
        properties: feat.properties,
        geometry: { type: 'Polygon', coordinates: coords }
      }
      return { poly, area: geoArea(poly) }
    })

    // Sort by area descending
    polygons.sort((a, b) => b.area - a.area)

    const mainForRendering = polygons[0].poly
    let mainForProjection = mainForRendering
    const mainArea = polygons[0].area

    // Check if main polygon spans the date line and clip if needed
    const mainCoords = mainForRendering.geometry.coordinates[0]
    const lngs = mainCoords.map(p => p[0])
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const crossesDateLine = minLng < -90 && maxLng > 90

    if (crossesDateLine) {
      // For date-line-spanning countries, clip to eastern hemisphere for projection
      mainForProjection = clipToEasternHemisphere(mainForRendering)
    }

    // Add moderate padding to main bounds (3° in each direction)
    // This keeps nearby islands like Lofoten with mainland, but separates truly distant territories
    const mainBounds = geoBounds(mainForProjection)
    const paddedBounds = {
      minLng: mainBounds[0][0] - 3,
      minLat: mainBounds[0][1] - 3,
      maxLng: mainBounds[1][0] + 3,
      maxLat: mainBounds[1][1] + 3,
    }

    const nearbyPolygons: Feature<Polygon>[] = [mainForRendering]
    const insets: Feature<Polygon>[] = []

    const mainLng = geoCentroid(mainForProjection)[0]

    for (let i = 1; i < polygons.length; i++) {
      const { poly, area } = polygons[i]

      // Check if polygon crosses the date line (opposite hemisphere from main)
      const polyLng = geoCentroid(poly)[0]
      const polySpansDateLine = (mainLng > 0 && polyLng < -90) || (mainLng < 0 && polyLng > 90)

      if (polySpansDateLine) {
        // Include far-east territories - they'll be rendered with rotation
        nearbyPolygons.push(poly)
        continue
      }

      const bounds = geoBounds(poly)

      // Check if polygon is completely outside the padded main bounds
      const isDistant =
        bounds[1][0] < paddedBounds.minLng || // Entirely west of padded main
        bounds[0][0] > paddedBounds.maxLng || // Entirely east of padded main
        bounds[1][1] < paddedBounds.minLat || // Entirely south of padded main
        bounds[0][1] > paddedBounds.maxLat    // Entirely north of padded main

      if (isDistant) {
        // Only include in insets if significant (at least 0.5% of main area)
        if (area >= mainArea * 0.005) {
          insets.push(poly)
        }
      } else {
        // Nearby - include in main view rendering
        nearbyPolygons.push(poly)
      }
    }

    return { mainForProjection, mainForRendering, nearbyPolygons, insets, spansDateLine: crossesDateLine }
  }
  // Fallback
  const poly = feat as Feature<Polygon>
  return {
    mainForProjection: poly,
    mainForRendering: poly,
    nearbyPolygons: [poly],
    insets: [],
    spansDateLine: false
  }
}

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

  // Split country into main polygon and distant insets (overseas territories)
  const polygonParts = useMemo(() => {
    if (!targetFeature50m) return null
    return getPolygonParts(targetFeature50m)
  }, [targetFeature50m])

  const { pathGenerator, projectionScale } = useMemo(() => {
    if (!polygonParts) return { pathGenerator: null, projectionScale: 1000 }

    const paddingPx = 20

    // Create a combined feature from all nearby polygons (mainland + nearby islands)
    // This ensures we center on and fit all visible parts, not just the mainland
    const allNearbyFeature: Feature<Geometry> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: polygonParts.nearbyPolygons.map(p => p.geometry.coordinates)
      }
    }

    // Center on all visible parts (fixes Greece, Malta, etc. where islands are close but off-center)
    const center = geoCentroid(allNearbyFeature)

    // Use Azimuthal Equal-Area projection centered on the country
    // This gives accurate shapes and sizes, especially for polar countries
    // and automatically handles date-line crossing
    const projection = geoAzimuthalEqualArea()
      .rotate([-center[0], -center[1]])  // Center on all visible parts
      .fitExtent(
        [[paddingPx, paddingPx], [width - paddingPx, height - paddingPx]],
        allNearbyFeature  // Fit to all visible parts
      )

    const currentScale = projection.scale()
    const finalScale = currentScale * zoomFactor
    projection.scale(finalScale)
    projection.translate([width / 2, height / 2])

    return { pathGenerator: geoPath(projection), projectionScale: finalScale }
  }, [polygonParts, width, height, zoomFactor])

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

  const targetPaths = useMemo(() => {
    if (!pathGenerator || !polygonParts) return []

    // Determine if we should use 10m data
    let use10m = false
    let parts10m: PolygonParts | null = null
    if (targetFeature10m) {
      const bounds = geoBounds(targetFeature10m)
      const lngSpan = bounds[1][0] - bounds[0][0]
      const latSpan = bounds[1][1] - bounds[0][1]
      // Only use 10m if it has meaningful extent (> 0.001 degrees in both dimensions)
      if (lngSpan > 0.001 && latSpan > 0.001) {
        use10m = true
        parts10m = getPolygonParts(targetFeature10m)
      }
    }

    // Render all nearby polygons (mainland + nearby islands like Lofoten)
    // The rotated projection handles date-line crossing automatically
    const polygonsToRender = use10m && parts10m ? parts10m.nearbyPolygons : polygonParts.nearbyPolygons

    return polygonsToRender
      .map((poly, i) => ({ key: `target-${i}`, d: pathGenerator(poly) || '' }))
      .filter(p => p.d)
  }, [pathGenerator, targetFeature10m, polygonParts])

  // Calculate inset boxes for overseas territories (only in quiz mode)
  const insetBoxes = useMemo(() => {
    if (!polygonParts || polygonParts.insets.length === 0 || mode === 'overview') return []

    const boxSize = { w: 50, h: 35 }
    const padding = 6

    // Get mainland centroid for direction calculation
    const mainCentroid = geoCentroid(polygonParts.mainForProjection)

    // Group insets by direction (N, S, E, W, NE, NW, SE, SW)
    type Direction = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
    const directionCounts: Record<Direction, number> = { n: 0, s: 0, e: 0, w: 0, ne: 0, nw: 0, se: 0, sw: 0 }

    return polygonParts.insets.map((inset) => {
      const insetCentroid = geoCentroid(inset)

      // Calculate direction from main to inset
      const dLng = insetCentroid[0] - mainCentroid[0]
      const dLat = insetCentroid[1] - mainCentroid[1]

      // Determine primary direction
      let direction: Direction
      const absLng = Math.abs(dLng)
      const absLat = Math.abs(dLat)

      if (absLat > absLng * 2) {
        // Primarily north/south
        direction = dLat > 0 ? 'n' : 's'
      } else if (absLng > absLat * 2) {
        // Primarily east/west
        direction = dLng > 0 ? 'e' : 'w'
      } else {
        // Diagonal
        if (dLat > 0 && dLng > 0) direction = 'ne'
        else if (dLat > 0 && dLng < 0) direction = 'nw'
        else if (dLat < 0 && dLng > 0) direction = 'se'
        else direction = 'sw'
      }

      // Get position index for this direction (for multiple insets in same direction)
      const posIndex = directionCounts[direction]++

      // Calculate position based on direction
      let x: number, y: number
      const offset = posIndex * (boxSize.w + 4)

      switch (direction) {
        case 'n':
          x = width / 2 - boxSize.w / 2 + offset
          y = padding
          break
        case 's':
          x = width / 2 - boxSize.w / 2 + offset
          y = height - padding - boxSize.h
          break
        case 'e':
          x = width - padding - boxSize.w
          y = height / 2 - boxSize.h / 2 + offset
          break
        case 'w':
          x = padding
          y = height / 2 - boxSize.h / 2 + offset
          break
        case 'ne':
          x = width - padding - boxSize.w - offset
          y = padding
          break
        case 'nw':
          x = padding + offset
          y = padding
          break
        case 'se':
          x = width - padding - boxSize.w - offset
          y = height - padding - boxSize.h
          break
        case 'sw':
        default:
          x = padding + offset
          y = height - padding - boxSize.h
          break
      }

      // Create a projection for this inset, centered on the territory
      const insetCenter = geoCentroid(inset)
      const insetProjection = geoAzimuthalEqualArea()
        .rotate([-insetCenter[0], -insetCenter[1]])
        .fitExtent(
          [[2, 2], [boxSize.w - 2, boxSize.h - 2]],
          inset
        )
      const insetPath = geoPath(insetProjection)
      const d = insetPath(inset) || ''

      return { x, y, w: boxSize.w, h: boxSize.h, d, key: `inset-${direction}-${posIndex}` }
    })
  }, [polygonParts, width, height, mode])

  // Calculate stroke width based on projection scale
  // Low scale (zoomed out) = thinner strokes, high scale (zoomed in) = normal strokes
  const strokeWidth = useMemo(() => {
    const baseStroke = mode === 'overview' ? 3.0 : 1.8
    const referenceScale = 3000
    // Clamp to reasonable range to avoid too thin or too thick strokes
    return Math.max(0.8, Math.min(baseStroke, baseStroke * (projectionScale / referenceScale)))
  }, [mode, projectionScale])

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
      {targetPaths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          fill="#4ade80"
        />
      ))}

      {/* Render inset boxes for overseas territories */}
      {insetBoxes.map(({ x, y, w, h, d, key }) => (
        <g key={key} transform={`translate(${x}, ${y})`}>
          {/* Box background */}
          <rect
            width={w}
            height={h}
            fill="#1a3a5c"
            stroke="#4ade80"
            strokeWidth={1}
            rx={2}
          />
          {/* Territory shape */}
          <path
            d={d}
            fill="#4ade80"
          />
        </g>
      ))}
    </svg>
  )
}

// Memoized export to prevent unnecessary re-renders
export const CountryMap = memo(CountryMapInner)
