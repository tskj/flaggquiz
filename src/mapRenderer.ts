/**
 * Shared map rendering logic used by both CountryMap (browser) and prerender script (Node.js)
 */
import { geoPath, geoAzimuthalEqualArea, geoCentroid, geoBounds, geoArea } from 'd3-geo'
import type { Feature, Geometry, Polygon } from 'geojson'

// Colors
export const OCEAN_COLOR = '#1a3a5c'
export const NEIGHBOR_COLOR = '#2d2d44'
export const COUNTRY_COLOR = '#4ade80'

// Countries where insets don't make sense - just show everything in the main view
export const countriesWithoutInsets = ['Bahamas', 'Canada', 'Denmark', 'Solomon Islands', 'Marshall Islands', 'Kiribati']

// Small island nations that need extra zoom (spread out but tiny land area)
export const countriesNeedingExtraZoom: Record<string, number> = {
  'Palau': 3.0,
  'Kiribati': 6.0,
  'Tuvalu': 4.0,
  'Marshall Islands': 4.0,
  'Maldives': 5.0,
}

export interface PolygonParts {
  mainForProjection: Feature<Polygon>
  mainForRendering: Feature<Polygon>
  nearbyPolygons: Feature<Polygon>[]
  tinyDistantIslands: Feature<Polygon>[]
  insets: Feature<Polygon>[]
  insetGroups: Feature<Polygon>[][]
  spansDateLine: boolean
}

// Clip a polygon to only include coordinates in the eastern part (for projection calculation)
export function clipToEasternHemisphere(poly: Feature<Polygon>): Feature<Polygon> {
  const coords = poly.geometry.coordinates[0]
  const clippedCoords = coords.filter(point => point[0] > 0)

  if (clippedCoords.length < 4) {
    return poly
  }

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
export function groupNearbyPolygons(polygons: Feature<Polygon>[]): Feature<Polygon>[][] {
  if (polygons.length === 0) return []
  if (polygons.length === 1) return [polygons]

  const polygonsWithBounds = polygons.map(p => ({
    poly: p,
    bounds: geoBounds(p),
    centroid: geoCentroid(p)
  }))

  const groups: Feature<Polygon>[][] = []
  const used = new Set<number>()

  for (let i = 0; i < polygonsWithBounds.length; i++) {
    if (used.has(i)) continue

    const group: Feature<Polygon>[] = [polygonsWithBounds[i].poly]
    used.add(i)

    let foundMore = true
    while (foundMore) {
      foundMore = false
      for (let j = 0; j < polygonsWithBounds.length; j++) {
        if (used.has(j)) continue

        const b = polygonsWithBounds[j]

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
export function getPolygonParts(feat: Feature<Geometry>): PolygonParts {
  const geom = feat.geometry
  if (geom.type === 'Polygon') {
    const poly = feat as Feature<Polygon>
    // Filter out corrupted polygons (area > 1 steradian is bogus data)
    if (geoArea(poly) > 1) {
      return {
        mainForProjection: poly,
        mainForRendering: poly,
        nearbyPolygons: [],
        tinyDistantIslands: [],
        insets: [],
        insetGroups: [],
        spansDateLine: false
      }
    }
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
    // Filter out corrupted polygons (area > 1 steradian is bogus data covering hemispheres)
    // Strip inner rings (holes) for Kazakhstan - the Aral Sea hole looks weird
    const isKazakhstan = (feat as { id?: string }).id === '398'
    const polygons: { poly: Feature<Polygon>; area: number }[] = geom.coordinates
      .map(coords => {
        const poly: Feature<Polygon> = {
          type: 'Feature',
          properties: feat.properties,
          geometry: { type: 'Polygon', coordinates: isKazakhstan ? [coords[0]] : coords }
        }
        return { poly, area: geoArea(poly) }
      })
      .filter(({ area }) => area < 1) // Remove bogus hemisphere-covering polygons

    polygons.sort((a, b) => b.area - a.area)

    const mainForRendering = polygons[0].poly
    let mainForProjection = mainForRendering
    const mainArea = polygons[0].area

    const mainCoords = mainForRendering.geometry.coordinates[0]
    const lngs = mainCoords.map(p => p[0])
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const crossesDateLine = minLng < -90 && maxLng > 90

    if (crossesDateLine) {
      mainForProjection = clipToEasternHemisphere(mainForRendering)
    }

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
      const polyLng = geoCentroid(poly)[0]
      const polySpansDateLine = (mainLng > 0 && polyLng < -90) || (mainLng < 0 && polyLng > 90)

      if (polySpansDateLine) {
        nearbyPolygons.push(poly)
        continue
      }

      const bounds = geoBounds(poly)
      const isDistant =
        bounds[1][0] < paddedBounds.minLng ||
        bounds[0][0] > paddedBounds.maxLng ||
        bounds[1][1] < paddedBounds.minLat ||
        bounds[0][1] > paddedBounds.maxLat

      if (isDistant) {
        if (area >= mainArea * 0.001) {
          insets.push(poly)
        } else if (area >= mainArea * 0.0002) {
          tinyDistantIslands.push(poly)
        }
      } else {
        nearbyPolygons.push(poly)
      }
    }

    const insetGroups = groupNearbyPolygons(insets)

    return { mainForProjection, mainForRendering, nearbyPolygons, tinyDistantIslands, insets, insetGroups, spansDateLine: crossesDateLine }
  }

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

// Fixed global zoom level for "see where in the world" view
export const GLOBAL_CONTEXT_ZOOM = 250

interface InsetBox {
  x: number
  y: number
  w: number
  h: number
  paths: string[]
  touchesLeft: boolean
  touchesTop: boolean
  touchesRight: boolean
  touchesBottom: boolean
}

/**
 * Calculate inset boxes for overseas territories
 */
function calculateInsetBoxes(
  polygonParts: PolygonParts,
  projection: ReturnType<typeof geoAzimuthalEqualArea>,
  projectionScale: number,
  width: number,
  height: number,
  scaleFactor: number
): InsetBox[] {
  if (polygonParts.insetGroups.length === 0) return []

  const padding = 0  // Glued to the edge
  const mainCentroid = geoCentroid(polygonParts.mainForProjection)
  const mainScreen = projection(mainCentroid)
  if (!mainScreen) return []

  const usedPositions: { x: number; y: number; w: number; h: number }[] = []

  return polygonParts.insetGroups.map((group) => {
    const combinedFeature: Feature<Geometry> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: group.map(p => p.geometry.coordinates)
      }
    }

    const groupCentroid = geoCentroid(combinedFeature)
    const groupScreen = projection(groupCentroid)

    let dx: number, dy: number
    if (groupScreen) {
      dx = groupScreen[0] - mainScreen[0]
      dy = groupScreen[1] - mainScreen[1]
    } else {
      dx = groupCentroid[0] - mainCentroid[0]
      dy = -(groupCentroid[1] - mainCentroid[1])
    }

    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > 0) {
      dx /= length
      dy /= length
    }

    const groupCenter = groupCentroid
    const minBoxSize = 30 * scaleFactor
    const maxBoxSize = 60 * scaleFactor
    const contentPadding = 4 * scaleFactor

    const testProjection = geoAzimuthalEqualArea()
      .rotate([-groupCenter[0], -groupCenter[1]])
      .fitSize([maxBoxSize - contentPadding * 2, maxBoxSize - contentPadding * 2], combinedFeature)

    const testPath = geoPath(testProjection)
    const bounds = testPath.bounds(combinedFeature)
    const naturalWidth = Math.max(1, bounds[1][0] - bounds[0][0])
    const naturalHeight = Math.max(1, bounds[1][1] - bounds[0][1])

    const aspectRatio = naturalWidth / naturalHeight
    let boxWidth: number, boxHeight: number

    if (aspectRatio > 1) {
      boxWidth = Math.min(maxBoxSize, naturalWidth + contentPadding * 2)
      boxHeight = boxWidth / aspectRatio
      if (boxHeight < minBoxSize) {
        boxHeight = minBoxSize
        boxWidth = boxHeight * aspectRatio
      }
    } else {
      boxHeight = Math.min(maxBoxSize, naturalHeight + contentPadding * 2)
      boxWidth = boxHeight * aspectRatio
      if (boxWidth < minBoxSize) {
        boxWidth = minBoxSize
        boxHeight = boxWidth / aspectRatio
      }
    }

    if (boxWidth > maxBoxSize) {
      boxWidth = maxBoxSize
      boxHeight = boxWidth / aspectRatio
    }
    if (boxHeight > maxBoxSize) {
      boxHeight = maxBoxSize
      boxWidth = boxHeight * aspectRatio
    }

    const centerX = width / 2
    const centerY = height / 2
    const edgePadding = padding + boxWidth / 2

    let x: number, y: number

    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      x = padding
      y = padding
    } else {
      const intersections: { x: number; y: number; t: number }[] = []

      if (dx < 0) {
        const t = (edgePadding - centerX) / dx
        const iy = centerY + t * dy
        if (iy >= padding && iy <= height - padding - boxHeight) {
          intersections.push({ x: padding, y: iy - boxHeight / 2, t: Math.abs(t) })
        }
      }
      if (dx > 0) {
        const t = (width - edgePadding - centerX) / dx
        const iy = centerY + t * dy
        if (iy >= padding && iy <= height - padding - boxHeight) {
          intersections.push({ x: width - padding - boxWidth, y: iy - boxHeight / 2, t: Math.abs(t) })
        }
      }
      if (dy < 0) {
        const t = (edgePadding - centerY) / dy
        const ix = centerX + t * dx
        if (ix >= padding && ix <= width - padding - boxWidth) {
          intersections.push({ x: ix - boxWidth / 2, y: padding, t: Math.abs(t) })
        }
      }
      if (dy > 0) {
        const t = (height - edgePadding - centerY) / dy
        const ix = centerX + t * dx
        if (ix >= padding && ix <= width - padding - boxWidth) {
          intersections.push({ x: ix - boxWidth / 2, y: height - padding - boxHeight, t: Math.abs(t) })
        }
      }

      if (intersections.length > 0) {
        intersections.sort((a, b) => a.t - b.t)
        const pos = intersections[0]
        x = Math.max(padding, Math.min(width - padding - boxWidth, pos.x))
        y = Math.max(padding, Math.min(height - padding - boxHeight, pos.y))
      } else {
        x = dx < 0 ? padding : width - padding - boxWidth
        y = dy < 0 ? padding : height - padding - boxHeight
      }
    }

    for (const used of usedPositions) {
      const overlapX = Math.abs(x - used.x) < Math.max(boxWidth, used.w) + 4 * scaleFactor
      const overlapY = Math.abs(y - used.y) < Math.max(boxHeight, used.h) + 4 * scaleFactor
      if (overlapX && overlapY) {
        if (y <= padding + 1 || y >= height - padding - boxHeight - 1) {
          x += boxWidth + 4 * scaleFactor
          if (x > width - padding - boxWidth) x = padding
        } else {
          y += boxHeight + 4 * scaleFactor
          if (y > height - padding - boxHeight) y = padding
        }
      }
    }

    usedPositions.push({ x, y, w: boxWidth, h: boxHeight })

    const insetProjection = geoAzimuthalEqualArea()
      .rotate([-groupCenter[0], -groupCenter[1]])
      .fitExtent(
        [[contentPadding, contentPadding], [boxWidth - contentPadding, boxHeight - contentPadding]],
        combinedFeature
      )

    const insetScale = insetProjection.scale()
    const maxScale = projectionScale * 2
    if (insetScale > maxScale) {
      insetProjection.scale(maxScale)
      const tempPath = geoPath(insetProjection)
      const newBounds = tempPath.bounds(combinedFeature)
      const cx = (newBounds[0][0] + newBounds[1][0]) / 2
      const cy = (newBounds[0][1] + newBounds[1][1]) / 2
      insetProjection.translate([
        boxWidth / 2 - cx + insetProjection.translate()[0],
        boxHeight / 2 - cy + insetProjection.translate()[1]
      ])
    }

    const insetPath = geoPath(insetProjection)
    const paths = group.map(poly => insetPath(poly) || '').filter(d => d)

    const touchesLeft = x <= 1
    const touchesTop = y <= 1
    const touchesRight = x + boxWidth >= width - 1
    const touchesBottom = y + boxHeight >= height - 1

    return { x, y, w: boxWidth, h: boxHeight, paths, touchesLeft, touchesTop, touchesRight, touchesBottom }
  })
}

export interface RenderMapOptions {
  width: number
  height: number
  mode: 'quiz' | 'overview'
  variant?: 'default' | 'zoomed-out'  // default = with insets, zoomed-out = show all or global context
  scaleFactor?: number  // For retina rendering (e.g., 2 for 2x)
}

export interface RenderMapResult {
  svg: string
  projection: ReturnType<typeof geoAzimuthalEqualArea>
  pathGenerator: ReturnType<typeof geoPath>
  polygonParts: PolygonParts
  strokeWidth: number
}

/**
 * Generate SVG string for a country map
 */
export function renderMapToSVG(
  country: string,
  targetFeature: Feature<Geometry>,
  neighborFeatures: Feature<Geometry>[],
  targetISO: string,
  options: RenderMapOptions
): RenderMapResult | null {
  const { mode, variant = 'default', scaleFactor = 1 } = options
  const width = options.width * scaleFactor
  const height = options.height * scaleFactor

  const polygonParts = getPolygonParts(targetFeature)
  if (!polygonParts) return null

  const forceNoInsets = countriesWithoutInsets.includes(country)
  const hasInsets = !forceNoInsets && polygonParts.insets.length > 0

  // Determine if we should show insets (only for default variant in quiz mode)
  const showInsets = mode === 'quiz' && variant === 'default' && hasInsets

  // Determine if we should use global context zoom (zoomed-out variant for non-inset countries)
  const useGlobalZoom = mode === 'quiz' && variant === 'zoomed-out' && !hasInsets

  const extraZoom = countriesNeedingExtraZoom[country] || 1.0
  // Overview mode: 0.85 fits country with some context
  // Quiz mode: 0.5 shows more context for guessing
  const baseZoomFactor = mode === 'overview' ? 0.85 * extraZoom : 0.5 * extraZoom
  const paddingPx = (mode === 'overview' ? 4 : 10) * scaleFactor

  const mainArea = geoArea(polygonParts.nearbyPolygons[0])

  // When showing insets or in overview mode, only use nearby polygons for fitting
  // When zoomed out (no insets), include ALL polygons for centering/fitting
  const allPolygons = showInsets || mode === 'overview'
    ? polygonParts.nearbyPolygons
    : [...polygonParts.nearbyPolygons, ...polygonParts.insets]

  const significantPolygons = showInsets || mode === 'overview'
    ? allPolygons.filter(p => geoArea(p) >= mainArea * 0.01)
    : allPolygons

  const significantFeature: Feature<Geometry> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: significantPolygons.map(p => p.geometry.coordinates)
    }
  }

  const centerFeature = extraZoom > 1 ? polygonParts.mainForProjection : significantFeature
  const center = geoCentroid(centerFeature)

  const projection = geoAzimuthalEqualArea()
    .rotate([-center[0], -center[1]])
    .fitExtent(
      [[paddingPx, paddingPx], [width - paddingPx, height - paddingPx]],
      significantFeature
    )

  const currentScale = projection.scale()
  // Use fixed global zoom for context view, otherwise use the calculated zoom factor
  const finalScale = useGlobalZoom ? GLOBAL_CONTEXT_ZOOM * scaleFactor : currentScale * baseZoomFactor
  projection.scale(finalScale)
  projection.translate([width / 2, height / 2])

  const pathGenerator = geoPath(projection)

  // Calculate stroke width based on scale
  const baseStroke = mode === 'overview' ? 3.0 : 2.5
  const referenceScale = 3000
  const strokeWidth = Math.max(0.8, Math.min(baseStroke, baseStroke * (finalScale / referenceScale))) * scaleFactor

  // Generate neighbor paths (using 50m data which has no corruption issues)
  const neighborPaths = neighborFeatures
    .filter(f => (f as { id?: string }).id !== targetISO)
    .map(f => pathGenerator(f))
    .filter((d): d is string => d !== null)

  // Generate target paths
  // When showing insets, only render nearby polygons (insets go in boxes)
  // When zoomed out, render everything
  const polygonsToRender = showInsets
    ? [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands]
    : [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands, ...polygonParts.insets]

  const targetPaths = polygonsToRender
    .map(poly => pathGenerator(poly))
    .filter((d): d is string => d !== null)

  // Calculate inset boxes (only for quiz mode default variant with insets)
  const insetBoxes = showInsets
    ? calculateInsetBoxes(polygonParts, projection, finalScale, width, height, scaleFactor)
    : []

  // Generate inset box SVG
  const insetSvg = insetBoxes.map(({ x, y, w, h, paths, touchesLeft, touchesTop, touchesRight, touchesBottom }) => {
    const strokeSegments: string[] = []
    if (!touchesTop) strokeSegments.push(`M0,0 L${w},0`)
    if (!touchesRight) strokeSegments.push(`M${w},0 L${w},${h}`)
    if (!touchesBottom) strokeSegments.push(`M${w},${h} L0,${h}`)
    if (!touchesLeft) strokeSegments.push(`M0,${h} L0,0`)

    return `<g transform="translate(${x}, ${y})">
    <rect width="${w}" height="${h}" fill="${OCEAN_COLOR}"/>
    <defs><clipPath id="clip-${x}-${y}"><rect width="${w}" height="${h}" rx="2"/></clipPath></defs>
    ${paths.map(d => `<path d="${d}" clip-path="url(#clip-${x}-${y})" fill="${COUNTRY_COLOR}"/>`).join('\n    ')}
    ${strokeSegments.length > 0 ? `<path d="${strokeSegments.join(' ')}" stroke="${COUNTRY_COLOR}" stroke-width="1" fill="none"/>` : ''}
  </g>`
  }).join('\n  ')

  // Build SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${OCEAN_COLOR}"/>
  ${neighborPaths.map(d => `<path d="${d}" fill="${NEIGHBOR_COLOR}" stroke="${OCEAN_COLOR}" stroke-width="${strokeWidth}"/>`).join('\n  ')}
  ${targetPaths.map(d => `<path d="${d}" fill="${COUNTRY_COLOR}"/>`).join('\n  ')}
  ${insetSvg}
</svg>`

  return {
    svg,
    projection,
    pathGenerator,
    polygonParts,
    strokeWidth
  }
}

// Re-export d3-geo functions for use by CountryMap
export { geoPath, geoAzimuthalEqualArea, geoCentroid, geoBounds, geoArea }
