/**
 * Geoportail API service - Integration with IGN Geoportail APIs
 */

export interface GeoportailResult {
  id?: string;
  fulltext: string;
  x: number;
  y: number;
  kind?: string;
  importance?: number;
}

export interface AddressSearchResult {
  main: string;
  secondary?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  type?: string;
  elevation?: number;
}

const COMPLETION_API = 'https://data.geopf.fr/geocodage/completion';
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';

/**
 * Fetch elevation data for coordinates using Open-Elevation API
 * Handles "entity too large" errors by splitting the payload
 * @param coordinates Array of {lat, lon} coordinate pairs
 * @returns Map of coordinate strings to elevation values
 */
async function fetchElevations(
  coordinates: Array<{ lat: number; lon: number }>
): Promise<Map<string, number>> {
  const elevationMap = new Map<string, number>();

  if (coordinates.length === 0) {
    return elevationMap;
  }

  // Create a coordinate index map for looking up input coordinates by their position
  const coordIndex: Map<string, number> = new Map();
  for (const [index, coord] of coordinates.entries()) {
    const key = `${coord.lat.toFixed(6)}_${coord.lon.toFixed(6)}`;
    coordIndex.set(key, index);
  }

  // Helper function to fetch elevation with retry and splitting
  async function fetchWithRetry(
    coords: Array<{ lat: number; lon: number }>,
    iteration = 0
  ): Promise<void> {
    if (coords.length === 0 || iteration >= 5) {
      return;
    }

    try {
      const locations = coords.map((coord) => ({ latitude: coord.lat, longitude: coord.lon }));
      const response = await fetch(ELEVATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations }),
      });

      if (!response.ok) {
        // Handle 413 Payload Too Large error
        if (response.status === 413 && iteration < 5) {
          console.warn(
            `Elevation API: Payload too large (413), splitting and retrying... (iteration ${iteration + 1}/5)`
          );
          // Split the coordinates into two batches
          const mid = Math.ceil(coords.length / 2);
          const batch1 = coords.slice(0, mid);
          const batch2 = coords.slice(mid);

          // Recursively fetch both batches
          await fetchWithRetry(batch1, iteration + 1);
          await fetchWithRetry(batch2, iteration + 1);
          return;
        }

        console.warn(`Elevation API error: ${response.status}`);
        return;
      }

      const data = (await response.json()) as {
        results: Array<{ latitude: number; longitude: number; elevation: number | null }>;
      };

      if (data.results) {
        for (const result of data.results) {
          if (result.elevation !== null) {
            // Try multiple key formats to match with the input coordinates
            const keys = [
              `${result.latitude.toFixed(6)}_${result.longitude.toFixed(6)}`,
              `${result.latitude.toFixed(5)}_${result.longitude.toFixed(5)}`,
              `${Math.round(result.latitude * 1_000_000) / 1_000_000}_${Math.round(result.longitude * 1_000_000) / 1_000_000}`,
            ];

            let foundKey: string | null = null;
            for (const key of keys) {
              if (coordIndex.has(key)) {
                foundKey = key;
                break;
              }
            }

            if (foundKey) {
              elevationMap.set(foundKey, Math.round(result.elevation));
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching elevation data:', error);
    }
  }

  await fetchWithRetry(coordinates);
  return elevationMap;
}

/**
 * Search for addresses using Geoportail Completion API
 * @param query Search query
 * @param limit Maximum number of results to return
 * @returns Array of search results
 */
export async function searchAddress(query: string, limit = 8): Promise<AddressSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      text: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${COMPLETION_API}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: GeoportailResult) => ({
      main: result.fulltext,
      secondary: result.kind || undefined,
      coordinates: {
        lat: result.y,
        lon: result.x,
      },
      type: result.kind,
    }));
  } catch (error) {
    console.error('Error searching address:', error);
    throw new Error(
      `Failed to search address: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get map tiles URL from Geoportail
 * Uses the WMTS service for IGN maps
 */
export function getMapTilesUrl(): string {
  return 'https://data.geopf.fr/private/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&apikey=ign_scan_ws';
}

/**
 * Get map attribution text
 */
export function getMapAttribution(): string {
  return '&copy; <a href="https://www.ign.fr/">IGN</a>-F/Geoportail';
}

/**
 * Default map center (Paris, France)
 */
export const DEFAULT_MAP_CENTER = {
  lat: 48.8566,
  lon: 2.3522,
};

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 12;

/**
 * Calculate bounding box for a set of points
 * @param points Array of lat/lon points
 * @param bufferKm Optional buffer distance in km
 * @returns bbox as "xmin,ymin,xmax,ymax" (lon,lat format)
 */
function calculateBbox(points: Array<{ lat: number; lon: number }>, bufferKm = 0): string {
  if (points.length === 0) {
    return '';
  }

  let minLon = points[0]!.lon;
  let maxLon = points[0]!.lon;
  let minLat = points[0]!.lat;
  let maxLat = points[0]!.lat;

  for (const point of points) {
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
  }

  // Convert km buffer to approximate degrees (1 degree ≈ 111.32 km)
  const bufferDegrees = bufferKm / 111.32;

  minLon -= bufferDegrees;
  maxLon += bufferDegrees;
  minLat -= bufferDegrees;
  maxLat += bufferDegrees;

  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function haversineDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number }
): number {
  const R = 6371; // Earth radius in km
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate minimum distance from a point to a line segment
 */
export function distancePointToSegment(
  point: { lat: number; lon: number },
  segStart: { lat: number; lon: number },
  segEnd: { lat: number; lon: number }
): number {
  // Simple approximation: use Haversine to start/end and interpolation points
  const distances = [haversineDistance(point, segStart), haversineDistance(point, segEnd)];

  // Check midpoint for better accuracy
  const mid = {
    lat: (segStart.lat + segEnd.lat) / 2,
    lon: (segStart.lon + segEnd.lon) / 2,
  };
  distances.push(haversineDistance(point, mid));

  return Math.min(...distances);
}

/**
 * Check if a point is inside a GeoJSON polygon using ray casting algorithm
 * @param point Point to check as [lon, lat]
 * @param polygon GeoJSON Polygon or Feature with Polygon geometry
 * @returns true if point is inside polygon
 */
function pointInPolygon(point: [number, number], polygon: any): boolean {
  // Get the polygon coordinates (handle both Polygon and Feature types)
  let coords: any[];
  if (polygon.type === 'Polygon') {
    coords = polygon.coordinates;
  } else if (polygon.type === 'Feature' && polygon.geometry?.type === 'Polygon') {
    coords = polygon.geometry.coordinates;
  } else {
    return false;
  }

  const [x, y] = point;
  const exterior = coords[0];

  if (!exterior || !Array.isArray(exterior)) {
    return false;
  }

  // Ray casting algorithm
  let isInside = false;
  for (let i = 0, j = exterior.length - 1; i < exterior.length; j = i++) {
    const xi = exterior[i]![0];
    const yi = exterior[i]![1];
    const xj = exterior[j]![0];
    const yj = exterior[j]![1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
}

/**
 * Simple request queue to respect rate limits
 */
class RequestQueue {
  private queue: Array<() => Promise<Response>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minDelayMs = 50; // 50ms delay = max 20 requests/second (stay well below 50/s limit)
  private resolveStack: Array<(value: Response) => void> = [];
  private rejectStack: Array<(error: Error) => void> = [];

  async add(requestFn: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      this.resolveStack.push(resolve);
      this.rejectStack.push(reject);

      this.queue.push(async (): Promise<Response> => {
        const resolveItem = this.resolveStack.shift();
        const rejectItem = this.rejectStack.shift();

        if (!resolveItem || !rejectItem) {
          throw new Error('No resolver found');
        }

        try {
          // Enforce minimum delay between requests
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minDelayMs) {
            await new Promise((r) => setTimeout(r, this.minDelayMs - timeSinceLastRequest));
          }

          this.lastRequestTime = Date.now();
          const result = await requestFn();
          resolveItem(result);
          return result;
        } catch (error) {
          rejectItem(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const requestFn = this.queue.shift();
      if (requestFn) {
        try {
          await requestFn();
        } catch {
          // Error already handled in the queue function
        }
      }
    }

    this.isProcessing = false;
  }
}

const requestQueue = new RequestQueue();

/**
 * Helper: Get type value from XML tags
 */
function getTypeValueFromElement(element: Element): string {
  const placeTag = element.querySelector('tag[k="place"]');
  const amenityTag = element.querySelector('tag[k="amenity"]');
  const tourismTag = element.querySelector('tag[k="tourism"]');
  const naturalTag = element.querySelector('tag[k="natural"]');
  const historicTag = element.querySelector('tag[k="historic"]');

  return (
    placeTag?.getAttribute('v') ||
    amenityTag?.getAttribute('v') ||
    tourismTag?.getAttribute('v') ||
    naturalTag?.getAttribute('v') ||
    historicTag?.getAttribute('v') ||
    ''
  );
}

/**
 * Helper: Check if a location is within search zone
 */
function isLocationInSearchZone(
  resultCoords: { lat: number; lon: number },
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm: number,
  bufferPolygon?: any
): boolean {
  if (bufferPolygon) {
    return pointInPolygon([resultCoords.lon, resultCoords.lat], bufferPolygon);
  }

  let minDist = Infinity;
  if (pathPoints.length === 1) {
    minDist = haversineDistance(resultCoords, pathPoints[0]!);
  } else {
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const dist = distancePointToSegment(resultCoords, pathPoints[i]!, pathPoints[i + 1]!);
      minDist = Math.min(minDist, dist);
    }
  }
  return minDist <= searchDistanceKm;
}

/**
 * Helper: Add location to results map
 */
function addLocationToResults(
  results: Map<string, AddressSearchResult>,
  name: string,
  lon: number,
  lat: number,
  typeValue: string
): void {
  const key = `${name}_${lon}_${lat}`;
  if (!results.has(key)) {
    results.set(key, {
      main: name,
      secondary: typeValue || undefined,
      coordinates: { lat, lon },
      type: typeValue || undefined,
    });
  }
}

/**
 * Helper: Process XML nodes
 */
function processXmlNodes(
  doc: Document,
  results: Map<string, AddressSearchResult>,
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm: number,
  bufferPolygon?: any
): void {
  const nodes = doc.querySelectorAll('node');
  for (const node of nodes) {
    const lat = Number.parseFloat(node.getAttribute('lat') || '0');
    const lon = Number.parseFloat(node.getAttribute('lon') || '0');
    const nameTag = node.querySelector('tag[k="name"]');
    const name = nameTag?.getAttribute('v');
    const typeValue = getTypeValueFromElement(node);

    if (name && lat && lon) {
      const resultCoords = { lat, lon };
      if (isLocationInSearchZone(resultCoords, pathPoints, searchDistanceKm, bufferPolygon)) {
        addLocationToResults(results, name, lon, lat, typeValue);
      }
    }
  }
}

/**
 * Helper: Process XML ways
 */
function processXmlWays(
  doc: Document,
  results: Map<string, AddressSearchResult>,
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm: number,
  bufferPolygon?: any
): void {
  const ways = doc.querySelectorAll('way');
  for (const way of ways) {
    const centerTag = way.querySelector('center');
    if (centerTag) {
      const lat = Number.parseFloat(centerTag.getAttribute('lat') || '0');
      const lon = Number.parseFloat(centerTag.getAttribute('lon') || '0');
      const nameTag = way.querySelector('tag[k="name"]');
      const name = nameTag?.getAttribute('v');
      const typeValue = getTypeValueFromElement(way);

      if (name && lat && lon) {
        const resultCoords = { lat, lon };
        if (isLocationInSearchZone(resultCoords, pathPoints, searchDistanceKm, bufferPolygon)) {
          addLocationToResults(results, name, lon, lat, typeValue);
        }
      }
    }
  }
}

/**
 * Search for locations near a path using Overpass API
 * Uses a buffer polygon to define the search area for precise filtering
 * @param pathPoints Array of lat/lon points defining the path
 * @param searchDistanceKm Maximum distance from the path to search (in km)
 * @param bufferPolygon Optional GeoJSON buffer polygon for precise search boundary (from turf.buffer())
 * @returns Array of locations found within the search zone
 */
export async function searchLocationsNearPath(
  pathPoints: Array<{ lat: number; lon: number }>,
  searchDistanceKm = 1,
  bufferPolygon?: any
): Promise<AddressSearchResult[]> {
  if (!pathPoints || pathPoints.length === 0) {
    return [];
  }

  const results: Map<string, AddressSearchResult> = new Map(); // Deduplication map

  // Calculate bounding box for the entire path with search distance buffer
  const fullBbox = calculateBbox(pathPoints, searchDistanceKm);
  const bboxParts = fullBbox.split(',').map(Number);
  const minLon = bboxParts[0] ?? 0;
  const minLat = bboxParts[1] ?? 0;
  const maxLon = bboxParts[2] ?? 0;
  const maxLat = bboxParts[3] ?? 0;

  // Build Overpass query
  // For line segments: search for elements with both name and place tag
  // For points: search for all named elements (no place type filter)
  const queryElements: string =
    pathPoints.length === 1
      ? `node[name];\n    way[name];\n    relation[name];\n    `
      : `node[name][place];\n    way[name][place];\n    relation[name][place];\n    `;

  const overpassQuery = `
    [bbox:${minLat},${minLon},${maxLat},${maxLon}];
    (
      ${queryElements}
    );
    out center;
  `;

  const searchPromises = [
    await requestQueue.add(async () => {
      try {
        return await fetch(OVERPASS_API, {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'application/osm3s',
          },
        });
      } catch (error) {
        console.error('Error in overpass search:', error);
        throw error;
      }
    }),
  ];

  // Process all segment searches
  const responses = await Promise.allSettled(searchPromises);

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      try {
        const xmlText = await response.value.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');

        // Check for parsing errors
        if (doc.documentElement.nodeName === 'parsererror') {
          console.error('XML parsing error:', xmlText.slice(0, 500));
          continue;
        }

        // Handle Overpass API XML response format
        processXmlNodes(doc, results, pathPoints, searchDistanceKm, bufferPolygon);
        processXmlWays(doc, results, pathPoints, searchDistanceKm, bufferPolygon);
      } catch (error) {
        console.error('Error parsing Overpass API response:', error);
      }
    }
  }

  // Fetch elevation data for all results
  const resultArray = Array.from(results.values());
  if (resultArray.length > 0) {
    const coordinates = resultArray.map((r) => r.coordinates);
    const elevationMap = await fetchElevations(coordinates);

    // Add elevation data to results
    for (const result of resultArray) {
      // Try multiple key formats to handle different precision levels
      const keys = [
        `${result.coordinates.lat.toFixed(6)}_${result.coordinates.lon.toFixed(6)}`,
        `${result.coordinates.lat.toFixed(5)}_${result.coordinates.lon.toFixed(5)}`,
        `${Math.round(result.coordinates.lat * 1_000_000) / 1_000_000}_${Math.round(result.coordinates.lon * 1_000_000) / 1_000_000}`,
      ];

      let elevation: number | undefined;
      for (const key of keys) {
        elevation = elevationMap.get(key);
        if (elevation !== undefined) {
          break;
        }
      }

      if (elevation !== undefined) {
        result.elevation = elevation;
      }
    }
  }

  return resultArray;
}
