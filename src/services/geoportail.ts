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
