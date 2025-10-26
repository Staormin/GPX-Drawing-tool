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

    // Convert path points to GeoJSON geometry
    // Points are already properly interpolated by the composable/component
    const coordinates = pathPoints.map(p => [p.lon, p.lat])

    let geometry
    let pathGeometry

    if (pathPoints.length === 1) {
      // For single point, use Point geometry
      geometry = turf.point(coordinates[0]!)
      pathGeometry = turf.point(coordinates[0]!)
    } else {
      // For multiple points, use LineString geometry
      geometry = turf.lineString(coordinates)
      pathGeometry = turf.lineString(coordinates)
    }

    // Create a buffer polygon around the geometry
    const bufferedPolygon = turf.buffer(geometry, bufferDistanceKm, {
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

    // Also visualize the original path with a thicker line or circle marker
    const pathGeoJson = L.geoJSON(pathGeometry, {
      pointToLayer: (feature: any, latlng: any) => {
        // For point features, create a circular marker
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: '#ff0000',
          color: '#ff0000',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.8,
        })
      },
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
  } catch (error) {
    console.error('[SearchZone] Error removing search zone:', error)
  }
}
