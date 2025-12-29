#!/usr/bin/env npx tsx
/**
 * Pre-renders sea map thumbnails as PNG files for faster loading.
 * Uses d3-geo to render maps centered on sea locations.
 *
 * Run with: npx tsx scripts/prerenderSeaMaps.ts
 */

import * as d3 from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, MultiPolygon, Polygon } from 'geojson'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'sea-maps')

// Colors matching the country map quiz theme (from mapRenderer.ts)
const OCEAN_COLOR = '#1a3a5c'
const LAND_COLOR = '#2d2d44'  // Same as NEIGHBOR_COLOR in country maps

// Sea data (copied from seasData.ts to avoid import issues)
interface SeaData {
  name: string
  norwegianName: string
  center: [number, number]
  zoom: number
}

const seas: SeaData[] = [
  // Major Oceans
  { name: 'Pacific Ocean', norwegianName: 'Stillehavet', center: [-160, 0], zoom: 0.5 },
  { name: 'Atlantic Ocean', norwegianName: 'Atlanterhavet', center: [-30, 0], zoom: 0.5 },
  { name: 'Indian Ocean', norwegianName: 'Indiahavet', center: [75, -20], zoom: 0.6 },
  { name: 'Arctic Ocean', norwegianName: 'Nordishavet', center: [0, 85], zoom: 0.8 },
  { name: 'Southern Ocean', norwegianName: 'Sydishavet', center: [0, -65], zoom: 0.6 },

  // European Seas
  { name: 'Mediterranean Sea', norwegianName: 'Middelhavet', center: [18, 35], zoom: 1.5 },
  { name: 'North Sea', norwegianName: 'Nordsjøen', center: [3, 56], zoom: 2.5 },
  { name: 'Baltic Sea', norwegianName: 'Østersjøen', center: [20, 58], zoom: 2.5 },
  { name: 'Black Sea', norwegianName: 'Svartehavet', center: [34, 43], zoom: 2.5 },
  { name: 'Caspian Sea', norwegianName: 'Det kaspiske hav', center: [51, 42], zoom: 2.5 },
  { name: 'Adriatic Sea', norwegianName: 'Adriaterhavet', center: [16, 43], zoom: 3 },
  { name: 'Aegean Sea', norwegianName: 'Egeerhavet', center: [25, 38], zoom: 3 },
  { name: 'Barents Sea', norwegianName: 'Barentshavet', center: [40, 75], zoom: 2 },
  { name: 'Norwegian Sea', norwegianName: 'Norskehavet', center: [5, 68], zoom: 2 },

  // American Seas
  { name: 'Caribbean Sea', norwegianName: 'Karibiske hav', center: [-75, 15], zoom: 2 },
  { name: 'Gulf of Mexico', norwegianName: 'Mexicogolfen', center: [-90, 25], zoom: 2 },
  { name: 'Hudson Bay', norwegianName: 'Hudsonbukta', center: [-85, 60], zoom: 2 },
  { name: 'Gulf of California', norwegianName: 'Californiabukta', center: [-110, 28], zoom: 2.5 },

  // Asian Seas
  { name: 'South China Sea', norwegianName: 'Sørkinahavet', center: [115, 12], zoom: 2 },
  { name: 'East China Sea', norwegianName: 'Østkinahavet', center: [125, 28], zoom: 2.5 },
  { name: 'Sea of Japan', norwegianName: 'Japanhavet', center: [135, 40], zoom: 2.5 },
  { name: 'Bay of Bengal', norwegianName: 'Bengalbukta', center: [88, 15], zoom: 2 },
  { name: 'Arabian Sea', norwegianName: 'Arabiahavet', center: [65, 15], zoom: 2 },
  { name: 'Red Sea', norwegianName: 'Rødehavet', center: [38, 20], zoom: 2.5 },
  { name: 'Persian Gulf', norwegianName: 'Persiabukta', center: [51, 27], zoom: 3 },
  { name: 'Sea of Okhotsk', norwegianName: 'Okhotskhavet', center: [150, 55], zoom: 2 },
  { name: 'Bering Sea', norwegianName: 'Beringhavet', center: [-175, 58], zoom: 2 },
  { name: 'Yellow Sea', norwegianName: 'Gulehavet', center: [123, 36], zoom: 2.5 },
  { name: 'Philippine Sea', norwegianName: 'Filippinerhavet', center: [135, 20], zoom: 1.5 },

  // African/Oceanian Seas
  { name: 'Coral Sea', norwegianName: 'Korallhavet', center: [155, -18], zoom: 2 },
  { name: 'Tasman Sea', norwegianName: 'Tasmanhavet', center: [160, -38], zoom: 2 },
  { name: 'Gulf of Aden', norwegianName: 'Adenbukta', center: [48, 12], zoom: 3 },
  { name: 'Mozambique Channel', norwegianName: 'Mosambikkanalen', center: [42, -18], zoom: 2.5 },
]

// Sizes to generate - render at 2x for retina
const SIZES: { width: number; height: number }[] = [
  { width: 200, height: 112 },   // Results thumbnails
  { width: 672, height: 378 },   // Main quiz view
]

const SCALE_FACTOR = 2

function renderSeaMapSVG(
  features: Feature<MultiPolygon | Polygon>[],
  center: [number, number],
  zoom: number,
  width: number,
  height: number,
  scaleFactor: number
): string {
  const w = width * scaleFactor
  const h = height * scaleFactor

  // Calculate scale based on zoom level
  const baseScale = Math.min(w, h) * 0.8
  const scale = baseScale * zoom

  // Create projection centered on the sea
  const projection = d3.geoAzimuthalEqualArea()
    .center([0, 0])
    .rotate([-center[0], -center[1]])
    .scale(scale)
    .translate([w / 2, h / 2])

  const pathGenerator = d3.geoPath(projection)

  // Generate SVG
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${w}" height="${h}" fill="${OCEAN_COLOR}"/>`

  for (const feature of features) {
    const pathData = pathGenerator(feature)
    if (pathData) {
      svg += `<path d="${pathData}" fill="${LAND_COLOR}" stroke="${OCEAN_COLOR}" stroke-width="${1.0 * scaleFactor}"/>`
    }
  }

  svg += '</svg>'
  return svg
}

async function svgToPng(svg: string, outputPath: string): Promise<void> {
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)
}

async function main() {
  console.log('Fetching TopoJSON data...')

  // Load both 10m (high res) and 110m (stable) data
  // We use 10m features but filter to only those in 110m to avoid projection issues
  const topoJson10mPath = path.join(__dirname, '..', 'public', 'countries-10m.json')
  const topoJson110mPath = path.join(__dirname, '..', 'public', 'countries-110m.json')

  let topology10m: Topology
  let topology110m: Topology

  try {
    const [data10m, data110m] = await Promise.all([
      fs.readFile(topoJson10mPath, 'utf-8'),
      fs.readFile(topoJson110mPath, 'utf-8')
    ])
    topology10m = JSON.parse(data10m) as Topology
    topology110m = JSON.parse(data110m) as Topology
    console.log('Using local high-res data with 110m filtering')
  } catch {
    console.log('Local files not found, fetching from unpkg...')
    const [response10m, response110m] = await Promise.all([
      fetch('https://unpkg.com/world-atlas@2.0.2/countries-10m.json'),
      fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
    ])
    topology10m = await response10m.json() as Topology
    topology110m = await response110m.json() as Topology
  }

  const geoData10m = feature(topology10m, topology10m.objects.countries as GeometryCollection) as FeatureCollection<MultiPolygon | Polygon>
  const geoData110m = feature(topology110m, topology110m.objects.countries as GeometryCollection) as FeatureCollection<MultiPolygon | Polygon>

  // Filter 10m features to only include those in 110m (avoids projection issues with small territories)
  const ids110m = new Set(geoData110m.features.map(f => f.id))
  const features = geoData10m.features.filter(f => ids110m.has(f.id))

  console.log(`Loaded ${features.length} country features (filtered from ${geoData10m.features.length})`)

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  console.log(`\nGenerating maps for ${seas.length} seas...`)

  let generated = 0

  for (const sea of seas) {
    // Sanitize name for filename
    const safeName = sea.name.replace(/[^a-zA-Z0-9-]/g, '_')

    for (const { width, height } of SIZES) {
      const svg = renderSeaMapSVG(features, sea.center, sea.zoom, width, height, SCALE_FACTOR)
      const outputPath = path.join(OUTPUT_DIR, `${safeName}-${width}x${height}.png`)
      await svgToPng(svg, outputPath)
    }

    generated++

    // Progress indicator
    if (generated % 10 === 0) {
      console.log(`  Generated ${generated}/${seas.length} seas...`)
    }
  }

  console.log(`\nDone! Generated maps for ${generated} seas`)
  console.log(`Output directory: ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
