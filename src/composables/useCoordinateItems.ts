import { computed } from 'vue';
import { useCoordinatesStore } from '@/stores/coordinates';

/**
 * Composable that provides formatted coordinate items for dropdown selectors
 * @returns computed array of coordinate items with label and value
 */
export function useCoordinateItems() {
  const coordinatesStore = useCoordinatesStore();

  const coordinateItems = computed(() => {
    return coordinatesStore.savedCoordinates.map((coord) => ({
      label: `${coord.name} (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`,
      value: `${coord.lat},${coord.lon}`,
    }));
  });

  return { coordinateItems };
}
