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
    const polygons: { poly: Feature<Polygon>; area: number }[] = geom.coordinates.map(coords => {
      const poly: Feature<Polygon> = {
        type: 'Feature',
        properties: feat.properties,
        geometry: { type: 'Polygon', coordinates: coords }
      }
      return { poly, area: geoArea(poly) }
    })

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

export interface RenderMapOptions {
  width: number
  height: number
  mode: 'quiz' | 'overview'
  showInsets?: boolean
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
  const { mode, showInsets = true, scaleFactor = 1 } = options
  const width = options.width * scaleFactor
  const height = options.height * scaleFactor

  const extraZoom = countriesNeedingExtraZoom[country] || 1.0
  // Overview mode: 0.7 shows country with neighbors visible around edges
  // Quiz mode: 0.5 shows more context for guessing
  const baseZoomFactor = mode === 'overview' ? 0.7 * extraZoom : 0.5 * extraZoom
  const paddingPx = (mode === 'overview' ? 4 : 10) * scaleFactor

  const polygonParts = getPolygonParts(targetFeature)
  if (!polygonParts) return null

  const forceNoInsets = countriesWithoutInsets.includes(country)
  const effectiveShowInsets = forceNoInsets ? false : showInsets

  const mainArea = geoArea(polygonParts.nearbyPolygons[0])

  // When insets are hidden, include ALL polygons for centering/fitting
  const allPolygons = effectiveShowInsets
    ? polygonParts.nearbyPolygons
    : [...polygonParts.nearbyPolygons, ...polygonParts.insets]

  const significantPolygons = effectiveShowInsets
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
  const finalScale = currentScale * baseZoomFactor
  projection.scale(finalScale)
  projection.translate([width / 2, height / 2])

  const pathGenerator = geoPath(projection)

  // Calculate stroke width based on scale
  const baseStroke = mode === 'overview' ? 3.0 : 2.5
  const referenceScale = 3000
  const strokeWidth = Math.max(0.8, Math.min(baseStroke, baseStroke * (finalScale / referenceScale))) * scaleFactor

  // Generate neighbor paths
  const neighborPaths = neighborFeatures
    .filter(f => (f as { id?: string }).id !== targetISO)
    .map(f => pathGenerator(f))
    .filter((d): d is string => d !== null)

  // Generate target paths
  const polygonsToRender = effectiveShowInsets
    ? [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands]
    : [...polygonParts.nearbyPolygons, ...polygonParts.tinyDistantIslands, ...polygonParts.insets]

  const targetPaths = polygonsToRender
    .map(poly => pathGenerator(poly))
    .filter((d): d is string => d !== null)

  // Build SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${OCEAN_COLOR}"/>
  ${neighborPaths.map(d => `<path d="${d}" fill="${NEIGHBOR_COLOR}" stroke="${OCEAN_COLOR}" stroke-width="${strokeWidth}"/>`).join('\n  ')}
  ${targetPaths.map(d => `<path d="${d}" fill="${COUNTRY_COLOR}"/>`).join('\n  ')}
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
