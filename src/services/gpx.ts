/**
 * GPX service - Functions for generating GPX files
 * Reused from original application with TypeScript typing
 */

import { destinationPoint, generateCircle } from './geometry';

export interface CircleData {
  lat: number;
  lon: number;
  radius?: number;
  name?: string;
}

export interface LineSegmentData {
  name?: string;
  center: { lat: number; lon: number };
  endpoint?: { lat: number; lon: number };
  mode: 'coordinate' | 'azimuth' | 'intersection' | 'parallel';
  distance?: number;
  azimuth?: number;
  longitude?: number;
}

export interface PointData {
  name?: string;
  coordinates: { lat: number; lon: number };
}

/**
 * Generate line segment tracks for GPX
 */
export function generateLineSegmentTracks(segments: LineSegmentData[]): string {
  let gpxTracks = '';

  for (const [segmentIndex, segment] of segments.entries()) {
    let trackPoints: { lat: number; lon: number }[] = [];

    if (segment.mode === 'coordinate' && segment.endpoint) {
      trackPoints = [segment.center, segment.endpoint];

      gpxTracks += `  <trk>
    <name>${segment.name || `Line Segment ${segmentIndex + 1}`}</name>
    <type>LineSegment</type>
    <trkseg>
`;
      for (const point of trackPoints) {
        gpxTracks += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">
        <ele>0</ele>
      </trkpt>
`;
      }
      gpxTracks += `    </trkseg>
  </trk>
`;
    } else {
      switch (segment.mode) {
        case 'azimuth': {
          // Calculate endpoint from azimuth and distance
          destinationPoint(
            segment.center.lat,
            segment.center.lon,
            segment.distance!,
            segment.azimuth!
          );
          // Generate intermediate points for smooth curve
          trackPoints = [];
          const numPoints = 100;
          for (let i = 0; i <= numPoints; i++) {
            const distance = (i / numPoints) * segment.distance!;
            const point = destinationPoint(
              segment.center.lat,
              segment.center.lon,
              distance,
              segment.azimuth!
            );
            trackPoints.push(point);
          }

          gpxTracks += `  <trk>
    <name>${segment.name || `Line Segment ${segmentIndex + 1}`}</name>
    <type>LineSegment</type>
    <trkseg>
`;
          for (const point of trackPoints) {
            gpxTracks += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">
        <ele>0</ele>
      </trkpt>
`;
          }
          gpxTracks += `    </trkseg>
  </trk>
`;

          break;
        }

        case 'intersection': {
          // Endpoint is already calculated and stored
          if (segment.endpoint) {
            trackPoints = [segment.center, segment.endpoint];

            gpxTracks += `  <trk>
    <name>${segment.name || `Line Segment ${segmentIndex + 1}`}</name>
    <type>LineSegment</type>
    <trkseg>
`;
            for (const point of trackPoints) {
              gpxTracks += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">
        <ele>0</ele>
      </trkpt>
`;
            }
            gpxTracks += `    </trkseg>
  </trk>
`;
          }

          break;
        }
        case 'parallel': {
          // Generate parallel line (horizontal) from west to east at constant latitude
          trackPoints = [];
          const numPoints = 180;
          const lat = segment.longitude === undefined ? 0 : segment.longitude;
          for (let i = 0; i <= numPoints; i++) {
            const lon = -180 + (i / numPoints) * 360;
            trackPoints.push({ lat, lon });
          }

          gpxTracks += `  <trk>
    <name>${segment.name || `Parallel ${segmentIndex + 1}`}</name>
    <type>Parallel</type>
    <trkseg>
`;
          for (const point of trackPoints) {
            gpxTracks += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">
        <ele>0</ele>
      </trkpt>
`;
          }
          gpxTracks += `    </trkseg>
  </trk>
`;

          break;
        }
        // No default
      }
    }
  }

  return gpxTracks;
}

/**
 * Generate complete GPX with circles, line segments, and points
 */
export function generateCompleteGPX(
  centers: CircleData[],
  radiiKm: number[],
  numPoints: number,
  segments: LineSegmentData[],
  layerPoints: PointData[] = []
): string {
  const timestamp = new Date().toISOString();
  const radiiDesc =
    radiiKm.length === 1 ? `radius ${radiiKm[0]} km` : `radii ${radiiKm.join(', ')} km`;
  const first = centers[0];
  const centersDesc =
    centers.length === 1
      ? `center at ${first?.lat ?? 0}, ${first?.lon ?? 0}`
      : `${centers.length} centers`;

  let descSuffix = '';
  if (segments.length > 0) {
    descSuffix += ` plus ${segments.length} line segment(s)`;
  }
  if (layerPoints.length > 0) {
    descSuffix += ` plus ${layerPoints.length} point(s)`;
  }

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Circle Generator"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Circle Tracks and Line Segments</name>
    <desc>Circular tracks with ${centersDesc} and ${radiiDesc}${descSuffix}</desc>
    <time>${timestamp}</time>
  </metadata>
`;

  // Add waypoints for all centers
  for (const [centerIndex, center] of centers.entries()) {
    gpx += `  <wpt lat="${center.lat.toFixed(6)}" lon="${center.lon.toFixed(6)}">
    <ele>0</ele>
    <name>Center ${centerIndex + 1}</name>
    <desc>Circle center point ${centerIndex + 1}</desc>
    <sym>Flag, Blue</sym>
  </wpt>
`;
  }

  // Add waypoints for all layer points
  for (const point of layerPoints) {
    gpx += `  <wpt lat="${point.coordinates.lat.toFixed(6)}" lon="${point.coordinates.lon.toFixed(6)}">
    <ele>0</ele>
    <name>${point.name}</name>
    <desc>User added point</desc>
    <sym>Flag, Red</sym>
  </wpt>
`;
  }

  // Generate tracks for each center and radius combination
  for (const [centerIndex, center] of centers.entries()) {
    for (const radiusKm of radiiKm) {
      const points = generateCircle(center.lat, center.lon, radiusKm, numPoints);

      gpx += `  <trk>
    <name>Center ${centerIndex + 1} - Circle ${radiusKm}km</name>
    <type>Circle</type>
    <trkseg>
`;

      for (const point of points) {
        gpx += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">
        <ele>0</ele>
      </trkpt>
`;
      }

      gpx += `    </trkseg>
  </trk>
`;
    }
  }

  // Add line segment tracks
  if (segments.length > 0) {
    gpx += generateLineSegmentTracks(segments);
  }

  gpx += `</gpx>`;

  return gpx;
}

/**
 * Generate timestamp for filename
 */
export function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date}_${hours}-${minutes}-${seconds}`;
}

/**
 * Download GPX file to client
 */
export function downloadGPX(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
