/**
 * Geoportail API service - Integration with IGN Geoportail APIs
 */

export interface GeoportailResult {
  id?: string
  fulltext: string
  x: number
  y: number
  kind?: string
  importance?: number
}

export interface AddressSearchResult {
  main: string
  secondary?: string
  coordinates: {
    lat: number
    lon: number
  }
  type?: string
}

const COMPLETION_API = 'https://data.geopf.fr/geocodage/completion'
const REVERSE_GEOCODING_API = 'https://data.geopf.fr/geocodage/reverse'

/**
 * Search for addresses using Geoportail Completion API
 * @param query Search query
 * @param limit Maximum number of results to return
 * @returns Array of search results
 */
export async function searchAddress (query: string, limit = 8): Promise<AddressSearchResult[]> {
  if (!query.trim()) {
    return []
  }

  try {
    const params = new URLSearchParams({
      text: query,
      limit: limit.toString(),
    })

    const response = await fetch(`${COMPLETION_API}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      return []
    }

    return data.results.map((result: GeoportailResult) => ({
      main: result.fulltext,
      secondary: result.kind || undefined,
      coordinates: {
        lat: result.y,
        lon: result.x,
      },
      type: result.kind,
    }))
  } catch (error) {
    console.error('Error searching address:', error)
    throw new Error(`Failed to search address: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get map tiles URL from Geoportail
 * Uses the WMTS service for IGN maps
 */
export function getMapTilesUrl (): string {
  return 'https://data.geopf.fr/private/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&apikey=ign_scan_ws'
}

/**
 * Get map attribution text
 */
export function getMapAttribution (): string {
  return '&copy; <a href="https://www.ign.fr/">IGN</a>-F/Geoportail'
}

/**
 * Default map center (Paris, France)
 */
export const DEFAULT_MAP_CENTER = {
  lat: 48.8566,
  lon: 2.3522,
}

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 12

/**
 * Calculate bounding box for a set of points
 * @param points Array of lat/lon points
 * @param bufferKm Optional buffer distance in km
 * @returns bbox as "xmin,ymin,xmax,ymax" (lon,lat format)
 */
function calculateBbox(
  points: Array<{ lat: number; lon: number }>,
  bufferKm: number = 0,
): string {
  if (points.length === 0) {
    return ''
  }

  let minLon = points[0]!.lon
  let maxLon = points[0]!.lon
  let minLat = points[0]!.lat
  let maxLat = points[0]!.lat

  for (const point of points) {
    minLon = Math.min(minLon, point.lon)
    maxLon = Math.max(maxLon, point.lon)
    minLat = Math.min(minLat, point.lat)
    maxLat = Math.max(maxLat, point.lat)
  }

  // Convert km buffer to approximate degrees (1 degree ≈ 111.32 km)
  const bufferDegrees = bufferKm / 111.32

  minLon -= bufferDegrees
  maxLon += bufferDegrees
  minLat -= bufferDegrees
  maxLat += bufferDegrees

  return `${minLon},${minLat},${maxLon},${maxLat}`
}

/**
 * Split path into segments respecting the 1000m bbox limit
 * @param pathPoints Array of lat/lon points
 * @param maxBboxSizeM Maximum bbox size in meters (Geoportail limit: 1000m)
 * @returns Array of path segments
 */
function splitPathIntoSegments(
  pathPoints: Array<{ lat: number; lon: number }>,
  maxBboxSizeM: number = 900, // Stay below 1000m limit with buffer
): Array<Array<{ lat: number; lon: number }>> {
  if (pathPoints.length === 0) {
    return []
  }

  const segments: Array<Array<{ lat: number; lon: number }>> = []
  let currentSegment: Array<{ lat: number; lon: number }> = [pathPoints[0]!]

  for (let i = 1; i < pathPoints.length; i++) {
    const point = pathPoints[i]!
    const testSegment = [...currentSegment, point]

    // Calculate bbox size in meters
    const bbox = calculateBbox(testSegment)
    const bboxParts = bbox.split(',').map(Number)
    const minLon = bboxParts[0] ?? 0
    const minLat = bboxParts[1] ?? 0
    const maxLon = bboxParts[2] ?? 0
    const maxLat = bboxParts[3] ?? 0

    // Approximate bbox size in meters
    const lonDiff = (maxLon - minLon) * 111.32 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180)
    const latDiff = (maxLat - minLat) * 111.32
    const bboxSizeM = Math.max(lonDiff, latDiff)

    if (bboxSizeM > maxBboxSizeM && currentSegment.length > 1) {
      // Start new segment
      segments.push(currentSegment)
      currentSegment = [currentSegment[currentSegment.length - 1]!, point]
    } else {
      // Add point to current segment
      currentSegment.push(point)
    }
  }

  // Add remaining segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
function haversineDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number },
): number {
  const R = 6371 // Earth radius in km
  const lat1 = point1.lat * Math.PI / 180
  const lat2 = point2.lat * Math.PI / 180
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lon - point1.lon) * Math.PI / 180

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate minimum distance from a point to a line segment
 */
function distancePointToSegment(
  point: { lat: number; lon: number },
  segStart: { lat: number; lon: number },
  segEnd: { lat: number; lon: number },
): number {
  // Simple approximation: use Haversine to start/end and interpolation points
  const distances = [
    haversineDistance(point, segStart),
    haversineDistance(point, segEnd),
  ]

  // Check midpoint for better accuracy
  const mid = {
    lat: (segStart.lat + segEnd.lat) / 2,
    lon: (segStart.lon + segEnd.lon) / 2,
  }
  distances.push(haversineDistance(point, mid))

  return Math.min(...distances)
}

/**
 * Simple request queue to respect rate limits
 */
class RequestQueue {
  private queue: Array<() => Promise<Response>> = []
  private isProcessing = false
  private lastRequestTime = 0
  private minDelayMs = 50 // 50ms delay = max 20 requests/second (stay well below 50/s limit)
  private resolveStack: Array<(value: Response) => void> = []
  private rejectStack: Array<(error: Error) => void> = []

  async add(requestFn: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      this.resolveStack.push(resolve)
      this.rejectStack.push(reject)

      this.queue.push(async (): Promise<Response> => {
        const resolveItem = this.resolveStack.shift()
        const rejectItem = this.rejectStack.shift()

        if (!resolveItem || !rejectItem) {
          throw new Error('No resolver found')
        }

        try {
          // Enforce minimum delay between requests
          const timeSinceLastRequest = Date.now() - this.lastRequestTime
          if (timeSinceLastRequest < this.minDelayMs) {
            await new Promise(r => setTimeout(r, this.minDelayMs - timeSinceLastRequest))
          }

          this.lastRequestTime = Date.now()
          const result = await requestFn()
          resolveItem(result)
          return result
        } catch (error) {
          rejectItem(error instanceof Error ? error : new Error(String(error)))
          throw error
        }
      })

      if (!this.isProcessing) {
        this.processQueue()
      }
    })
  }

  private async processQueue (): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const requestFn = this.queue.shift()
      if (requestFn) {
        try {
          await requestFn()
        } catch {
          // Error already handled in the queue function
        }
      }
    }

    this.isProcessing = false
  }
}

const requestQueue = new RequestQueue()

/**
 * Search for locations near a path using Geoportail Completion API with bounding boxes
 * This is much more efficient than point-by-point searches
 * @param pathPoints Array of lat/lon points defining the path
 * @param searchDistanceKm Maximum distance from the path to search (in km)
 * @param types Types of locations to search for (e.g., 'LieuDit', 'Commune')
 * @returns Array of locations found near the path
 */
export async function searchLocationsNearPath(
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm: number = 1,
  types: string[] = ['LieuDit', 'Commune'],
): Promise<AddressSearchResult[]> {
  if (!pathPoints || pathPoints.length === 0) {
    return []
  }

  const results: Map<string, AddressSearchResult> = new Map() // Deduplication map

  // Split path into segments respecting the 1000m bbox limit
  const segments = splitPathIntoSegments(pathPoints, 900)

  // Search each segment using reverse geocoding with LineString geometry - more efficient!
  const searchPromises = segments.map(segment =>
    requestQueue.add(async () => {
      try {
        // Build GeoJSON LineString from segment
        const coordinates = segment.map(p => [p.lon, p.lat])

        // Create a circle around the entire segment for searching
        // Calculate center and max distance from center
        const segmentBbox = calculateBbox(segment, searchDistanceKm)
        const bboxParts = segmentBbox.split(',').map(Number)
        const minLon = bboxParts[0] ?? 0
        const minLat = bboxParts[1] ?? 0
        const maxLon = bboxParts[2] ?? 0
        const maxLat = bboxParts[3] ?? 0
        const centerLon = (minLon + maxLon) / 2
        const centerLat = (minLat + maxLat) / 2

        // Calculate radius in meters based on bbox
        const lonDiff = (maxLon - minLon) * 111.32 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180)
        const latDiff = (maxLat - minLat) * 111.32
        const radiusM = Math.max(lonDiff, latDiff) * 1000 / 2 // Convert to meters

        // API caps at 500m, but we want to search up to user's searchDistanceKm
        // If user wants more than 500m, we use 500m and post-filter results
        const searchRadiusM = Math.min(radiusM, 500) // Cap at 500m API limit

        // Use Circle geometry for reverse geocoding
        const searchgeom = JSON.stringify({
          type: 'Circle',
          coordinates: [centerLon, centerLat],
          radius: searchRadiusM,
        })

        const params = new URLSearchParams({
          searchgeom,
          index: 'poi', // Search POI database
          limit: '15',
        })

        const response = await fetch(`${REVERSE_GEOCODING_API}?${params.toString()}`)
        return response
      } catch (error) {
        console.error('Error in circle search:', error)
        throw error
      }
    }),
  )

  // Process all segment searches
  const responses = await Promise.allSettled(searchPromises)

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      try {
        const data = await response.value.json() as any

        // Handle reverse geocoding response format (features array)
        // The API search already limits results to the circle bounds, so we don't need additional filtering
        if (data.features && Array.isArray(data.features)) {
          for (const feature of data.features) {
            const props = feature.properties || {}
            const coords = feature.geometry?.coordinates || [0, 0]

            if (coords.length >= 2) {
              const resultCoords = {
                lat: coords[1],
                lon: coords[0],
              }

              const name = Array.isArray(props.name) ? props.name[0] : props.name
              const context = Array.isArray(props.context) ? props.context[0] : props.context
              const key = `${name || ''}_${coords[0]}_${coords[1]}`

              if (!results.has(key)) {
                results.set(key, {
                  main: name || 'Unknown',
                  secondary: context || props.city?.[0] || undefined,
                  coordinates: resultCoords,
                  type: props._type || undefined,
                })
              }
            }
          }
        }

        // Also handle completion API response format (results array)
        if (data.results && Array.isArray(data.results)) {
          for (const result of data.results) {
            const resultCoords = {
              lat: result.y,
              lon: result.x,
            }

            // Filter results to only those within searchDistanceKm of the actual path
            let minDist = Infinity
            for (let i = 0; i < pathPoints.length - 1; i++) {
              const dist = distancePointToSegment(
                resultCoords,
                pathPoints[i]!,
                pathPoints[i + 1]!,
              )
              minDist = Math.min(minDist, dist)
            }

            // Only include if within search distance
            if (minDist <= searchDistanceKm) {
              const key = `${result.fulltext}`
              if (!results.has(key)) {
                results.set(key, {
                  main: result.fulltext,
                  secondary: result.kind || undefined,
                  coordinates: resultCoords,
                  type: result.kind,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing reverse geocoding response:', error)
      }
    }
  }

  return Array.from(results.values())
}
