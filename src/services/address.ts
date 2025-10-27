/**
 * Service for address lookup using IGN Geoplateforme API
 */

export interface ReverseGeocodeResult {
  address: string | null;
  error?: string;
}

/**
 * Get the nearest address for given coordinates using IGN Geoplateforme reverse geocoding
 */
export async function getReverseGeocodeAddress(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  try {
    // Use the IGN Geoplateforme reverse geocoding API
    // https://data.geopf.fr/geocodage/reverse
    const response = await fetch(
      `https://data.geopf.fr/geocodage/reverse?lon=${lon}&lat=${lat}&limit=1`
    );

    if (!response.ok) {
      return { address: null, error: `API returned status ${response.status}` };
    }

    const data = await response.json();

    // The API returns a features array with the closest addresses
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const properties = feature.properties;

      // Construct address from available properties
      // The API provides: name (street/place name), postcode, city, context (region)
      const addressParts: string[] = [];

      if (properties.name) {
        addressParts.push(properties.name);
      }

      if (properties.postcode) {
        addressParts.push(properties.postcode);
      }

      if (properties.city) {
        addressParts.push(properties.city);
      }

      if (addressParts.length > 0) {
        return { address: addressParts.join(', ') };
      }
    }

    return { address: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { address: null, error: errorMessage };
  }
}
