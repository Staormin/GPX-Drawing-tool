/**
 * Geometry service - Utility functions for geographic calculations
 * Reused from original application with TypeScript typing
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371; // Earth's radius in km
const EARTH_RADIUS_M = 6_378_137; // Earth's radius in meters
const MAX_LAT = 85.051_128_78; // Max latitude for Web Mercator

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate destination point given distance and bearing from start point
 * Uses spherical earth model
 */
export function destinationPoint(
  lat: number,
  lon: number,
  distanceKm: number,
  bearing: number
): LatLon {
  const δ = distanceKm / EARTH_RADIUS_KM; // angular distance
  const θ = toRadians(bearing);

  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return {
    lat: toDegrees(φ2),
    lon: toDegrees(λ2),
  };
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  const φ1 = toRadians(fromLat);
  const λ1 = toRadians(fromLon);
  const φ2 = toRadians(toLat);
  const λ2 = toRadians(toLon);

  const Δλ = λ2 - λ1;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
}

/**
 * Calculate inverse bearing (reverse azimuth) between two points
 * This is the bearing from point B back to point A
 */
export function calculateInverseBearing(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  // Inverse bearing is just the bearing from the destination back to the origin
  return calculateBearing(toLat, toLon, fromLat, fromLon);
}

/**
 * Calculate distance between two points using haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = EARTH_RADIUS_KM;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Project lat/lon to Web Mercator (EPSG:3857) in meters
 */
export function mercatorProject(lat: number, lon: number): Vector2D {
  const R = EARTH_RADIUS_M;
  const λ = toRadians(lon);
  let φ = toRadians(lat);

  // Clamp latitude to prevent infinity at the poles
  if (lat > MAX_LAT) {
    φ = toRadians(MAX_LAT);
  }
  if (lat < -MAX_LAT) {
    φ = toRadians(-MAX_LAT);
  }

  const x = R * λ;
  const y = R * Math.log(Math.tan(Math.PI / 4 + φ / 2));

  return { x, y };
}

/**
 * Unproject Web Mercator coordinates back to lat/lon
 */
export function mercatorUnproject(x: number, y: number): LatLon {
  const R = EARTH_RADIUS_M;
  const λ = x / R;
  const φ = 2 * Math.atan(Math.exp(y / R)) - Math.PI / 2;
  const lat = toDegrees(φ);
  const lon = toDegrees(λ);

  return { lat, lon };
}

/**
 * Convert lat/lon to 3D unit vector on sphere
 */
export function latLonToVector(lat: number, lon: number): Vector3D {
  const φ = toRadians(lat);
  const λ = toRadians(lon);

  return {
    x: Math.cos(φ) * Math.cos(λ),
    y: Math.cos(φ) * Math.sin(λ),
    z: Math.sin(φ),
  };
}

/**
 * Convert 3D unit vector back to lat/lon
 */
export function vectorToLatLon(v: Vector3D): LatLon {
  const lat = toDegrees(Math.asin(v.z));
  const lon = toDegrees(Math.atan2(v.y, v.x));

  return { lat, lon };
}

/**
 * Magnitude (length) of a vector
 */
function magnitude(v: Vector3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Normalize vector to unit length
 */
function normalize(v: Vector3D): Vector3D {
  const mag = magnitude(v);
  if (mag === 0) {
    return v;
  }

  return {
    x: v.x / mag,
    y: v.y / mag,
    z: v.z / mag,
  };
}

/**
 * Dot product of two vectors
 */
function dotProduct(v1: Vector3D, v2: Vector3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Calculate endpoint from start point through intersection point with specified distance
 * Compute endpoint so that the straight line in Web Mercator from start to end passes through the intersection point,
 * while the geodesic distance from start to end equals the provided distance.
 */
export function endpointFromIntersection(
  startLat: number,
  startLon: number,
  intersectLat: number,
  intersectLon: number,
  distanceKm: number
): LatLon {
  const D = distanceKm; // km

  // Project to Web Mercator (meters)
  const P0 = mercatorProject(startLat, startLon);
  const Pi = mercatorProject(intersectLat, intersectLon);

  let vx = Pi.x - P0.x;
  let vy = Pi.y - P0.y;
  let norm = Math.hypot(vx, vy);

  // Fallback direction if start and intersection project to the same point
  if (norm === 0) {
    vx = 1; // east
    vy = 0;
    norm = 1;
  }
  const v = { x: vx / norm, y: vy / norm };

  // s measured in meters along the projection ray from P0
  const sIntersection = Math.hypot(Pi.x - P0.x, Pi.y - P0.y);

  function endFromS(sMeters: number): LatLon {
    const x = P0.x + sMeters * v.x;
    const y = P0.y + sMeters * v.y;
    return mercatorUnproject(x, y);
  }

  function f(sMeters: number): number {
    const end = endFromS(sMeters);
    return calculateDistance(startLat, startLon, end.lat, end.lon) - D; // km
  }

  // If requested distance is exactly up to the intersection, return it
  const dStartToInter = calculateDistance(startLat, startLon, intersectLat, intersectLon);
  if (Math.abs(dStartToInter - D) < 1e-6) {
    return { lat: intersectLat, lon: intersectLon };
  }

  // Bracket the root for s >= sIntersection
  const sLow = sIntersection;
  const fLow = f(sLow);

  // If D is smaller than distance to intersection, no solution while keeping the line passing through the point
  // The UI should prevent this; as a fallback, return the intersection to avoid incorrect direction.
  if (fLow > 0) {
    return { lat: intersectLat, lon: intersectLon };
  }

  // Increase sHigh until distance exceeds D (f >= 0)
  let sHigh = sLow + 1000; // start with +1 km in projected meters
  let fHigh = f(sHigh);
  const MAX_S = 40_000_000; // ~40,000 km in meters, safe upper cap
  let iter = 0;
  while (fHigh < 0 && sHigh < MAX_S && iter < 60) {
    sHigh *= 2;
    fHigh = f(sHigh);
    iter++;
  }

  // If still not bracketed, clamp to max
  if (fHigh < 0) {
    // Fall back to extend along the ray using destination point from current bearing
    const pEnd = endFromS(sHigh);
    return { lat: pEnd.lat, lon: pEnd.lon };
  }

  // Bisection to solve f(s)=0
  let a = sLow,
    b = sHigh;
  let _fa = fLow,
    _fb = fHigh;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (a + b);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-6 || Math.abs(b - a) < 0.01) {
      // ~1 cm in projected space
      const end = endFromS(mid);
      return { lat: end.lat, lon: end.lon };
    }
    if (fm > 0) {
      b = mid;
      _fb = fm;
    } else {
      a = mid;
      _fa = fm;
    }
  }
  // Return best mid if not converged
  const end = endFromS(0.5 * (a + b));
  return { lat: end.lat, lon: end.lon };
}

/**
 * Generate points along a line for specified total distance using slerp interpolation
 */
export function generateLinePoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  numPoints: number
): LatLon[] {
  const points: LatLon[] = [];

  // Use slerp to generate points between start and end
  const startVec = latLonToVector(startLat, startLon);
  const endVec = latLonToVector(endLat, endLon);

  const dotProd = dotProduct(startVec, endVec);
  const omega = Math.acos(Math.max(-1, Math.min(1, dotProd)));
  const sinOmega = Math.sin(omega);

  // Generate points using slerp interpolation
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    if (omega < 1e-10) {
      // Points are too close, use linear interpolation
      const lat = startLat + (endLat - startLat) * t;
      const lon = startLon + (endLon - startLon) * t;
      points.push({ lat, lon });
    } else {
      // Use slerp for proper great circle interpolation
      const w0 = Math.sin((1 - t) * omega) / sinOmega;
      const w1 = Math.sin(t * omega) / sinOmega;

      const interpVec = {
        x: w0 * startVec.x + w1 * endVec.x,
        y: w0 * startVec.y + w1 * endVec.y,
        z: w0 * startVec.z + w1 * endVec.z,
      };

      const normalizedInterp = normalize(interpVec);
      points.push(vectorToLatLon(normalizedInterp));
    }
  }

  return points;
}

/**
 * Generate points along a line using linear interpolation in Web Mercator projection
 * This matches how Leaflet draws line segments (straight lines appear straight in Web Mercator)
 * Used for buffer zone calculations to ensure alignment with displayed line segments
 */
export function generateLinePointsLinear(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  numPoints: number
): LatLon[] {
  const points: LatLon[] = [];

  // Project start and end points to Web Mercator
  const startMercator = mercatorProject(startLat, startLon);
  const endMercator = mercatorProject(endLat, endLon);

  // Interpolate linearly in Web Mercator space
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = startMercator.x + (endMercator.x - startMercator.x) * t;
    const y = startMercator.y + (endMercator.y - startMercator.y) * t;

    // Convert back to lat/lon
    const point = mercatorUnproject(x, y);
    points.push(point);
  }

  return points;
}

/**
 * Generate circle points at specified radius and number of points
 */
export function generateCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  numPoints = 360
): LatLon[] {
  const points: LatLon[] = [];

  for (let i = 0; i < numPoints; i++) {
    const bearing = (360 / numPoints) * i;
    const point = destinationPoint(centerLat, centerLon, radiusKm, bearing);
    points.push(point);
  }

  // Close the circle by adding the first point again
  if (points.length > 0 && points[0]) {
    points.push(points[0]);
  }

  return points;
}
