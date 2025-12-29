import { useState, useEffect } from 'react'
import * as d3 from 'd3-geo'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

interface SeaMapProps {
  center: [number, number] // [longitude, latitude]
  zoom: number
  width?: number
  height?: number
}

// Colors matching the country map quiz theme (from mapRenderer.ts)
const OCEAN_COLOR = '#1a3a5c'
const LAND_COLOR = '#2d2d44'  // Same as NEIGHBOR_COLOR in country maps

// Cache for map data
let cachedTopology: Topology | null = null
let loadingPromise: Promise<Topology> | null = null

async function loadMapData(): Promise<Topology> {
  if (cachedTopology) return cachedTopology
  if (loadingPromise) return loadingPromise

  const base = import.meta.env.BASE_URL || '/'
  loadingPromise = fetch(`${base}countries-110m.json`)
    .then(res => res.json())
    .then(data => {
      cachedTopology = data
      return data
    })

  return loadingPromise
}

export function SeaMap({ center, zoom, width = 672, height = 378 }: SeaMapProps) {
  const [features, setFeatures] = useState<Feature<MultiPolygon | Polygon>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMapData().then(topology => {
      const countries = topojson.feature(
        topology,
        topology.objects.countries as GeometryCollection
      ) as FeatureCollection<MultiPolygon | Polygon>
      setFeatures(countries.features)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ width, height, backgroundColor: OCEAN_COLOR }} className="flex items-center justify-center">
        <span className="text-white/50">Laster...</span>
      </div>
    )
  }

  // Calculate scale based on zoom level
  // Base scale shows roughly the whole world at zoom=0.5
  const baseScale = Math.min(width, height) * 0.8
  const scale = baseScale * zoom

  // Create projection centered on the sea
  const projection = d3.geoAzimuthalEqualArea()
    .center([0, 0])
    .rotate([-center[0], -center[1]])
    .scale(scale)
    .translate([width / 2, height / 2])

  const pathGenerator = d3.geoPath(projection)

  return (
    <svg width={width} height={height} style={{ backgroundColor: OCEAN_COLOR }}>
      {/* Render all countries as land */}
      {features.map((feature, i) => {
        const path = pathGenerator(feature)
        if (!path) return null
        return (
          <path
            key={i}
            d={path}
            fill={LAND_COLOR}
            stroke={OCEAN_COLOR}
            strokeWidth={1}
          />
        )
      })}
      {/* Center marker for debugging (can be removed) */}
      {/* <circle cx={width/2} cy={height/2} r={4} fill="red" /> */}
    </svg>
  )
}

// Preload map data
export function preloadSeaMapData() {
  loadMapData()
}
