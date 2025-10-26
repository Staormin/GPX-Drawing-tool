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
  elevation?: number
}

const COMPLETION_API = 'https://data.geopf.fr/geocodage/completion'
const REVERSE_GEOCODING_API = 'https://data.geopf.fr/geocodage/reverse'
const ADRESSE_API = 'https://api-adresse.data.gouv.fr/search/'
const OVERPASS_API = 'https://overpass-api.de/api/interpreter'
const ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup'

/**
 * Fetch elevation data for coordinates using Open-Elevation API
 * @param coordinates Array of {lat, lon} coordinate pairs
 * @returns Map of coordinate strings to elevation values
 */
async function fetchElevations(coordinates: Array<{ lat: number, lon: number }>): Promise<Map<string, number>> {
  const elevationMap = new Map<string, number>()

  if (coordinates.length === 0) {
    return elevationMap
  }

  try {
    const locations = coordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lon }))
    const response = await fetch(ELEVATION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations }),
    })

    if (!response.ok) {
      console.warn(`Elevation API error: ${response.status}`)
      return elevationMap
    }

    const data = await response.json() as { results: Array<{ latitude: number, longitude: number, elevation: number | null }> }

    if (data.results) {
      data.results.forEach((result) => {
        if (result.elevation !== null) {
          const key = `${result.latitude.toFixed(6)}_${result.longitude.toFixed(6)}`
          elevationMap.set(key, Math.round(result.elevation))
        }
      })
    }
  } catch (error) {
    console.warn('Error fetching elevation data:', error)
  }

  return elevationMap
}

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
export function haversineDistance(
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
export function distancePointToSegment(
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
 * Check if a point is inside a GeoJSON polygon using ray casting algorithm
 * @param point Point to check as [lon, lat]
 * @param polygon GeoJSON Polygon or Feature with Polygon geometry
 * @returns true if point is inside polygon
 */
function pointInPolygon(point: [number, number], polygon: any): boolean {
  // Get the polygon coordinates (handle both Polygon and Feature types)
  let coords: any[]
  if (polygon.type === 'Polygon') {
    coords = polygon.coordinates
  } else if (polygon.type === 'Feature' && polygon.geometry?.type === 'Polygon') {
    coords = polygon.geometry.coordinates
  } else {
    return false
  }

  const [x, y] = point
  const exterior = coords[0]

  if (!exterior || !Array.isArray(exterior)) {
    return false
  }

  // Ray casting algorithm
  let isInside = false
  for (let i = 0, j = exterior.length - 1; i < exterior.length; j = i++) {
    const xi = exterior[i]![0]
    const yi = exterior[i]![1]
    const xj = exterior[j]![0]
    const yj = exterior[j]![1]

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) isInside = !isInside
  }

  return isInside
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
 * Search for locations near a path using Overpass API
 * Uses a buffer polygon to define the search area for precise filtering
 * @param pathPoints Array of lat/lon points defining the path
 * @param searchDistanceKm Maximum distance from the path to search (in km)
 * @param tags Array of OSM tag keys to search for (e.g., ['place', 'amenity']). Empty array = no tag filter
 * @param bufferPolygon Optional GeoJSON buffer polygon for precise search boundary (from turf.buffer())
 * @returns Array of locations found within the search zone
 */
export async function searchLocationsNearPath(
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm: number = 1,
  tags: string[] = [],
  bufferPolygon?: any,
): Promise<AddressSearchResult[]> {
  if (!pathPoints || pathPoints.length === 0) {
    return []
  }

  const results: Map<string, AddressSearchResult> = new Map() // Deduplication map

  // Calculate bounding box for the entire path with search distance buffer
  const fullBbox = calculateBbox(pathPoints, searchDistanceKm)
  const bboxParts = fullBbox.split(',').map(Number)
  const minLon = bboxParts[0] ?? 0
  const minLat = bboxParts[1] ?? 0
  const maxLon = bboxParts[2] ?? 0
  const maxLat = bboxParts[3] ?? 0

  // Build Overpass query - search for all named places
  // This searches for any element with both a name tag and a place tag
  const queryElements = `node[name][place];\n    way[name][place];\n    relation[name][place];\n    `

  const overpassQuery = `
    [bbox:${minLat},${minLon},${maxLat},${maxLon}];
    (
      ${queryElements}
    );
    out center;
  `

  const searchPromises = [
    requestQueue.add(async () => {
      try {
        const response = await fetch(OVERPASS_API, {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'application/osm3s',
          },
        })
        return response
      } catch (error) {
        console.error('Error in overpass search:', error)
        throw error
      }
    }),
  ]

  // Process all segment searches
  const responses = await Promise.allSettled(searchPromises)

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      try {
        const xmlText = await response.value.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(xmlText, 'text/xml')

        // Check for parsing errors
        if (doc.documentElement.nodeName === 'parsererror') {
          console.error('XML parsing error:', xmlText.substring(0, 500))
          continue
        }

        // Handle Overpass API XML response format
        // Parse nodes
        const nodes = doc.querySelectorAll('node')
        nodes.forEach((node) => {
          const lat = parseFloat(node.getAttribute('lat') || '0')
          const lon = parseFloat(node.getAttribute('lon') || '0')
          const nameTag = node.querySelector('tag[k="name"]')
          const name = nameTag?.getAttribute('v')

          // Get the type from place, amenity, tourism, natural, or historic tags
          let typeValue = ''
          const placeTag = node.querySelector('tag[k="place"]')
          const amenityTag = node.querySelector('tag[k="amenity"]')
          const tourismTag = node.querySelector('tag[k="tourism"]')
          const naturalTag = node.querySelector('tag[k="natural"]')
          const historicTag = node.querySelector('tag[k="historic"]')

          typeValue = placeTag?.getAttribute('v')
            || amenityTag?.getAttribute('v')
            || tourismTag?.getAttribute('v')
            || naturalTag?.getAttribute('v')
            || historicTag?.getAttribute('v')
            || ''

          if (name && lat && lon) {
            const resultCoords = {
              lat,
              lon,
            }

            // Filter using buffer polygon if available
            let isInSearchZone = false

            if (bufferPolygon) {
              // Use precise polygon-based filtering
              isInSearchZone = pointInPolygon([lon, lat], bufferPolygon)
            } else {
              // Fallback to distance-based filtering
              let minDist = Infinity
              for (let i = 0; i < pathPoints.length - 1; i++) {
                const dist = distancePointToSegment(
                  resultCoords,
                  pathPoints[i]!,
                  pathPoints[i + 1]!,
                )
                minDist = Math.min(minDist, dist)
              }
              isInSearchZone = minDist <= searchDistanceKm
            }

            // Only include if within search zone
            if (isInSearchZone) {
              const key = `${name}_${lon}_${lat}`
              if (!results.has(key)) {
                results.set(key, {
                  main: name,
                  secondary: typeValue && typeValue !== null ? typeValue : undefined,
                  coordinates: resultCoords,
                  type: typeValue && typeValue !== null ? typeValue : undefined,
                })
              }
            }
          }
        })

        // Parse ways with center tag
        const ways = doc.querySelectorAll('way')
        ways.forEach((way) => {
          const centerTag = way.querySelector('center')
          if (centerTag) {
            const lat = parseFloat(centerTag.getAttribute('lat') || '0')
            const lon = parseFloat(centerTag.getAttribute('lon') || '0')
            const nameTag = way.querySelector('tag[k="name"]')
            const name = nameTag?.getAttribute('v')

            // Get the type from place, amenity, tourism, natural, or historic tags
            let typeValue = ''
            const placeTag = way.querySelector('tag[k="place"]')
            const amenityTag = way.querySelector('tag[k="amenity"]')
            const tourismTag = way.querySelector('tag[k="tourism"]')
            const naturalTag = way.querySelector('tag[k="natural"]')
            const historicTag = way.querySelector('tag[k="historic"]')

            typeValue = placeTag?.getAttribute('v')
              || amenityTag?.getAttribute('v')
              || tourismTag?.getAttribute('v')
              || naturalTag?.getAttribute('v')
              || historicTag?.getAttribute('v')
              || ''

            if (name && lat && lon) {
              const resultCoords = {
                lat,
                lon,
              }

              // Filter using buffer polygon if available
              let isInSearchZone = false

              if (bufferPolygon) {
                // Use precise polygon-based filtering
                isInSearchZone = pointInPolygon([lon, lat], bufferPolygon)
              } else {
                // Fallback to distance-based filtering
                let minDist = Infinity
                for (let i = 0; i < pathPoints.length - 1; i++) {
                  const dist = distancePointToSegment(
                    resultCoords,
                    pathPoints[i]!,
                    pathPoints[i + 1]!,
                  )
                  minDist = Math.min(minDist, dist)
                }
                isInSearchZone = minDist <= searchDistanceKm
              }

              // Only include if within search zone
              if (isInSearchZone) {
                const key = `${name}_${lon}_${lat}`
                if (!results.has(key)) {
                  results.set(key, {
                    main: name,
                    secondary: typeValue && typeValue !== null ? typeValue : undefined,
                    coordinates: resultCoords,
                    type: typeValue && typeValue !== null ? typeValue : undefined,
                  })
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Error parsing Overpass API response:', error)
      }
    }
  }

  // Fetch elevation data for all results
  const resultArray = Array.from(results.values())
  if (resultArray.length > 0) {
    const coordinates = resultArray.map(r => r.coordinates)
    const elevationMap = await fetchElevations(coordinates)

    // Add elevation data to results
    resultArray.forEach((result) => {
      const key = `${result.coordinates.lat.toFixed(6)}_${result.coordinates.lon.toFixed(6)}`
      const elevation = elevationMap.get(key)
      if (elevation !== undefined) {
        result.elevation = elevation
      }
    })
  }

  return resultArray
}
