#!/usr/bin/env npx tsx
/**
 * Downloads IHO sea boundary data from Marine Regions WFS service.
 * Saves as GeoJSON for use in sea map prerendering.
 *
 * Data source: Marine Regions (marineregions.org) - CC-BY license
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'sea-boundaries.json')

// Map our quiz sea names to IHO sea names
// Some seas need multiple IHO regions combined
const SEA_NAME_MAP: Record<string, string[]> = {
  // Major Oceans
  'Pacific Ocean': ['North Pacific Ocean', 'South Pacific Ocean'],
  'Atlantic Ocean': ['North Atlantic Ocean', 'South Atlantic Ocean'],
  'Indian Ocean': ['Indian Ocean'],
  'Arctic Ocean': ['Arctic Ocean'],
  'Southern Ocean': ['Southern Ocean'],

  // European Seas
  'Mediterranean Sea': ['Mediterranean Sea - Eastern Basin', 'Mediterranean Sea - Western Basin'],
  'North Sea': ['North Sea'],
  'Baltic Sea': ['Baltic Sea'],
  'Black Sea': ['Black Sea'],
  // Caspian Sea is not in IHO (it's a lake) - will use fallback
  'Adriatic Sea': ['Adriatic Sea'],
  'Aegean Sea': ['Aegean Sea'],
  'Barents Sea': ['Barentsz Sea'],  // Different spelling in IHO
  'Norwegian Sea': ['Norwegian Sea'],

  // American Seas
  'Caribbean Sea': ['Caribbean Sea'],
  'Gulf of Mexico': ['Gulf of Mexico'],
  'Hudson Bay': ['Hudson Bay'],
  'Gulf of California': ['Gulf of California'],

  // Asian Seas
  'South China Sea': ['South China Sea'],
  'East China Sea': ['Eastern China Sea'],  // Different name in IHO
  'Sea of Japan': ['Japan Sea'],  // Different name in IHO
  'Bay of Bengal': ['Bay of Bengal'],
  'Arabian Sea': ['Arabian Sea'],
  'Red Sea': ['Red Sea'],
  'Persian Gulf': ['Persian Gulf'],
  'Sea of Okhotsk': ['Sea of Okhotsk'],
  'Bering Sea': ['Bering Sea'],
  'Yellow Sea': ['Yellow Sea'],
  'Philippine Sea': ['Philippine Sea'],

  // African/Oceanian Seas
  'Coral Sea': ['Coral Sea'],
  'Tasman Sea': ['Tasman Sea'],
  'Gulf of Aden': ['Gulf of Aden'],
  'Mozambique Channel': ['Mozambique Channel'],
}

const WFS_BASE = 'https://geo.vliz.be/geoserver/MarineRegions/wfs'

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    name: string
    [key: string]: unknown
  }
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

async function fetchSeaBoundary(ihoName: string): Promise<GeoJSONFeature | null> {
  const encodedName = encodeURIComponent(ihoName)
  const url = `${WFS_BASE}?service=WFS&version=1.0.0&request=GetFeature&typeName=MarineRegions:iho&outputformat=json&cql_filter=name='${encodedName}'`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`  Failed to fetch ${ihoName}: ${response.status}`)
      return null
    }

    const data = await response.json() as GeoJSONCollection
    if (data.features.length === 0) {
      console.warn(`  No data found for ${ihoName}`)
      return null
    }

    return data.features[0]
  } catch (error) {
    console.warn(`  Error fetching ${ihoName}:`, error)
    return null
  }
}

// Simplify coordinates by keeping every Nth point and reducing precision
function simplifyRing(coords: number[][], factor: number): number[][] {
  if (coords.length <= 10) return coords.map(c => [
    Math.round(c[0] * 100) / 100,
    Math.round(c[1] * 100) / 100
  ])

  const result: number[][] = []
  for (let i = 0; i < coords.length; i += factor) {
    // Round to 2 decimal places (about 1km precision - plenty for our use)
    result.push([
      Math.round(coords[i][0] * 100) / 100,
      Math.round(coords[i][1] * 100) / 100
    ])
  }
  // Ensure polygon closes
  if (result.length > 0) {
    const last = coords[coords.length - 1]
    const lastSimplified = [Math.round(last[0] * 100) / 100, Math.round(last[1] * 100) / 100]
    if (result[result.length - 1][0] !== lastSimplified[0] || result[result.length - 1][1] !== lastSimplified[1]) {
      result.push(lastSimplified)
    }
  }
  return result
}

function simplifyGeometry(geom: GeoJSONFeature['geometry'], factor: number = 5): GeoJSONFeature['geometry'] {
  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: (geom.coordinates as number[][][]).map(ring => simplifyRing(ring, factor))
    }
  } else if (geom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: (geom.coordinates as number[][][][]).map(polygon =>
        polygon.map(ring => simplifyRing(ring, factor))
      )
    }
  }
  return geom
}

function mergeGeometries(features: GeoJSONFeature[]): GeoJSONFeature['geometry'] | null {
  if (features.length === 0) return null
  if (features.length === 1) return simplifyGeometry(features[0].geometry)

  // Merge multiple geometries into a MultiPolygon
  const allCoords: number[][][][] = []

  for (const feature of features) {
    const simplified = simplifyGeometry(feature.geometry)
    if (simplified.type === 'Polygon') {
      allCoords.push(simplified.coordinates as number[][][])
    } else if (simplified.type === 'MultiPolygon') {
      allCoords.push(...(simplified.coordinates as number[][][][]))
    }
  }

  return {
    type: 'MultiPolygon',
    coordinates: allCoords
  }
}

async function main() {
  console.log('Downloading IHO sea boundaries from Marine Regions...')
  console.log('Data source: marineregions.org (CC-BY license)\n')

  const seaBoundaries: Record<string, GeoJSONFeature['geometry']> = {}

  for (const [quizName, ihoNames] of Object.entries(SEA_NAME_MAP)) {
    console.log(`Fetching: ${quizName}`)

    const features: GeoJSONFeature[] = []

    for (const ihoName of ihoNames) {
      console.log(`  - ${ihoName}`)
      const feature = await fetchSeaBoundary(ihoName)
      if (feature) {
        features.push(feature)
      }
      // Small delay to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const merged = mergeGeometries(features)
    if (merged) {
      seaBoundaries[quizName] = merged
      console.log(`  ✓ Got boundary`)
    } else {
      console.log(`  ✗ No boundary available`)
    }
  }

  // Save to file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(seaBoundaries, null, 2))

  const count = Object.keys(seaBoundaries).length
  console.log(`\nDone! Saved ${count} sea boundaries to ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
