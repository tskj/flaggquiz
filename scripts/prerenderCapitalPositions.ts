#!/usr/bin/env npx tsx
/**
 * Pre-computes capital marker screen positions for prerendered maps.
 * This allows PrerenderedCountryMap to overlay capitals without loading GeoJSON.
 *
 * Run with: npx tsx scripts/prerenderCapitalPositions.ts
 */

import { projectCapitalToScreen } from '../src/mapRenderer'
import { countryToISO } from '../src/countryISOCodes'
import { capitalCoordinates } from '../src/europeanCapitals'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'capitalScreenPositions.json')

const TOPOJSON_URL_10M = 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json'
const TOPOJSON_URL_50M = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json'

// Size and variants to precompute (must match PrerenderedCountryMap)
const CONFIG = {
  width: 672,
  height: 378,
  mode: 'quiz' as const,
  variants: ['default', 'zoomed-out'] as const
}

interface CapitalPosition {
  x: number
  y: number
  radius: number
}

type CapitalPositions = Record<string, Record<'default' | 'zoomed-out', CapitalPosition | null>>

async function main() {
  console.log('Fetching TopoJSON data...')

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

  console.log(`Loaded ${geoData10m.features.length} features`)

  const positions: CapitalPositions = {}
  let computed = 0
  let skipped = 0

  const countries = Object.keys(capitalCoordinates)
  console.log(`\nComputing positions for ${countries.length} capitals...`)

  for (const country of countries) {
    const coords = capitalCoordinates[country]
    const iso = countryToISO[country]

    if (!iso) {
      console.log(`  Skipped: ${country} (no ISO code)`)
      skipped++
      continue
    }

    // Prefer 10m data, fall back to 50m
    let countryFeature = geoData10m.features.find(f => f.id === iso) as Feature<Geometry> | undefined
    if (!countryFeature) {
      countryFeature = geoData50m.features.find(f => f.id === iso) as Feature<Geometry> | undefined
    }

    if (!countryFeature) {
      console.log(`  Skipped: ${country} (no map data)`)
      skipped++
      continue
    }

    positions[country] = {
      'default': null,
      'zoomed-out': null
    }

    for (const variant of CONFIG.variants) {
      const pos = projectCapitalToScreen(country, countryFeature, coords, {
        width: CONFIG.width,
        height: CONFIG.height,
        mode: CONFIG.mode,
        variant,
        scaleFactor: 1  // Screen coordinates, not retina
      })

      if (pos) {
        // Round to 1 decimal place to reduce file size
        positions[country][variant] = {
          x: Math.round(pos.x * 10) / 10,
          y: Math.round(pos.y * 10) / 10,
          radius: Math.round(pos.radius * 10) / 10
        }
      }
    }

    computed++
  }

  // Write output
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(positions, null, 2))

  console.log(`\nDone! Computed positions for ${computed} capitals, skipped ${skipped}`)
  console.log(`Output: ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
