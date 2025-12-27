import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import countryFlags from '../country-flags.json'
import territoryFlags from '../disputed-territories.json'

const FLAGS_DIR = join(process.cwd(), 'public', 'flags')

// Sanitize country name for filename
function getSafeFilename(country: string): string {
  return country.replace(/[^a-zA-Z0-9-]/g, '_')
}

async function downloadFlag(country: string, url: string): Promise<void> {
  const filename = `${getSafeFilename(country)}.svg`
  const filepath = join(FLAGS_DIR, filename)

  // Skip if already downloaded
  if (existsSync(filepath)) {
    console.log(`  ✓ ${country} (cached)`)
    return
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const svg = await response.text()
    writeFileSync(filepath, svg)
    console.log(`  ✓ ${country}`)
  } catch (error) {
    console.error(`  ✗ ${country}: ${error}`)
  }
}

async function downloadAll(flags: Record<string, string>, label: string): Promise<number> {
  console.log(`\n${label}:`)
  const entries = Object.entries(flags)

  // Download in batches to avoid overwhelming the server
  const BATCH_SIZE = 10
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(([country, url]) => downloadFlag(country, url)))
  }
  return entries.length
}

function generateLocalJson(flags: Record<string, string>, outputPath: string): void {
  const localFlags: Record<string, string> = {}
  for (const country of Object.keys(flags)) {
    // Use relative path without leading slash - Vite base URL will be prepended at runtime
    localFlags[country] = `flags/${getSafeFilename(country)}.svg`
  }
  writeFileSync(outputPath, JSON.stringify(localFlags, null, 2))
}

async function main() {
  console.log('Downloading flag SVGs...')

  // Create flags directory
  if (!existsSync(FLAGS_DIR)) {
    mkdirSync(FLAGS_DIR, { recursive: true })
  }

  const countryCount = await downloadAll(countryFlags as Record<string, string>, 'Country flags')
  const territoryCount = await downloadAll(territoryFlags as Record<string, string>, 'Territory flags')

  // Generate local flags JSON files
  generateLocalJson(countryFlags as Record<string, string>, join(process.cwd(), 'src', 'localFlags.json'))
  generateLocalJson(territoryFlags as Record<string, string>, join(process.cwd(), 'src', 'localTerritoryFlags.json'))

  console.log(`\n✓ Downloaded ${countryCount + territoryCount} flags`)
  console.log(`✓ Generated src/localFlags.json`)
  console.log(`✓ Generated src/localTerritoryFlags.json`)
}

main().catch(console.error)
