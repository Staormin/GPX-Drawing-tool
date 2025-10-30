import { getReverseGeocodeAddress } from '@/services/address';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';

/**
 * Composable for generating automatic line segment names based on mode and coordinates
 */
export function useLineNameGeneration() {
  const coordinatesStore = useCoordinatesStore();
  const layersStore = useLayersStore();

  /**
   * Find a saved coordinate by lat/lon with tolerance
   */
  function findSavedCoordinate(lat: number, lon: number) {
    return coordinatesStore.sortedCoordinates.find(
      (c: any) => Math.abs(c.lat - lat) < 0.0001 && Math.abs(c.lon - lon) < 0.0001
    );
  }

  /**
   * Get a location name from saved coordinates or reverse geocoding
   */
  async function getLocationName(lat: number, lon: number): Promise<string> {
    const savedCoord = findSavedCoordinate(lat, lon);
    if (savedCoord) {
      return savedCoord.name;
    }

    const { address } = await getReverseGeocodeAddress(lat, lon);
    return address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  /**
   * Generate name for two-points (coordinate) mode line
   */
  async function generateTwoPointsName(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<string> {
    const startCoordSaved = findSavedCoordinate(startLat, startLon);
    const endCoordSaved = findSavedCoordinate(endLat, endLon);

    if (startCoordSaved && endCoordSaved) {
      return `${startCoordSaved.name} => ${endCoordSaved.name}`;
    } else if (startCoordSaved || endCoordSaved) {
      // One coordinate is saved, try reverse geocoding for the other
      const startName = startCoordSaved?.name;
      const endName = endCoordSaved?.name;

      if (startName) {
        const { address } = await getReverseGeocodeAddress(endLat, endLon);
        const generatedEndName = address || `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`;
        return `${startName} => ${generatedEndName}`;
      } else {
        const { address } = await getReverseGeocodeAddress(startLat, startLon);
        const generatedStartName = address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
        return `${generatedStartName} => ${endName}`;
      }
    } else {
      // Neither coordinate is saved, try reverse geocoding for both
      const [startResult, endResult] = await Promise.all([
        getReverseGeocodeAddress(startLat, startLon),
        getReverseGeocodeAddress(endLat, endLon),
      ]);

      const startName = startResult.address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
      const endName = endResult.address || `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`;
      return `${startName} => ${endName}`;
    }
  }

  /**
   * Generate name for azimuth mode line
   */
  async function generateAzimuthName(
    startLat: number,
    startLon: number,
    azimuth: number
  ): Promise<string> {
    const startCoordSaved = findSavedCoordinate(startLat, startLon);

    if (startCoordSaved) {
      return `From ${startCoordSaved.name} at ${azimuth}°`;
    } else {
      const { address } = await getReverseGeocodeAddress(startLat, startLon);
      const startName = address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
      return `From ${startName} at ${azimuth}°`;
    }
  }

  /**
   * Generate name for intersection mode line
   */
  async function generateIntersectionName(
    startLat: number,
    startLon: number,
    intersectLat: number,
    intersectLon: number
  ): Promise<string> {
    const startCoordSaved = findSavedCoordinate(startLat, startLon);
    const intersectCoordSaved = findSavedCoordinate(intersectLat, intersectLon);

    const startName =
      startCoordSaved?.name ||
      (await getReverseGeocodeAddress(startLat, startLon)).address ||
      `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
    const intersectName =
      intersectCoordSaved?.name ||
      (await getReverseGeocodeAddress(intersectLat, intersectLon)).address ||
      `${intersectLat.toFixed(4)}, ${intersectLon.toFixed(4)}`;

    return `From ${startName} via ${intersectName}`;
  }

  /**
   * Generate name for parallel mode line
   */
  function generateParallelName(latitude: number): string {
    const savedCoord = coordinatesStore.sortedCoordinates.find(
      (c: any) => Math.abs(c.lat - latitude) < 0.0001
    );

    if (savedCoord) {
      return `Parallel to ${savedCoord.name}`;
    }

    return `Parallel at ${latitude.toFixed(6)}°`;
  }

  /**
   * Generate fallback name
   */
  function generateFallbackName(): string {
    return `Line ${layersStore.lineSegmentCount + 1}`;
  }

  return {
    getLocationName,
    generateTwoPointsName,
    generateAzimuthName,
    generateIntersectionName,
    generateParallelName,
    generateFallbackName,
  };
}
