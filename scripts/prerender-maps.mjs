#!/usr/bin/env node
/**
 * Pre-renders country map thumbnails as PNG files for faster loading.
 * Run with: node scripts/prerender-maps.mjs
 *
 * Generates:
 * - public/maps/{country}-80x48.png (for results thumbnails)
 * - public/maps/{country}-120x80.png (for capital choice options)
 */

import { geoPath, geoAzimuthalEqualArea, geoCentroid, geoBounds, geoArea } from 'd3-geo'
import { feature } from 'topojson-client'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'maps')

// TopoJSON URLs (same as CountryMap.tsx)
// We prioritize 10m (high resolution) and fall back to 50m if not available
const TOPOJSON_URL_10M = 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json'
const TOPOJSON_URL_50M = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json'

// Country to ISO code mapping (copied from countryISOCodes.ts)
const countryToISO = {
  // Europe
  "Albania": "008", "Andorra": "020", "Austria": "040", "Belarus": "112", "Belgium": "056",
  "Bosnia and Herzegovina": "070", "Bulgaria": "100", "Croatia": "191", "Cyprus": "196",
  "Czech Republic": "203", "Denmark": "208", "Estonia": "233", "Finland": "246", "France": "250",
  "Germany": "276", "Greece": "300", "Hungary": "348", "Iceland": "352", "Ireland": "372",
  "Italy": "380", "Kosovo": "383", "Latvia": "428", "Liechtenstein": "438", "Lithuania": "440",
  "Luxembourg": "442", "Malta": "470", "Moldova": "498", "Monaco": "492", "Montenegro": "499",
  "Netherlands": "528", "North Macedonia": "807", "Norway": "578", "Poland": "616", "Portugal": "620",
  "Romania": "642", "Russia": "643", "San Marino": "674", "Serbia": "688", "Slovakia": "703",
  "Slovenia": "705", "Spain": "724", "Sweden": "752", "Switzerland": "756", "Ukraine": "804",
  "United Kingdom": "826", "Vatican City": "336",
  // Africa
  "Algeria": "012", "Angola": "024", "Benin": "204", "Botswana": "072", "Burkina Faso": "854",
  "Burundi": "108", "Cameroon": "120", "Cape Verde": "132", "Central African Republic": "140",
  "Chad": "148", "Comoros": "174", "Democratic Republic of the Congo": "180",
  "Republic of the Congo": "178", "Djibouti": "262", "Egypt": "818", "Equatorial Guinea": "226",
  "Eritrea": "232", "Eswatini": "748", "Ethiopia": "231", "Gabon": "266", "Gambia": "270",
  "Ghana": "288", "Guinea": "324", "Guinea-Bissau": "624", "Ivory Coast": "384", "Kenya": "404",
  "Lesotho": "426", "Liberia": "430", "Libya": "434", "Madagascar": "450", "Malawi": "454",
  "Mali": "466", "Mauritania": "478", "Mauritius": "480", "Morocco": "504", "Mozambique": "508",
  "Namibia": "516", "Niger": "562", "Nigeria": "566", "Rwanda": "646", "Sao Tome and Principe": "678",
  "Senegal": "686", "Seychelles": "690", "Sierra Leone": "694", "Somalia": "706", "South Africa": "710",
  "South Sudan": "728", "Sudan": "729", "Tanzania": "834", "Togo": "768", "Tunisia": "788",
  "Uganda": "800", "Zambia": "894", "Zimbabwe": "716",
  // Asia
  "Afghanistan": "004", "Armenia": "051", "Azerbaijan": "031", "Bahrain": "048", "Bangladesh": "050",
  "Bhutan": "064", "Brunei": "096", "Cambodia": "116", "China": "156", "Georgia": "268",
  "India": "356", "Indonesia": "360", "Iran": "364", "Iraq": "368", "Israel": "376", "Japan": "392",
  "Jordan": "400", "Kazakhstan": "398", "Kuwait": "414", "Kyrgyzstan": "417", "Laos": "418",
  "Lebanon": "422", "Malaysia": "458", "Maldives": "462", "Mongolia": "496", "Myanmar": "104",
  "Nepal": "524", "North Korea": "408", "Oman": "512", "Pakistan": "586", "Philippines": "608",
  "Qatar": "634", "Saudi Arabia": "682", "Singapore": "702", "South Korea": "410", "Sri Lanka": "144",
  "Syria": "760", "Taiwan": "158", "Tajikistan": "762", "Thailand": "764", "Timor-Leste": "626",
  "Turkey": "792", "Turkmenistan": "795", "United Arab Emirates": "784", "Uzbekistan": "860",
  "Vietnam": "704", "Yemen": "887",
  // North America
  "Antigua and Barbuda": "028", "Bahamas": "044", "Barbados": "052", "Belize": "084", "Canada": "124",
  "Costa Rica": "188", "Cuba": "192", "Dominica": "212", "Dominican Republic": "214",
  "El Salvador": "222", "Grenada": "308", "Guatemala": "320", "Haiti": "332", "Honduras": "340",
  "Jamaica": "388", "Mexico": "484", "Nicaragua": "558", "Panama": "591",
  "Saint Kitts and Nevis": "659", "Saint Lucia": "662", "Saint Vincent and the Grenadines": "670",
  "Trinidad and Tobago": "780", "United States": "840",
  // South America
  "Argentina": "032", "Bolivia": "068", "Brazil": "076", "Chile": "152", "Colombia": "170",
  "Ecuador": "218", "Guyana": "328", "Paraguay": "600", "Peru": "604", "Suriname": "740",
  "Uruguay": "858", "Venezuela": "862",
  // Oceania
  "Australia": "036", "Fiji": "242", "Kiribati": "296", "Marshall Islands": "584",
  "Micronesia": "583", "Nauru": "520", "New Zealand": "554", "Palau": "585",
  "Papua New Guinea": "598", "Samoa": "882", "Solomon Islands": "090", "Tonga": "776",
  "Tuvalu": "798", "Vanuatu": "548",
  // Territories
  "Greenland": "304", "Palestine": "275", "Sahrawi Arab Democratic Republic": "732",
}

// Countries that need extra zoom for overview mode (spread out islands)
const countriesNeedingExtraZoom = {
  'Palau': 3.0,
  'Kiribati': 6.0,
  'Tuvalu': 4.0,
  'Marshall Islands': 4.0,
}

// Sizes to generate (display size - we render at 2x for retina)
const SIZES = [
  { width: 80, height: 48 },
  { width: 120, height: 80 },
  { width: 200, height: 112 },
]

// Render at 2x resolution for sharper display on retina screens
const SCALE_FACTOR = 2

// Colors (matching CountryMap.tsx)
const OCEAN_COLOR = '#1a3a5c'
const NEIGHBOR_COLOR = '#2d2d44'
const COUNTRY_COLOR = '#4ade80'

/**
 * Clip a polygon to eastern hemisphere (for date-line spanning countries)
 */
function clipToEasternHemisphere(poly) {
  const coords = poly.geometry.coordinates[0]
  const clippedCoords = coords.filter(point => point[0] > 0)

  if (clippedCoords.length < 4) return poly

  const first = clippedCoords[0]
  const last = clippedCoords[clippedCoords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    clippedCoords.push([...first])
  }

  return {
    type: 'Feature',
    properties: poly.properties,
    geometry: { type: 'Polygon', coordinates: [clippedCoords] }
  }
}

/**
 * Extract polygons from a country feature (handles MultiPolygon)
 */
function getPolygonParts(feat) {
  const geom = feat.geometry

  if (geom.type === 'Polygon') {
    const poly = feat
    return {
      mainForProjection: poly,
      nearbyPolygons: [poly],
      spansDateLine: false
    }
  }

  if (geom.type === 'MultiPolygon') {
    const polygons = geom.coordinates.map(coords => {
      const poly = {
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

    // Check for date-line crossing
    const mainCoords = mainForRendering.geometry.coordinates[0]
    const lngs = mainCoords.map(p => p[0])
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const crossesDateLine = minLng < -90 && maxLng > 90

    if (crossesDateLine) {
      mainForProjection = clipToEasternHemisphere(mainForRendering)
    }

    // Get bounds with padding
    const mainBounds = geoBounds(mainForProjection)
    const paddedBounds = {
      minLng: mainBounds[0][0] - 5,
      minLat: mainBounds[0][1] - 5,
      maxLng: mainBounds[1][0] + 5,
      maxLat: mainBounds[1][1] + 5,
    }

    const nearbyPolygons = [mainForRendering]
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

      // For overview mode, include all polygons that are >= 0.1% of main
      // (we want to show overseas territories even in thumbnails)
      if (!isDistant || area >= mainArea * 0.001) {
        nearbyPolygons.push(poly)
      }
    }

    return { mainForProjection, nearbyPolygons, spansDateLine: crossesDateLine }
  }

  return {
    mainForProjection: feat,
    nearbyPolygons: [feat],
    spansDateLine: false
  }
}

/**
 * Generate SVG for a country with neighbors (like quiz mode)
 * Renders at 2x resolution for retina displays
 */
function generateSVG(country, targetFeature, neighborFeatures, displayWidth, displayHeight, targetISO) {
  // Render at 2x for retina sharpness
  const width = displayWidth * SCALE_FACTOR
  const height = displayHeight * SCALE_FACTOR

  const extraZoom = countriesNeedingExtraZoom[country] || 1.0
  // Use 1.0 zoom factor like overview mode (tight crop on country)
  // Neighbors will be visible around the edges
  const zoomFactor = 1.0 * extraZoom
  const paddingPx = 4 * SCALE_FACTOR

  const polygonParts = getPolygonParts(targetFeature)
  if (!polygonParts) return null

  const mainArea = geoArea(polygonParts.nearbyPolygons[0])

  // Filter to significant polygons for centering
  const significantPolygons = polygonParts.nearbyPolygons.filter(p => geoArea(p) >= mainArea * 0.01)

  const significantFeature = {
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
  projection.scale(currentScale * zoomFactor)
  projection.translate([width / 2, height / 2])

  const pathGenerator = geoPath(projection)

  // Calculate stroke width based on scale
  const strokeWidth = Math.max(0.8, Math.min(3.0, 3.0 * (currentScale * zoomFactor / 3000))) * SCALE_FACTOR

  // Generate paths for neighbor countries (rendered first, underneath)
  const neighborPaths = neighborFeatures
    .filter(f => f.id !== targetISO)
    .map(f => pathGenerator(f))
    .filter(d => d)

  // Generate paths for target country polygons
  const targetPaths = polygonParts.nearbyPolygons
    .map(poly => pathGenerator(poly))
    .filter(d => d)

  // Border radius scaled for 2x
  const borderRadius = 4 * SCALE_FACTOR

  // Build SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${OCEAN_COLOR}" rx="${borderRadius}"/>
  ${neighborPaths.map(d => `<path d="${d}" fill="${NEIGHBOR_COLOR}" stroke="${OCEAN_COLOR}" stroke-width="${strokeWidth}"/>`).join('\n  ')}
  ${targetPaths.map(d => `<path d="${d}" fill="${COUNTRY_COLOR}"/>`).join('\n  ')}
</svg>`

  return svg
}

/**
 * Convert SVG to PNG using sharp
 */
async function svgToPng(svg, outputPath) {
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching TopoJSON data...')

  // Fetch both resolutions - prioritize 10m (high res)
  const [response10m, response50m] = await Promise.all([
    fetch(TOPOJSON_URL_10M),
    fetch(TOPOJSON_URL_50M)
  ])
  const [topo10m, topo50m] = await Promise.all([
    response10m.json(),
    response50m.json()
  ])

  const geoData10m = feature(topo10m, topo10m.objects.countries)
  const geoData50m = feature(topo50m, topo50m.objects.countries)

  console.log(`Loaded ${geoData10m.features.length} features (10m), ${geoData50m.features.length} features (50m)`)

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const countries = Object.keys(countryToISO)
  let generated = 0
  let skipped = 0

  console.log(`\nGenerating maps for ${countries.length} countries...`)

  // Use 50m data for neighbors (simpler, faster rendering)
  const neighborFeatures = geoData50m.features

  for (const country of countries) {
    const iso = countryToISO[country]
    // Try 10m (high res) first for target country, fall back to 50m
    let countryFeature = geoData10m.features.find(f => f.id === iso)
    if (!countryFeature) {
      countryFeature = geoData50m.features.find(f => f.id === iso)
    }

    if (!countryFeature) {
      console.log(`  Skipped: ${country} (no map data in either resolution)`)
      skipped++
      continue
    }

    // Sanitize country name for filename
    const safeName = country.replace(/[^a-zA-Z0-9-]/g, '_')

    for (const { width, height } of SIZES) {
      const svg = generateSVG(country, countryFeature, neighborFeatures, width, height, iso)
      if (!svg) {
        console.log(`  Skipped: ${country} ${width}x${height} (SVG generation failed)`)
        continue
      }

      const outputPath = path.join(OUTPUT_DIR, `${safeName}-${width}x${height}.png`)
      await svgToPng(svg, outputPath)
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
