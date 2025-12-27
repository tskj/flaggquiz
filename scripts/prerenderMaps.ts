#!/usr/bin/env npx tsx
/**
 * Pre-renders country map thumbnails as PNG files for faster loading.
 * Uses the same rendering logic as CountryMap.tsx via the shared mapRenderer module.
 *
 * Run with: npx tsx scripts/prerenderMaps.ts
 */

import { renderMapToSVG } from '../src/mapRenderer'
import { countryToISO } from '../src/countryISOCodes'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'maps')

// TopoJSON URLs
const TOPOJSON_URL_10M = 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json'
const TOPOJSON_URL_50M = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json'

// Sizes to generate (display size - we render at 2x for retina)
// These should match PrerenderedCountryMap.tsx PRERENDERED_SIZES
const SIZES: { width: number; height: number; mode: 'quiz' | 'overview'; variant?: 'default' | 'zoomed-out' }[] = [
  { width: 128, height: 85, mode: 'overview' },   // Results thumbnails
  { width: 200, height: 133, mode: 'overview' },  // Capital choice quiz options
  { width: 672, height: 378, mode: 'quiz', variant: 'default' },     // Main quiz view - default (with insets if applicable)
  { width: 672, height: 378, mode: 'quiz', variant: 'zoomed-out' },  // Main quiz view - zoomed out (all territories or global context)
]

// Render at 2x resolution for sharper display on retina screens
const SCALE_FACTOR = 2

async function svgToPng(svg: string, outputPath: string): Promise<void> {
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)
}

async function main() {
  console.log('Fetching TopoJSON data...')

  // Fetch both resolutions - prioritize 10m (high res) for target country
  const [response10m, response50m] = await Promise.all([
    fetch(TOPOJSON_URL_10M),
    fetch(TOPOJSON_URL_50M)
  ])
  const [topo10m, topo50m] = await Promise.all([
    response10m.json() as Promise<Topology>,
    response50m.json() as Promise<Topology>
  ])

  const geoData10m = feature(topo10m, topo10m.objects.countries as GeometryCollection) as FeatureCollection
  const geoData50m = feature(topo50m, topo50m.objects.countries as GeometryCollection) as FeatureCollection

  console.log(`Loaded ${geoData10m.features.length} features (10m), ${geoData50m.features.length} features (50m)`)

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const countries = Object.keys(countryToISO)
  let generated = 0
  let skipped = 0

  console.log(`\nGenerating maps for ${countries.length} countries...`)

  // Use 50m for neighbors - simpler and no corrupted polygon issues
  const neighborFeatures = geoData50m.features as Feature<Geometry>[]

  for (const country of countries) {
    const iso = countryToISO[country]

    // Always prefer 10m data (more detailed), fall back to 50m
    let countryFeature = geoData10m.features.find(f => f.id === iso) as Feature<Geometry> | undefined
    if (!countryFeature) {
      countryFeature = geoData50m.features.find(f => f.id === iso) as Feature<Geometry> | undefined
    }

    if (!countryFeature) {
      console.log(`  Skipped: ${country} (no map data in either resolution)`)
      skipped++
      continue
    }

    // Sanitize country name for filename
    const safeName = country.replace(/[^a-zA-Z0-9-]/g, '_')

    for (const { width, height, mode, variant } of SIZES) {
      const result = renderMapToSVG(
        country,
        countryFeature,
        neighborFeatures,
        iso,
        {
          width,
          height,
          mode,
          variant: variant ?? 'default',
          scaleFactor: SCALE_FACTOR
        }
      )

      if (!result) {
        console.log(`  Skipped: ${country} ${width}x${height} ${mode} (SVG generation failed)`)
        continue
      }

      // Include variant suffix for quiz mode
      const variantSuffix = mode === 'quiz' && variant ? `-${variant}` : ''
      const outputPath = path.join(OUTPUT_DIR, `${safeName}-${width}x${height}-${mode}${variantSuffix}.png`)
      await svgToPng(result.svg, outputPath)
    }

    generated++

    // Progress indicator
    if (generated % 20 === 0) {
      console.log(`  Generated ${generated}/${countries.length} countries...`)
    }
  }

  console.log(`\nDone! Generated maps for ${generated} countries, skipped ${skipped}`)
  console.log(`Output directory: ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
