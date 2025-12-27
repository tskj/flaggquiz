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
  tinyDistantIslands: Feature<Polygon>[] // Small distant islands rendered in main view without insets
  insets: Feature<Polygon>[]           // Distant territories for inset boxes (flat list)
  insetGroups: Feature<Polygon>[][]    // Distant territories grouped by proximity (for rendering)
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

// Group nearby polygons together (for island archipelagos like Svalbard)
function groupNearbyPolygons(polygons: Feature<Polygon>[]): Feature<Polygon>[][] {
  if (polygons.length === 0) return []
  if (polygons.length === 1) return [polygons]

  // Calculate bounds for each polygon
  const polygonsWithBounds = polygons.map(p => ({
    poly: p,
    bounds: geoBounds(p),
    centroid: geoCentroid(p)
  }))

  // Group polygons that are within 8 degrees of each other (keeps archipelagos like Svalbard together)
  const groups: Feature<Polygon>[][] = []
  const used = new Set<number>()

  for (let i = 0; i < polygonsWithBounds.length; i++) {
    if (used.has(i)) continue

    const group: Feature<Polygon>[] = [polygonsWithBounds[i].poly]
    used.add(i)

    // Find all polygons close to any polygon in the current group
    let foundMore = true
    while (foundMore) {
      foundMore = false
      for (let j = 0; j < polygonsWithBounds.length; j++) {
        if (used.has(j)) continue

        const b = polygonsWithBounds[j]

        // Check if this polygon is within 8 degrees of ANY polygon in the group
        for (const groupPoly of group) {
          const a = polygonsWithBounds.find(p => p.poly === groupPoly)!
          const dist = Math.sqrt(
            Math.pow(a.centroid[0] - b.centroid[0], 2) +
            Math.pow(a.centroid[1] - b.centroid[1], 2)
          )

          if (dist < 8) {
            group.push(b.poly)
            used.add(j)
            foundMore = true
            break
          }
        }
      }
    }

    groups.push(group)
  }

  return groups
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
      tinyDistantIslands: [],
      insets: [],
      insetGroups: [],
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

    // Add moderate padding to main bounds (5° in each direction)
    // This keeps coastal islands with mainland, but separates distant territories like Svalbard
    const mainBounds = geoBounds(mainForProjection)
    const paddedBounds = {
      minLng: mainBounds[0][0] - 5,
      minLat: mainBounds[0][1] - 5,
      maxLng: mainBounds[1][0] + 5,
      maxLat: mainBounds[1][1] + 5,
    }

    const nearbyPolygons: Feature<Polygon>[] = [mainForRendering]
    const tinyDistantIslands: Feature<Polygon>[] = []
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
        // Significant distant territories (>= 0.1% of main) get inset boxes
        // Tiny distant islands (< 0.1% but >= 0.02%) are rendered in main view as dots
        if (area >= mainArea * 0.001) {
          insets.push(poly)
        } else if (area >= mainArea * 0.0002) {
          tinyDistantIslands.push(poly)
        }
      } else {
        // Nearby - include in main view rendering
        nearbyPolygons.push(poly)
      }
    }

    // Group nearby inset polygons together (e.g., Svalbard islands)
    const insetGroups = groupNearbyPolygons(insets)

    return { mainForProjection, mainForRendering, nearbyPolygons, tinyDistantIslands, insets, insetGroups, spansDateLine: crossesDateLine }
  }
  // Fallback
  const poly = feat as Feature<Polygon>
  return {
    mainForProjection: poly,
    mainForRendering: poly,
    nearbyPolygons: [poly],
    tinyDistantIslands: [],
    insets: [],
    insetGroups: [],
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
  allowZoomToggle?: boolean // Whether clicking toggles zoom (enabled in practice mode)
  onMapClick?: () => void // Called after map click (e.g., to refocus input)
}

interface CountryFeature extends Feature<Geometry> {
  id?: string
  properties: { name: string }
}

// Countries where insets don't make sense - just show everything in the main view
const countriesWithoutInsets = ['Bahamas', 'Canada', 'Denmark', 'Solomon Islands', 'Marshall Islands', 'Kiribati']

// Small island nations that need extra zoom (spread out but tiny land area)
const countriesNeedingExtraZoom: Record<string, number> = {
  'Palau': 3.0,
  'Kiribati': 6.0,
  'Tuvalu': 4.0,
  'Marshall Islands': 4.0,
}

// Fixed global zoom level for "see where in the world" view
const GLOBAL_CONTEXT_ZOOM = 150

function CountryMapInner({
  highlightedCountry,
  width = 400,
  height = 300,
  mode = 'quiz',
  allowZoomToggle = true,
  onMapClick,
}: CountryMapProps) {
  // Quiz mode shows neighbors (zoom out), overview fits country to box
  const extraZoom = countriesNeedingExtraZoom[highlightedCountry] || 1.0
  const baseZoomFactor = mode === 'overview' ? 1.0 * extraZoom : 0.5 * extraZoom
  const [data, setData] = useState(cachedData)
  const [loading, setLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)
  const [showInsetsState, setShowInsetsState] = useState(true)
  const [zoomedOutForContext, setZoomedOutForContext] = useState(false)
  const [lastCountry, setLastCountry] = useState(highlightedCountry)

  // Reset zoom state synchronously when country changes (avoids flash)
  if (highlightedCountry !== lastCountry) {
    setLastCountry(highlightedCountry)
    setShowInsetsState(true)
    setZoomedOutForContext(false)
  }

  // Some countries should never use insets
  const forceNoInsets = countriesWithoutInsets.includes(highlightedCountry)
  const showInsets = forceNoInsets ? false : showInsetsState

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
  // Use 10m data for quiz mode (more accurate for island nations like Maldives)
  // Use 50m data for overview/thumbnail mode (simpler, better for small displays)
  // Fallback to 10m if country only exists there (e.g., Tuvalu)
  const polygonParts = useMemo(() => {
    // For overview mode (thumbnails), prefer simpler 50m data but fallback to 10m
    if (mode === 'overview') {
      if (targetFeature50m) return getPolygonParts(targetFeature50m)
      if (targetFeature10m) return getPolygonParts(targetFeature10m)
      return null
    }
    // For quiz mode, prefer 10m data - it's more accurate for island nations
    if (targetFeature10m) {
      const bounds = geoBounds(targetFeature10m)
      const lngSpan = bounds[1][0] - bounds[0][0]
      const latSpan = bounds[1][1] - bounds[0][1]
      // Use 10m if it has meaningful extent
      if (lngSpan > 0.001 && latSpan > 0.001) {
        return getPolygonParts(targetFeature10m)
      }
    }
    if (!targetFeature50m) return null
    return getPolygonParts(targetFeature50m)
  }, [targetFeature50m, targetFeature10m, mode])

  // Check if this country has insets
  const hasInsets = !forceNoInsets && polygonParts?.insets && polygonParts.insets.length > 0

  // Toggle zoom allowed unless explicitly disabled (e.g., practice mode)
  const canToggleZoom = allowZoomToggle

  // Use fixed global zoom level when zoomed out for context (for non-inset countries)
  // For inset countries, the zoom is controlled by showInsets logic
  const useGlobalZoom = zoomedOutForContext && !hasInsets
  const zoomFactor = useGlobalZoom ? null : baseZoomFactor  // null signals to use fixed scale

  const { pathGenerator, projectionScale, projection } = useMemo(() => {
    if (!polygonParts) return { pathGenerator: null, projectionScale: 1000, projection: null }

    // Use smaller padding for thumbnails (overview mode)
    const paddingPx = mode === 'overview' ? 4 : 10

    // Get the main polygon's area for filtering
    const mainArea = geoArea(polygonParts.nearbyPolygons[0])

    // When insets are hidden, include ALL polygons (nearby + insets) for centering/fitting
    // When insets are shown, only use nearby polygons
    const allPolygons = showInsets
      ? polygonParts.nearbyPolygons
      : [...polygonParts.nearbyPolygons, ...polygonParts.insets]

    // Filter to only significant polygons (at least 1% of main area) for centering/fitting
    // This prevents tiny islands from stretching the bounding box too much
    // BUT: when showing all (insets hidden), include everything so distant territories are visible
    const significantPolygons = showInsets
      ? allPolygons.filter(p => geoArea(p) >= mainArea * 0.01)
      : allPolygons

    // Create a combined feature from polygons to fit
    const significantFeature: Feature<Geometry> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: significantPolygons.map(p => p.geometry.coordinates)
      }
    }

    // When extra zoom is applied, center on just the main polygon to avoid being pulled off-center
    // by smaller nearby islands (fixes Kiribati where Kiritimati should be centered)
    const centerFeature = extraZoom > 1 ? polygonParts.mainForProjection : significantFeature
    const center = geoCentroid(centerFeature)

    // Use Azimuthal Equal-Area projection centered on the country
    // This gives accurate shapes and sizes, especially for polar countries
    // and automatically handles date-line crossing
    const proj = geoAzimuthalEqualArea()
      .rotate([-center[0], -center[1]])  // Center on significant parts
      .fitExtent(
        [[paddingPx, paddingPx], [width - paddingPx, height - paddingPx]],
        significantFeature  // Fit to significant parts only
      )

    const currentScale = proj.scale()
    // Use fixed global zoom for context view, otherwise use the calculated zoom factor
    const finalScale = useGlobalZoom ? GLOBAL_CONTEXT_ZOOM : currentScale * zoomFactor!
    proj.scale(finalScale)
    proj.translate([width / 2, height / 2])

    return { pathGenerator: geoPath(proj), projectionScale: finalScale, projection: proj }
  }, [polygonParts, width, height, zoomFactor, showInsets, useGlobalZoom, mode, extraZoom])

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

    // Render all nearby polygons (mainland + nearby islands like Lofoten)
    // Always render tiny distant islands (they appear as dots, don't get insets)
    // When insets are hidden, also render the inset polygons in the main view
    // Note: polygonParts already uses 10m data when available
    const polygonsToRender = showInsets
      ? [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands]
      : [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands, ...polygonParts.insets]

    return polygonsToRender
      .map((poly, i) => ({ key: `target-${i}`, d: pathGenerator(poly) || '' }))
      .filter(p => p.d)
  }, [pathGenerator, polygonParts, showInsets])

  // Calculate inset boxes for overseas territories (only in quiz mode, and only when showInsets is true)
  const insetBoxes = useMemo(() => {
    if (!polygonParts || !projection || polygonParts.insetGroups.length === 0 || mode === 'overview' || !showInsets) return []

    const padding = 0  // Glued to the edge

    // Project the main centroid to screen coordinates
    const mainCentroid = geoCentroid(polygonParts.mainForProjection)
    const mainScreen = projection(mainCentroid)
    if (!mainScreen) return []

    // Track used positions to avoid overlap
    const usedPositions: { x: number; y: number; w: number; h: number }[] = []

    return polygonParts.insetGroups.map((group, index) => {
      // Create a combined feature for the whole group (for bounds and centroid calculation)
      const combinedFeature: Feature<Geometry> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'MultiPolygon',
          coordinates: group.map(p => p.geometry.coordinates)
        }
      }

      const groupCentroid = geoCentroid(combinedFeature)

      // Project group centroid to get the direction vector in screen space
      const groupScreen = projection(groupCentroid)

      // Calculate direction vector from main to group in screen coordinates
      let dx: number, dy: number
      if (groupScreen) {
        dx = groupScreen[0] - mainScreen[0]
        dy = groupScreen[1] - mainScreen[1]
      } else {
        // Fallback to geographic direction if projection fails
        dx = groupCentroid[0] - mainCentroid[0]
        dy = -(groupCentroid[1] - mainCentroid[1]) // Flip Y since screen Y is inverted
      }

      // Normalize the direction vector
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length > 0) {
        dx /= length
        dy /= length
      }

      // Create a projection for this group
      const groupCenter = groupCentroid

      // Define min/max box sizes
      const minBoxSize = 30
      const maxBoxSize = 60
      const contentPadding = 4

      // Create a projection fitted to max box size to measure natural dimensions
      const testProjection = geoAzimuthalEqualArea()
        .rotate([-groupCenter[0], -groupCenter[1]])
        .fitSize([maxBoxSize - contentPadding * 2, maxBoxSize - contentPadding * 2], combinedFeature)

      // Calculate bounds to determine aspect ratio
      const testPath = geoPath(testProjection)
      const bounds = testPath.bounds(combinedFeature)
      const naturalWidth = Math.max(1, bounds[1][0] - bounds[0][0])
      const naturalHeight = Math.max(1, bounds[1][1] - bounds[0][1])

      // Calculate box size based on aspect ratio, maintaining proper proportions
      const aspectRatio = naturalWidth / naturalHeight
      let boxWidth: number, boxHeight: number

      if (aspectRatio > 1) {
        // Wider than tall
        boxWidth = Math.min(maxBoxSize, naturalWidth + contentPadding * 2)
        boxHeight = boxWidth / aspectRatio
        // If height is too small, scale up both to meet minBoxSize
        if (boxHeight < minBoxSize) {
          boxHeight = minBoxSize
          boxWidth = boxHeight * aspectRatio
        }
      } else {
        // Taller than wide
        boxHeight = Math.min(maxBoxSize, naturalHeight + contentPadding * 2)
        boxWidth = boxHeight * aspectRatio
        // If width is too small, scale up both to meet minBoxSize
        if (boxWidth < minBoxSize) {
          boxWidth = minBoxSize
          boxHeight = boxWidth / aspectRatio
        }
      }

      // Ensure we don't exceed maxBoxSize
      if (boxWidth > maxBoxSize) {
        boxWidth = maxBoxSize
        boxHeight = boxWidth / aspectRatio
      }
      if (boxHeight > maxBoxSize) {
        boxHeight = maxBoxSize
        boxWidth = boxHeight * aspectRatio
      }

      // Calculate position along the edge of the screen
      const centerX = width / 2
      const centerY = height / 2
      const edgePadding = padding + boxWidth / 2

      let x: number, y: number

      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        // No direction, default to top-left
        x = padding
        y = padding
      } else {
        // Calculate intersection with each edge and find the closest one
        const intersections: { x: number; y: number; t: number }[] = []

        // Left edge
        if (dx < 0) {
          const t = (edgePadding - centerX) / dx
          const iy = centerY + t * dy
          if (iy >= padding && iy <= height - padding - boxHeight) {
            intersections.push({ x: padding, y: iy - boxHeight / 2, t: Math.abs(t) })
          }
        }
        // Right edge
        if (dx > 0) {
          const t = (width - edgePadding - centerX) / dx
          const iy = centerY + t * dy
          if (iy >= padding && iy <= height - padding - boxHeight) {
            intersections.push({ x: width - padding - boxWidth, y: iy - boxHeight / 2, t: Math.abs(t) })
          }
        }
        // Top edge
        if (dy < 0) {
          const t = (edgePadding - centerY) / dy
          const ix = centerX + t * dx
          if (ix >= padding && ix <= width - padding - boxWidth) {
            intersections.push({ x: ix - boxWidth / 2, y: padding, t: Math.abs(t) })
          }
        }
        // Bottom edge
        if (dy > 0) {
          const t = (height - edgePadding - centerY) / dy
          const ix = centerX + t * dx
          if (ix >= padding && ix <= width - padding - boxWidth) {
            intersections.push({ x: ix - boxWidth / 2, y: height - padding - boxHeight, t: Math.abs(t) })
          }
        }

        if (intersections.length > 0) {
          // Pick the closest intersection
          intersections.sort((a, b) => a.t - b.t)
          const pos = intersections[0]

          // Clamp to valid range
          x = Math.max(padding, Math.min(width - padding - boxWidth, pos.x))
          y = Math.max(padding, Math.min(height - padding - boxHeight, pos.y))
        } else {
          // Fallback to corner based on direction
          x = dx < 0 ? padding : width - padding - boxWidth
          y = dy < 0 ? padding : height - padding - boxHeight
        }
      }

      // Avoid overlap with previous insets
      for (const used of usedPositions) {
        const overlapX = Math.abs(x - used.x) < Math.max(boxWidth, used.w) + 4
        const overlapY = Math.abs(y - used.y) < Math.max(boxHeight, used.h) + 4
        if (overlapX && overlapY) {
          // Shift along the edge
          if (y <= padding + 1 || y >= height - padding - boxHeight - 1) {
            // On top/bottom edge, shift horizontally
            x += boxWidth + 4
            if (x > width - padding - boxWidth) x = padding
          } else {
            // On left/right edge, shift vertically
            y += boxHeight + 4
            if (y > height - padding - boxHeight) y = padding
          }
        }
      }

      usedPositions.push({ x, y, w: boxWidth, h: boxHeight })

      // Create projection centered on this group and fit to the box
      const insetProjection = geoAzimuthalEqualArea()
        .rotate([-groupCenter[0], -groupCenter[1]])
        .fitExtent(
          [[contentPadding, contentPadding], [boxWidth - contentPadding, boxHeight - contentPadding]],
          combinedFeature
        )

      // Cap scale to prevent tiny islands from being blown up huge (Tonga fix)
      const insetScale = insetProjection.scale()
      const maxScale = projectionScale * 2
      if (insetScale > maxScale) {
        insetProjection.scale(maxScale)
        // Re-center after scale change
        const tempPath = geoPath(insetProjection)
        const bounds = tempPath.bounds(combinedFeature)
        const cx = (bounds[0][0] + bounds[1][0]) / 2
        const cy = (bounds[0][1] + bounds[1][1]) / 2
        insetProjection.translate([
          boxWidth / 2 - cx + insetProjection.translate()[0],
          boxHeight / 2 - cy + insetProjection.translate()[1]
        ])
      }

      const insetPath = geoPath(insetProjection)
      // Generate paths for all polygons in the group
      const paths = group.map(poly => insetPath(poly) || '').filter(d => d)

      // Track which edges touch the SVG border (for stroke rendering)
      // Use small tolerance for floating-point precision
      const touchesLeft = x <= 1
      const touchesTop = y <= 1
      const touchesRight = x + boxWidth >= width - 1
      const touchesBottom = y + boxHeight >= height - 1

      return { x, y, w: boxWidth, h: boxHeight, paths, key: `inset-${index}`, touchesLeft, touchesTop, touchesRight, touchesBottom }
    })
  }, [polygonParts, projection, projectionScale, width, height, mode, showInsets])

  // Calculate stroke width based on projection scale
  // Low scale (zoomed out) = thinner strokes, high scale (zoomed in) = normal strokes
  const strokeWidth = useMemo(() => {
    const baseStroke = mode === 'overview' ? 3.0 : 2.5
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

  if ((!targetFeature50m && !targetFeature10m) || !pathGenerator) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a3a5c', borderRadius: '8px' }}>
        <span style={{ color: '#888' }}>Kart ikke tilgjengelig</span>
      </div>
    )
  }

  // Toggle zoom on click
  const handleClick = canToggleZoom
    ? () => {
        if (hasInsets) {
          setShowInsetsState(prev => !prev)
        } else {
          setZoomedOutForContext(prev => !prev)
        }
        onMapClick?.()
      }
    : undefined

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        background: '#1a3a5c',
        borderRadius: '8px',
        width: '100%',
        height: '100%',
        cursor: canToggleZoom ? 'pointer' : 'default'
      }}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleClick}
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

      {/* Define clip paths for inset boxes */}
      <defs>
        {insetBoxes.map(({ w, h, key }) => (
          <clipPath key={`clip-${key}`} id={`clip-${key}`}>
            <rect width={w} height={h} rx={2} />
          </clipPath>
        ))}
      </defs>

      {/* Render inset boxes for overseas territories */}
      {insetBoxes.map(({ x, y, w, h, paths, key, touchesLeft, touchesTop, touchesRight, touchesBottom }) => {
        // Build stroke path only for edges that don't touch the SVG border
        const strokeSegments: string[] = []
        if (!touchesTop) strokeSegments.push(`M0,0 L${w},0`)
        if (!touchesRight) strokeSegments.push(`M${w},0 L${w},${h}`)
        if (!touchesBottom) strokeSegments.push(`M${w},${h} L0,${h}`)
        if (!touchesLeft) strokeSegments.push(`M0,${h} L0,0`)

        return (
          <g key={key} transform={`translate(${x}, ${y})`}>
            {/* Box background */}
            <rect
              width={w}
              height={h}
              fill="#1a3a5c"
            />
            {/* Territory shapes - clipped to box */}
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                clipPath={`url(#clip-${key})`}
                fill="#4ade80"
              />
            ))}
            {/* Stroke only on non-edge sides */}
            {strokeSegments.length > 0 && (
              <path
                d={strokeSegments.join(' ')}
                stroke="#4ade80"
                strokeWidth={1}
                fill="none"
              />
            )}
          </g>
        )
      })}

      {/* Hint text for toggling zoom (only in quiz mode, not overview) */}
      {canToggleZoom && mode !== 'overview' && (
        <text
          x={width - 6}
          y={height - 6}
          textAnchor="end"
          fill="#ffffff40"
          fontSize="10"
          style={{ pointerEvents: 'none' }}
        >
          {hasInsets
            ? (showInsets ? 'Klikk for å zoome ut' : 'Klikk for å zoome inn')
            : (zoomedOutForContext ? 'Klikk for å zoome inn' : 'Klikk for å zoome ut')
          }
        </text>
      )}
    </svg>
  )
}

// Memoized export to prevent unnecessary re-renders
export const CountryMap = memo(CountryMapInner)
