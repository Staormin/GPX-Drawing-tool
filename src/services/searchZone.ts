/**
 * Search Zone Visualization
 * Creates and displays a buffer zone around a path on the map
 */

import * as turf from '@turf/turf'
import type L from 'leaflet'

/**
 * Create a search zone layer that displays a buffered area around a path
 * @param mapContainer Map container with Leaflet map instance
 * @param pathPoints Array of lat/lon points defining the path
 * @param bufferDistanceKm Buffer distance in kilometers
 * @returns Leaflet FeatureGroup containing the search zone visualization
 */
export function createSearchZoneLayer(
  mapContainer: any,
  pathPoints: Array<{ lat: number; lon: number }>,
  bufferDistanceKm: number,
): L.FeatureGroup {
  // Get the actual map instance (handle both ref and direct access)
  const mapInstance = mapContainer.map?.value || mapContainer.map

  // Create a FeatureGroup to hold all search zone elements
  const L = (window as any).L
  const searchZoneGroup = L.featureGroup()

  try {
    if (!mapInstance) {
      console.error('[SearchZone] Map instance not found')
      return searchZoneGroup
    }

    // Convert path points to GeoJSON LineString (GeoJSON uses [lon, lat])
    // Points are already properly interpolated by the composable/component
    const coordinates = pathPoints.map(p => [p.lon, p.lat])

    const lineString = turf.lineString(coordinates)

    // Create a buffer polygon around the line
    const bufferedPolygon = turf.buffer(lineString, bufferDistanceKm, {
      units: 'kilometers',
    })

    // Create a Leaflet GeoJSON layer from the buffer polygon
    const geoJsonLayer = L.geoJSON(bufferedPolygon, {
      style: {
        fillColor: '#ff0000',
        fillOpacity: 0.15,
        color: '#ff0000',
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5',
      },
    })

    // Add the GeoJSON layer to the feature group
    geoJsonLayer.addTo(searchZoneGroup)

    // Also visualize the original path with a thicker line
    const pathGeoJson = L.geoJSON(lineString, {
      style: {
        color: '#ff0000',
        weight: 3,
        opacity: 0.8,
        dashArray: '0',
      },
    })

    pathGeoJson.addTo(searchZoneGroup)

    // Add the feature group to the map
    searchZoneGroup.addTo(mapInstance)

    console.log('[SearchZone] Created buffer zone with distance:', bufferDistanceKm, 'km')

    return searchZoneGroup
  } catch (error) {
    console.error('[SearchZone] Error creating search zone:', error)
    return searchZoneGroup
  }
}

/**
 * Remove the search zone layer from the map
 * @param mapContainer Map container with Leaflet map instance
 * @param searchZoneLayer The FeatureGroup to remove
 */
export function removeSearchZoneLayer(
  mapContainer: any,
  searchZoneLayer: L.FeatureGroup,
): void {
  // Get the actual map instance (handle both ref and direct access)
  const mapInstance = mapContainer.map?.value || mapContainer.map

  try {
    if (!mapInstance) {
      console.error('[SearchZone] Map instance not found')
      return
    }

    mapInstance.removeLayer(searchZoneLayer)
    console.log('[SearchZone] Removed search zone')
  } catch (error) {
    console.error('[SearchZone] Error removing search zone:', error)
  }
}
