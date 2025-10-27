/**
 * Composable for Leaflet map management
 */

import L from 'leaflet';
import { nextTick, ref } from 'vue';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapTilesUrl } from '@/services/geoportail';

export type MapContainer = ReturnType<typeof useMap>;

export function useMap(containerId: string) {
  const map = ref<L.Map | null>(null);
  const isMapInitialized = ref(false);
  const mapLayers = ref<L.Layer[]>([]);

  const initMap = async () => {
    const element = document.querySelector(`#${containerId}`);
    if (!element || isMapInitialized.value) {
      return;
    }

    try {
      // Wait for next Vue tick to ensure DOM is ready
      await nextTick();

      // Create map centered on default location
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      map.value = L.map(containerId, {
        preferCanvas: true,
        zoomControl: false,
        attributionControl: false,
      } as any).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lon], DEFAULT_MAP_ZOOM);

      // Add tile layer from Geoportail
      const tileLayer: L.TileLayer = L.tileLayer(getMapTilesUrl(), {
        attribution: '',
        minZoom: 0,
        maxZoom: 18,
        crossOrigin: 'anonymous',
        tileSize: 256,
        updateWhenIdle: false,
      });
      tileLayer.addTo(map.value as any);

      isMapInitialized.value = true;

      // Use multiple RAF calls to ensure proper sizing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (map.value) {
            map.value.invalidateSize(true);
          }
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const destroyMap = () => {
    if (map.value) {
      map.value.off();
      map.value.remove();
      map.value = null;
      isMapInitialized.value = false;
      mapLayers.value = [];
    }
  };

  const addLayer = (layer: L.Layer): L.Layer => {
    if (map.value && layer) {
      layer.addTo(map.value as any);
      mapLayers.value.push(layer);
    }
    return layer;
  };

  const removeLayer = (layer: L.Layer): void => {
    if (map.value && layer) {
      map.value.removeLayer(layer as any);
      mapLayers.value = mapLayers.value.filter((l) => l !== layer);
    }
  };

  const clearLayers = (): void => {
    // Clear tracked layers
    for (const layer of mapLayers.value) {
      if (map.value) {
        map.value.removeLayer(layer as any);
      }
    }
    mapLayers.value = [];

    // Also clear all drawing layers from the map
    if (map.value) {
      map.value.eachLayer((layer: L.Layer) => {
        // Don't remove the tile layer
        if (!(layer instanceof L.TileLayer)) {
          map.value?.removeLayer(layer);
        }
      });
    }
  };

  const setCenter = (lat: number, lon: number, zoom?: number): void => {
    if (map.value) {
      map.value.setView([lat, lon], zoom || DEFAULT_MAP_ZOOM);
    }
  };

  const getCenter = () => {
    if (!map.value) {
      return null;
    }
    const center = map.value.getCenter();
    return { lat: center.lat, lon: center.lng };
  };

  const getZoom = (): number => {
    return map.value ? map.value.getZoom() : DEFAULT_MAP_ZOOM;
  };

  const latLngToContainerPoint = (lat: number, lon: number): L.Point | null => {
    if (!map.value) {
      return null;
    }
    return map.value.latLngToContainerPoint([lat, lon]);
  };

  const containerPointToLatLng = (x: number, y: number): { lat: number; lon: number } | null => {
    if (!map.value) {
      return null;
    }
    const latlng = map.value.containerPointToLatLng(L.point(x, y));
    return { lat: latlng.lat, lon: latlng.lng };
  };

  const fitBounds = (bounds: [[number, number], [number, number]]): void => {
    if (map.value) {
      map.value.fitBounds(bounds);
    }
  };

  const onMapClick = (callback: (lat: number, lon: number) => void): (() => void) => {
    if (!map.value) {
      return () => {};
    }

    const handler = (e: L.LeafletMouseEvent) => {
      callback(e.latlng.lat, e.latlng.lng);
    };

    map.value.on('click', handler);

    return () => {
      if (map.value) {
        map.value.off('click', handler);
      }
    };
  };

  const onMapRightClick = (callback: (lat: number, lon: number) => void): (() => void) => {
    const element = document.querySelector(`#${containerId}`);
    if (!element) {
      return () => {};
    }

    const handler = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      mouseEvent.preventDefault();
      if (!map.value) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = mouseEvent.clientX - rect.left;
      const y = mouseEvent.clientY - rect.top;
      const latlng = map.value.containerPointToLatLng(L.point(x, y));
      callback(latlng.lat, latlng.lng);
    };

    element.addEventListener('contextmenu', handler as EventListener);

    return () => {
      element.removeEventListener('contextmenu', handler as EventListener);
    };
  };

  return {
    map,
    isMapInitialized,
    mapLayers,
    initMap,
    destroyMap,
    addLayer,
    removeLayer,
    clearLayers,
    setCenter,
    getCenter,
    getZoom,
    latLngToContainerPoint,
    containerPointToLatLng,
    fitBounds,
    onMapClick,
    onMapRightClick,
  };
}
