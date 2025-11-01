/**
 * Composable for drawing shapes on the map
 */

import type {
  CircleElement,
  LineSegmentElement,
  PointElement,
  PolygonElement,
} from '@/services/storage';
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import { generateCircle } from '@/services/geometry';
import { useLayersStore } from '@/stores/layers';

const DEFAULT_COLOR = '#000000';
const DEFAULT_RADIUS = 8;

export function useDrawing(mapRef: any) {
  const layersStore = useLayersStore();

  const generateId = () => uuidv4();

  // Helper function to redraw a circle on the map without adding to store
  const redrawCircleOnMap = (
    circleId: string,
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    color?: string
  ) => {
    if (!mapRef.map?.value) {
      return;
    }

    const points = generateCircle(centerLat, centerLon, radiusKm, 360);
    const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

    const polyline = L.polyline(latLngs, {
      color: color || DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `circle-layer circle-${circleId}`,
    }).addTo(mapRef.map.value);

    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('circle', circleId, newLeafletId);

    // Update the circle element's leafletId in the store
    const circle = layersStore.circles.find((c) => c.id === circleId);
    if (circle) {
      circle.leafletId = newLeafletId;
    }
  };

  // Helper function to redraw a line segment on the map without adding to store
  const redrawLineSegmentOnMap = (
    lineId: string,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    mode: 'coordinate' | 'azimuth' | 'intersection' = 'coordinate',
    intersectLat?: number,
    intersectLon?: number,
    color?: string
  ) => {
    if (!mapRef.map?.value) {
      return;
    }

    const latLngs = [
      [startLat, startLon] as [number, number],
      [endLat, endLon] as [number, number],
    ];

    const polyline = L.polyline(latLngs, {
      color: color || DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, newLeafletId);

    // Update the line segment element's leafletId in the store
    const segment = layersStore.lineSegments.find((s) => s.id === lineId);
    if (segment) {
      segment.leafletId = newLeafletId;
    }

    // For intersection mode, show the intersection point marker
    if (mode === 'intersection' && intersectLat && intersectLon) {
      L.circleMarker([intersectLat, intersectLon], {
        radius: 8,
        fillColor: '#FFD700',
        color: '#FFA500',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: `intersection-marker intersection-${lineId}`,
      }).addTo(mapRef.map.value);
    }
  };

  // Helper function to redraw a parallel line on the map without adding to store
  const redrawParallelOnMap = (lineId: string, latitude: number, color?: string) => {
    if (!mapRef.map?.value) {
      return;
    }

    const latLngs: [number, number][] = [
      [latitude, -180],
      [latitude, 180],
    ];

    const polyline = L.polyline(latLngs, {
      color: color || DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, newLeafletId);

    // Update the line segment element's leafletId in the store
    const segment = layersStore.lineSegments.find((s) => s.id === lineId);
    if (segment) {
      segment.leafletId = newLeafletId;
    }
  };

  // Helper function to redraw a point on the map without adding to store
  const redrawPointOnMap = (pointId: string, lat: number, lon: number, color?: string) => {
    if (!mapRef.map?.value) {
      return;
    }

    const pointColor = color || DEFAULT_COLOR;
    const marker = L.circleMarker([lat, lon], {
      radius: DEFAULT_RADIUS,
      color: pointColor,
      fill: true,
      fillColor: pointColor,
      fillOpacity: 1,
      weight: 3,
      className: `point-layer point-${pointId}`,
    }).addTo(mapRef.map.value);

    const newLeafletId = L.stamp(marker);
    layersStore.storeLeafletId('point', pointId, newLeafletId);

    // Update the point element's leafletId in the store
    const point = layersStore.points.find((p) => p.id === pointId);
    if (point) {
      point.leafletId = newLeafletId;
    }
  };

  // Circle drawing
  const drawCircle = (centerLat: number, centerLon: number, radiusKm: number, name?: string) => {
    if (!mapRef.map?.value) {
      return null;
    }

    const circleId = generateId();
    const circleElement: CircleElement = {
      id: circleId,
      name: name || `Circle ${layersStore.circleCount + 1}`,
      center: { lat: centerLat, lon: centerLon },
      radius: radiusKm,
      color: DEFAULT_COLOR,
    };

    // Generate circle points
    const points = generateCircle(centerLat, centerLon, radiusKm, 360);
    const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

    // Create Leaflet polyline
    const polyline = L.polyline(latLngs, {
      color: circleElement.color,
      weight: 3,
      opacity: 1,
      className: `circle-layer circle-${circleId}`,
    }).addTo(mapRef.map.value);

    // Store Leaflet ID
    circleElement.leafletId = L.stamp(polyline);
    layersStore.storeLeafletId('circle', circleId, circleElement.leafletId);

    // Add to store
    layersStore.addCircle(circleElement);

    // Fit map to circle bounds
    if (mapRef.fitBounds) {
      const bounds: [[number, number], [number, number]] = [
        [centerLat - radiusKm / 111, centerLon - radiusKm / 111],
        [centerLat + radiusKm / 111, centerLon + radiusKm / 111],
      ];
      mapRef.fitBounds(bounds);
    }

    return circleElement;
  };

  // Update existing circle
  const updateCircle = (
    circleId: string | undefined,
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    name: string
  ) => {
    if (!mapRef.map?.value || !circleId) {
      return;
    }

    // Update store
    layersStore.updateCircle(circleId, {
      name,
      center: { lat: centerLat, lon: centerLon },
      radius: radiusKm,
    });

    // Remove old circle from map
    const circle = layersStore.circles.find((c) => c.id === circleId);
    if (circle && circle.leafletId) {
      const elements = document.querySelectorAll(`.circle-${circleId}`);
      for (const el of elements) {
        const svgElement = el.closest('svg');
        if (svgElement) {
          svgElement.remove();
        }
      }
    }

    // Redraw circle
    const points = generateCircle(centerLat, centerLon, radiusKm, 360);
    const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

    const polyline = L.polyline(latLngs, {
      color: DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `circle-layer circle-${circleId}`,
    }).addTo(mapRef.map.value);

    // Update Leaflet ID in store
    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('circle', circleId, newLeafletId);
  };

  // Line segment drawing
  const drawLineSegment = (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    name?: string,
    mode: 'coordinate' | 'azimuth' | 'intersection' = 'coordinate',
    distance?: number,
    azimuth?: number,
    intersectLat?: number,
    intersectLon?: number,
    intersectDistance?: number
  ): LineSegmentElement | null => {
    if (!mapRef.map?.value) {
      return null;
    }

    const lineId = generateId();
    const lineElement = {
      id: lineId,
      name: name || `Line Segment ${layersStore.lineSegmentCount + 1}`,
      center: { lat: startLat, lon: startLon },
      endpoint: { lat: endLat, lon: endLon },
      mode,
      distance,
      azimuth,
      intersectionPoint:
        intersectLat && intersectLon ? { lat: intersectLat, lon: intersectLon } : undefined,
      intersectionDistance: intersectDistance,
      color: DEFAULT_COLOR,
    } as LineSegmentElement;

    // Draw line as simple 2-point straight line (matches POC and GPX output)
    const latLngs = [
      [startLat, startLon] as [number, number],
      [endLat, endLon] as [number, number],
    ];

    // Create Leaflet polyline
    const polyline = L.polyline(latLngs, {
      color: lineElement.color,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    // Store Leaflet ID
    lineElement.leafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, lineElement.leafletId);

    // For intersection mode, show the intersection point marker
    if (mode === 'intersection' && intersectLat && intersectLon) {
      L.circleMarker([intersectLat, intersectLon], {
        radius: 8,
        fillColor: '#FFD700', // Gold
        color: '#FFA500', // Orange
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: `intersection-marker intersection-${lineId}`,
      }).addTo(mapRef.map.value);
    }

    // Add to store
    layersStore.addLineSegment(lineElement);

    // Fit map to line segment bounds
    if (mapRef.fitBounds) {
      const minLat = Math.min(startLat, endLat);
      const maxLat = Math.max(startLat, endLat);
      const minLon = Math.min(startLon, endLon);
      const maxLon = Math.max(startLon, endLon);
      const bounds: [[number, number], [number, number]] = [
        [minLat, minLon],
        [maxLat, maxLon],
      ];
      mapRef.fitBounds(bounds);
    }

    return lineElement;
  };

  // Update existing line segment
  const updateLineSegment = (
    lineId: string | undefined,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    name: string,
    mode: 'coordinate' | 'azimuth' | 'intersection' = 'coordinate',
    distance?: number,
    azimuth?: number,
    intersectLat?: number,
    intersectLon?: number,
    intersectDistance?: number
  ) => {
    if (!mapRef.map?.value || !lineId) {
      return;
    }

    // Update store
    layersStore.updateLineSegment(lineId, {
      name,
      center: { lat: startLat, lon: startLon },
      endpoint: { lat: endLat, lon: endLon },
      mode,
      distance,
      azimuth,
      intersectionPoint:
        intersectLat && intersectLon ? { lat: intersectLat, lon: intersectLon } : undefined,
      intersectionDistance: intersectDistance,
    });

    // Remove old line from map using className
    const lineClass = `line-${lineId}`;
    const lineElements = document.querySelectorAll(`.${lineClass}`);
    for (const el of lineElements) {
      const svgElement = el.closest('svg');
      if (svgElement) {
        svgElement.remove();
      }
    }

    // Also remove intersection marker if present
    const className = `intersection-${lineId}`;
    const intersectionElements = document.querySelectorAll(`.${className}`);
    for (const el of intersectionElements) {
      const svgElement = el.closest('svg');
      if (svgElement) {
        svgElement.remove();
      }
    }

    // Redraw line segment
    const latLngs = [
      [startLat, startLon] as [number, number],
      [endLat, endLon] as [number, number],
    ];

    const polyline = L.polyline(latLngs, {
      color: DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    // Update Leaflet ID in store
    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, newLeafletId);

    // For intersection mode, show the intersection point marker
    if (mode === 'intersection' && intersectLat && intersectLon) {
      L.circleMarker([intersectLat, intersectLon], {
        radius: 8,
        fillColor: '#FFD700',
        color: '#FFA500',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: `intersection-marker intersection-${lineId}`,
      }).addTo(mapRef.map.value);
    }
  };

  // Point drawing
  const drawPoint = (
    lat: number,
    lon: number,
    name?: string,
    color?: string,
    elevation?: number
  ): PointElement | null => {
    if (!mapRef.map?.value) {
      return null;
    }

    const pointId = generateId();
    const pointElement = {
      id: pointId,
      name: name || `Point ${layersStore.pointCount + 1}`,
      coordinates: { lat, lon },
      elevation,
      color: DEFAULT_COLOR,
    } as PointElement;

    // Create Leaflet circle marker
    const marker = L.circleMarker([lat, lon], {
      radius: DEFAULT_RADIUS,
      color: pointElement.color,
      fill: true,
      fillColor: pointElement.color,
      fillOpacity: 1,
      weight: 3,
      className: `point-layer point-${pointId}`,
    }).addTo(mapRef.map.value);

    // Store Leaflet ID
    pointElement.leafletId = L.stamp(marker);
    layersStore.storeLeafletId('point', pointId, pointElement.leafletId);

    // Add to store
    layersStore.addPoint(pointElement);

    // Fit map to point with some padding
    if (mapRef.fitBounds) {
      const padding = 0.01; // ~1km padding
      const bounds: [[number, number], [number, number]] = [
        [lat - padding, lon - padding],
        [lat + padding, lon + padding],
      ];
      mapRef.fitBounds(bounds);
    }

    return pointElement;
  };

  // Update element visibility
  const updateElementVisibility = (
    elementType: string,
    elementId: string | undefined,
    visible: boolean
  ) => {
    if (!mapRef.map?.value || !elementId) {
      return;
    }

    const leafletId = layersStore.getLeafletId(elementType, elementId);
    if (!leafletId) {
      return;
    }

    let found = false;

    // First, try to find and toggle the layer if it's currently on the map
    mapRef.map.value.eachLayer((layer: any) => {
      if (L.stamp(layer) === leafletId) {
        found = true;
        if (visible) {
          // Layer is already visible, nothing to do
          return;
        } else {
          // Remove layer from map
          mapRef.map.value.removeLayer(layer);
        }
      }
    });

    // If we need to show the element but it wasn't found on the map, we need to redraw it
    if (visible && !found) {
      // Redraw the element based on its type (without adding to store)
      switch (elementType) {
        case 'circle': {
          const circle = layersStore.circles.find((c) => c.id === elementId);
          if (circle && circle.id) {
            redrawCircleOnMap(circle.id, circle.center.lat, circle.center.lon, circle.radius);
          }

          break;
        }
        case 'lineSegment': {
          const segment = layersStore.lineSegments.find((s) => s.id === elementId);
          if (segment && segment.id && segment.mode === 'parallel') {
            // For parallel lines, redraw them using drawParallel
            drawParallel(segment.longitude === undefined ? 0 : segment.longitude, segment.name);
          } else if (segment && segment.id && segment.endpoint) {
            redrawLineSegmentOnMap(
              segment.id,
              segment.center.lat,
              segment.center.lon,
              segment.endpoint.lat,
              segment.endpoint.lon,
              segment.mode as 'coordinate' | 'azimuth' | 'intersection',
              segment.intersectionPoint?.lat,
              segment.intersectionPoint?.lon
            );
          }

          break;
        }
        case 'point': {
          const point = layersStore.points.find((p) => p.id === elementId);
          if (point && point.id) {
            redrawPointOnMap(point.id, point.coordinates.lat, point.coordinates.lon);
          }

          break;
        }
        case 'polygon': {
          const polygon = layersStore.polygons.find((p) => p.id === elementId);
          if (polygon && polygon.id) {
            redrawPolygonOnMap(polygon.id, polygon.points, polygon.color);
          }

          break;
        }
        // No default
      }
    }

    // For intersection markers, also toggle their visibility
    if (elementType === 'lineSegment') {
      const className = `intersection-${elementId}`;
      const elements = document.querySelectorAll(`.${className}`);
      for (const el of elements) {
        const svgElement = el.closest('svg');
        if (svgElement) {
          svgElement.style.display = visible ? '' : 'none';
        }
      }
    }
  };

  // Delete element from map
  const deleteElement = (elementType: string, elementId: string | undefined) => {
    if (!mapRef.map?.value || !elementId) {
      return;
    }

    // Remove from map using Leaflet's layer management
    // Use both className and leafletId as fallbacks for robustness
    switch (elementType) {
      case 'circle': {
        const circle = layersStore.circles.find((c) => c.id === elementId);
        if (circle && circle.leafletId !== undefined) {
          mapRef.map.value.eachLayer((layer: any) => {
            if (L.stamp(layer) === circle.leafletId) {
              mapRef.map.value.removeLayer(layer);
            }
          });
        }

        break;
      }
      case 'lineSegment': {
        // Remove the line segment layer
        const segment = layersStore.lineSegments.find((s) => s.id === elementId);
        if (segment && segment.leafletId !== undefined) {
          mapRef.map.value.eachLayer((layer: any) => {
            if (L.stamp(layer) === segment.leafletId) {
              mapRef.map.value.removeLayer(layer);
            }
          });
        }

        // Also remove intersection marker if present
        const intersectionPoint = layersStore.lineSegments.find((s) => s.id === elementId);
        if (intersectionPoint && intersectionPoint.leafletId !== undefined) {
          mapRef.map.value.eachLayer((layer: any) => {
            // Check if this is an intersection marker for this line by looking at className
            const className = layer.options?.className;
            if (className && className.includes(`intersection-${elementId}`)) {
              mapRef.map.value.removeLayer(layer);
            }
          });
        }

        break;
      }
      case 'point': {
        const point = layersStore.points.find((p) => p.id === elementId);
        if (point && point.leafletId !== undefined) {
          mapRef.map.value.eachLayer((layer: any) => {
            if (L.stamp(layer) === point.leafletId) {
              mapRef.map.value.removeLayer(layer);
            }
          });
        }

        break;
      }
      case 'polygon': {
        const polygon = layersStore.polygons.find((p) => p.id === elementId);
        if (polygon && polygon.leafletId !== undefined) {
          mapRef.map.value.eachLayer((layer: any) => {
            if (L.stamp(layer) === polygon.leafletId) {
              mapRef.map.value.removeLayer(layer);
            }
          });
        }

        break;
      }
      // No default
    }

    // Delete any notes linked to this element
    const linkedNotes = layersStore.notes.filter(
      (note) => note.linkedElementType === elementType && note.linkedElementId === elementId
    );
    for (const note of linkedNotes) {
      if (note.id) {
        layersStore.deleteNote(note.id);
      }
    }

    // Remove from store
    switch (elementType) {
      case 'circle': {
        layersStore.deleteCircle(elementId);
        break;
      }
      case 'lineSegment': {
        layersStore.deleteLineSegment(elementId);
        break;
      }
      case 'point': {
        layersStore.deletePoint(elementId);
        break;
      }
      case 'polygon': {
        layersStore.deletePolygon(elementId);
        break;
      }
      // No default
    }
  };

  // Clear all elements
  const clearAllElements = () => {
    layersStore.clearLayers();
    if (mapRef.map?.value) {
      // Remove all custom layers (not tiles)
      mapRef.map.value.eachLayer((layer: any) => {
        if (
          layer instanceof L.Polyline ||
          layer instanceof L.CircleMarker ||
          layer instanceof L.Polygon
        ) {
          mapRef.map?.value?.removeLayer(layer);
        }
      });
    }
  };

  // Redraw all elements on map (useful after loading project)
  // eslint-disable-next-line complexity
  const redrawAllElements = () => {
    // Clear only map layers, not the store (store is already populated)
    if (mapRef.map?.value) {
      mapRef.map.value.eachLayer((layer: any) => {
        if (
          layer instanceof L.Polyline ||
          layer instanceof L.CircleMarker ||
          layer instanceof L.Polygon
        ) {
          mapRef.map?.value?.removeLayer(layer);
        }
      });
    }

    const circles = layersStore.circles;
    const lineSegments = layersStore.lineSegments;
    const points = layersStore.points;
    const polygons = layersStore.polygons;

    // Redraw circles (using redraw helper to avoid adding to store twice)
    for (const circle of circles) {
      if (circle.id) {
        redrawCircleOnMap(
          circle.id,
          circle.center.lat,
          circle.center.lon,
          circle.radius,
          circle.color
        );
      }
    }

    // Redraw line segments (using redraw helper to avoid adding to store twice)
    for (const segment of lineSegments) {
      if (segment.id) {
        if (segment.mode === 'parallel' && segment.longitude !== undefined) {
          // Redraw parallel line
          redrawParallelOnMap(segment.id, segment.longitude, segment.color);
        } else if (segment.endpoint) {
          // Redraw regular line segment
          redrawLineSegmentOnMap(
            segment.id,
            segment.center.lat,
            segment.center.lon,
            segment.endpoint.lat,
            segment.endpoint.lon,
            segment.mode as 'coordinate' | 'azimuth' | 'intersection',
            segment.intersectionPoint?.lat,
            segment.intersectionPoint?.lon,
            segment.color
          );
        }
      }
    }

    // Redraw points (using redraw helper to avoid adding to store twice)
    for (const point of points) {
      if (point.id) {
        redrawPointOnMap(point.id, point.coordinates.lat, point.coordinates.lon, point.color);
      }
    }

    // Redraw polygons (using redraw helper to avoid adding to store twice)
    for (const polygon of polygons) {
      if (polygon.id) {
        redrawPolygonOnMap(polygon.id, polygon.points, polygon.color);
      }
    }

    // Fit map to all elements if any exist
    if (
      (circles.length > 0 || lineSegments.length > 0 || points.length > 0 || polygons.length > 0) &&
      mapRef.fitBounds
    ) {
      // Calculate bounds that include all elements
      let minLat = 90,
        maxLat = -90,
        minLon = 180,
        maxLon = -180;

      for (const circle of circles) {
        const lat = circle.center.lat;
        const lon = circle.center.lon;
        const radiusInDegrees = circle.radius / 111; // Approximate: 111km per degree
        minLat = Math.min(minLat, lat - radiusInDegrees);
        maxLat = Math.max(maxLat, lat + radiusInDegrees);
        minLon = Math.min(minLon, lon - radiusInDegrees);
        maxLon = Math.max(maxLon, lon + radiusInDegrees);
      }

      for (const segment of lineSegments) {
        minLat = Math.min(minLat, segment.center.lat, segment.endpoint?.lat || 90);
        maxLat = Math.max(maxLat, segment.center.lat, segment.endpoint?.lat || -90);
        minLon = Math.min(minLon, segment.center.lon, segment.endpoint?.lon || 180);
        maxLon = Math.max(maxLon, segment.center.lon, segment.endpoint?.lon || -180);
      }

      for (const point of points) {
        minLat = Math.min(minLat, point.coordinates.lat);
        maxLat = Math.max(maxLat, point.coordinates.lat);
        minLon = Math.min(minLon, point.coordinates.lon);
        maxLon = Math.max(maxLon, point.coordinates.lon);
      }

      for (const polygon of polygons) {
        for (const point of polygon.points) {
          minLat = Math.min(minLat, point.lat);
          maxLat = Math.max(maxLat, point.lat);
          minLon = Math.min(minLon, point.lon);
          maxLon = Math.max(maxLon, point.lon);
        }
      }

      if (minLat <= maxLat && minLon <= maxLon) {
        mapRef.fitBounds([
          [minLat, minLon],
          [maxLat, maxLon],
        ]);
      }
    }
  };

  // Parallel drawing
  const drawParallel = (latitude: number, name?: string): LineSegmentElement | null => {
    if (!mapRef.map?.value) {
      return null;
    }

    const lineId = generateId();
    const lineElement = {
      id: lineId,
      name: name || `Parallel ${layersStore.lineSegmentCount + 1}`,
      center: { lat: latitude, lon: 0 },
      mode: 'parallel' as const,
      longitude: latitude,
      color: DEFAULT_COLOR,
    } as LineSegmentElement;

    // Draw parallel (horizontal line) from west to east at constant latitude
    const latLngs: [number, number][] = [
      [latitude, -180],
      [latitude, 180],
    ];

    const polyline = L.polyline(latLngs, {
      color: lineElement.color,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    // Store Leaflet ID
    lineElement.leafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, lineElement.leafletId);

    // Add to store
    layersStore.addLineSegment(lineElement);

    // Fit map to parallel bounds
    if (mapRef.fitBounds) {
      const bounds: [[number, number], [number, number]] = [
        [latitude - 1, -180],
        [latitude + 1, 180],
      ];
      mapRef.fitBounds(bounds);
    }

    return lineElement;
  };

  // Update existing parallel
  const updateParallel = (lineId: string, latitude: number, name: string) => {
    if (!mapRef.map?.value || !lineId) {
      return;
    }

    // Update store
    layersStore.updateLineSegment(lineId, {
      name,
      center: { lat: latitude, lon: 0 },
      mode: 'parallel',
      longitude: latitude,
    });

    // Remove old parallel from map
    const line = layersStore.lineSegments.find((l) => l.id === lineId);
    if (line && line.leafletId) {
      mapRef.map.value.eachLayer((layer: any) => {
        if (L.stamp(layer) === line.leafletId) {
          mapRef.map.value.removeLayer(layer);
        }
      });
    }

    // Redraw parallel
    const latLngs: [number, number][] = [
      [latitude, -180],
      [latitude, 180],
    ];

    const polyline = L.polyline(latLngs, {
      color: DEFAULT_COLOR,
      weight: 3,
      opacity: 1,
      className: `line-layer line-${lineId}`,
    }).addTo(mapRef.map.value);

    // Update Leaflet ID in store
    const newLeafletId = L.stamp(polyline);
    layersStore.storeLeafletId('lineSegment', lineId, newLeafletId);
  };

  // Polygon drawing
  const drawPolygon = (points: { lat: number; lon: number }[], name?: string, color?: string) => {
    if (!mapRef.map?.value) {
      return null;
    }

    if (points.length < 3) {
      console.warn('Polygon must have at least 3 points');
      return null;
    }

    const polygonId = generateId();
    const polygonColor = color || '#90EE90'; // Light green
    const polygonElement: PolygonElement = {
      id: polygonId,
      name: name || `Polygon ${layersStore.polygonCount + 1}`,
      points,
      color: polygonColor,
    };

    // Create Leaflet polygon
    const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);
    const polygon = L.polygon(latLngs, {
      color: polygonColor,
      fillColor: polygonColor,
      fillOpacity: 0.2,
      weight: 3,
      opacity: 1,
      className: `polygon-layer polygon-${polygonId}`,
    }).addTo(mapRef.map.value);

    // Store Leaflet ID
    polygonElement.leafletId = L.stamp(polygon);
    layersStore.storeLeafletId('polygon', polygonId, polygonElement.leafletId);

    // Add to store
    layersStore.addPolygon(polygonElement);

    // Fit map to polygon bounds
    if (mapRef.fitBounds) {
      const bounds = polygon.getBounds();
      mapRef.fitBounds([
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
      ]);
    }

    return polygonElement;
  };

  // Helper function to redraw a polygon on the map without adding to store
  const redrawPolygonOnMap = (
    polygonId: string,
    points: { lat: number; lon: number }[],
    color = '#90EE90'
  ) => {
    if (!mapRef.map?.value) {
      return;
    }

    const polygonColor = color;
    const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

    const polygon = L.polygon(latLngs, {
      color: polygonColor,
      fillColor: polygonColor,
      fillOpacity: 0.2,
      weight: 3,
      opacity: 1,
      className: `polygon-layer polygon-${polygonId}`,
    }).addTo(mapRef.map.value);

    const newLeafletId = L.stamp(polygon);
    layersStore.storeLeafletId('polygon', polygonId, newLeafletId);

    // Update the polygon element's leafletId in the store
    const polygonElement = layersStore.polygons.find((p) => p.id === polygonId);
    if (polygonElement) {
      polygonElement.leafletId = newLeafletId;
    }
  };

  return {
    drawCircle,
    updateCircle,
    drawLineSegment,
    updateLineSegment,
    drawParallel,
    updateParallel,
    drawPoint,
    drawPolygon,
    updateElementVisibility,
    deleteElement,
    clearAllElements,
    redrawAllElements,
  };
}
