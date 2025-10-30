<template>
  <v-dialog
    v-model="isOpen"
    max-width="800px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card class="d-flex flex-column line-segment-modal-card">
      <v-card-title class="flex-shrink-0">{{
        isEditing ? 'Edit Line Segment' : 'Add Line Segment'
      }}</v-card-title>
      <v-card-text class="flex-1-1 overflow-y-auto">
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Line Name"
            variant="outlined"
          />

          <!-- Mode selector as tabs -->
          <v-tabs v-model="form.mode" bg-color="transparent" class="mb-4" color="primary" grow>
            <v-tab value="coordinate">
              <span class="text-xs">Two Points</span>
            </v-tab>
            <v-tab value="azimuth">
              <span class="text-xs">Azimuth</span>
            </v-tab>
            <v-tab value="intersection">
              <span class="text-xs">Intersection</span>
            </v-tab>
            <v-tab value="parallel">
              <span class="text-xs">Parallel</span>
            </v-tab>
            <v-tab value="freehand">
              <span class="text-xs">Free Hand</span>
            </v-tab>
          </v-tabs>

          <div class="h-[280px]">
            <!-- Start Coordinates selector (except parallel) -->
            <v-select
              v-if="form.mode !== 'parallel'"
              v-model="form.startCoord"
              class="mb-4"
              clearable
              density="compact"
              item-title="label"
              item-value="value"
              :items="coordinateItems"
              :label="
                form.mode === 'freehand' ? 'Start Coordinates (optional)' : 'Start Coordinates'
              "
              placeholder="Select a saved coordinate"
              variant="outlined"
            >
              <template #no-data>
                <v-list-item>
                  <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>

            <!-- Parallel mode coordinate selector -->
            <v-select
              v-if="form.mode === 'parallel'"
              v-model="form.startCoord"
              class="mb-4"
              clearable
              density="compact"
              item-title="label"
              item-value="value"
              :items="parallelCoordinateItems"
              label="Latitude"
              placeholder="Select a saved coordinate"
              variant="outlined"
            >
              <template #no-data>
                <v-list-item>
                  <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>

            <template v-if="form.mode === 'coordinate'">
              <!-- End Coordinates selector -->
              <v-select
                v-model="form.endCoord"
                class="mb-4"
                clearable
                density="compact"
                item-title="label"
                item-value="value"
                :items="coordinateItems"
                label="End Coordinates"
                placeholder="Select a saved coordinate"
                variant="outlined"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
            </template>

            <template v-if="form.mode === 'azimuth'">
              <v-text-field
                v-model.number="form.azimuth"
                class="mb-4"
                density="compact"
                label="Azimuth (degrees)"
                max="360"
                min="0"
                step="0.01"
                type="number"
                variant="outlined"
              />

              <v-text-field
                v-model.number="form.distance"
                class="mb-4"
                density="compact"
                label="Distance (km)"
                min="0"
                step="0.1"
                type="number"
                variant="outlined"
              />
            </template>

            <template v-if="form.mode === 'intersection'">
              <!-- Intersection Coordinates selector -->
              <v-select
                v-model="form.intersectCoord"
                class="mb-4"
                clearable
                density="compact"
                item-title="label"
                item-value="value"
                :items="coordinateItems"
                label="Intersection Coordinates"
                placeholder="Select a saved coordinate"
                variant="outlined"
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>

              <v-text-field
                v-model.number="form.distance"
                class="mb-4"
                density="compact"
                label="Distance (km)"
                min="0"
                step="0.1"
                type="number"
                variant="outlined"
              />
            </template>

            <template v-if="form.mode === 'freehand'">
              <!-- Free Hand mode -->
              <v-text-field
                v-model.number="form.freehandAzimuth"
                class="mb-4"
                density="compact"
                label="Azimuth (degrees, optional)"
                max="360"
                min="0"
                placeholder="Leave empty for free direction"
                step="0.01"
                type="number"
                variant="outlined"
              />

              <div class="text-sm text-medium-emphasis mb-4">
                Click "Start Drawing" to enter drawing mode. Move your mouse to set the endpoint.
                Press Escape to cancel.
              </div>
            </template>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="flex-shrink-0">
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">{{
          form.mode === 'freehand' ? 'Start Drawing' : isEditing ? 'Update Line' : 'Add Line'
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { getReverseGeocodeAddress } from '@/services/address';
import { calculateDistance, destinationPoint, endpointFromIntersection } from '@/services/geometry';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const coordinatesStore = useCoordinatesStore();
inject('mapContainer');
const drawing = inject('drawing') as any;

const form = ref({
  name: '',
  mode: 'coordinate' as 'coordinate' | 'azimuth' | 'intersection' | 'parallel' | 'freehand',
  startCoord: '',
  endCoord: '',
  azimuth: 45,
  distance: 10,
  intersectCoord: '',
  freehandAzimuth: undefined as number | undefined,
});

const coordinateItems = computed(() => {
  return coordinatesStore.sortedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`,
    value: `${coord.lat}, ${coord.lon}`,
  }));
});

const parallelCoordinateItems = computed(() => {
  return coordinatesStore.sortedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)})`,
    value: `${coord.lat}`,
  }));
});

const isOpen = computed({
  get: () => uiStore.isModalOpen('lineSegmentModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

const isEditing = computed(() => {
  return uiStore.isEditing('lineSegment', uiStore.editingElement?.id || '');
});

// Watch for modal opening - pre-fill form with current element data
watch(
  () => isOpen.value,
  (newValue) => {
    if (newValue && uiStore.editingElement?.type === 'lineSegment') {
      const segment = layersStore.lineSegments.find((l) => l.id === uiStore.editingElement?.id);
      if (segment) {
        form.value = {
          name: segment.name,
          mode: segment.mode as 'coordinate' | 'azimuth' | 'intersection' | 'parallel' | 'freehand',
          startCoord: `${segment.center.lat}, ${segment.center.lon}`,
          endCoord: segment.endpoint ? `${segment.endpoint.lat}, ${segment.endpoint.lon}` : '',
          azimuth: segment.azimuth === undefined ? 45 : segment.azimuth,
          distance: segment.distance === undefined ? 10 : segment.distance,
          intersectCoord: segment.intersectionPoint
            ? `${segment.intersectionPoint.lat}, ${segment.intersectionPoint.lon}`
            : '',
          freehandAzimuth: undefined,
        };
      }
    }
  },
  { immediate: true }
);

// Watch for creating state changes with pre-fill values
watch(
  () => uiStore.creatingElement,
  (newValue) => {
    if (newValue?.type === 'lineSegment') {
      // Reset form to defaults
      form.value = {
        name: '',
        mode: 'coordinate',
        startCoord: '',
        endCoord: '',
        azimuth: 45,
        distance: 10,
        intersectCoord: '',
        freehandAzimuth: undefined,
      };

      // Apply pre-fill values if they exist
      if (uiStore.lineSegmentStartPreFill) {
        form.value.startCoord = `${uiStore.lineSegmentStartPreFill.lat}, ${uiStore.lineSegmentStartPreFill.lon}`;
      }

      if (uiStore.lineSegmentEndPreFill) {
        form.value.endCoord = `${uiStore.lineSegmentEndPreFill.lat}, ${uiStore.lineSegmentEndPreFill.lon}`;
      }
    }
  },
  { immediate: true }
);

function parseCoordinateString(coordString: string): [number, number] | null {
  const parts = coordString.split(',').map((s) => Number.parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some((p) => Number.isNaN(p))) {
    return null;
  }
  return [parts[0]!, parts[1]!];
}

async function submitForm() {
  try {
    // Handle free hand mode separately
    if (form.value.mode === 'freehand') {
      // Enter free hand drawing mode
      uiStore.startFreeHandDrawing(
        form.value.startCoord || null,
        form.value.freehandAzimuth,
        form.value.name.trim()
      );
      closeModal();
      return;
    }

    // Handle parallel mode separately
    if (form.value.mode === 'parallel') {
      if (!form.value.startCoord) {
        uiStore.addToast('Please select latitude coordinates', 'error');
        return;
      }

      // Parse the latitude value from startCoord
      const latStr = form.value.startCoord.trim();
      const latitude = Number.parseFloat(latStr);

      if (Number.isNaN(latitude)) {
        uiStore.addToast('Please enter a valid latitude value', 'error');
        return;
      }

      if (latitude < -90 || latitude > 90) {
        uiStore.addToast('Latitude must be between -90 and 90 degrees', 'error');
        return;
      }

      let name = form.value.name.trim();
      if (!name) {
        // Smart naming for parallel: use latitude description
        if (latitude === 0) {
          name = 'Equator';
        } else {
          const hemisphere = latitude > 0 ? 'N' : 'S';
          name = `Parallel ${Math.abs(latitude).toFixed(4)}°${hemisphere}`;
        }
      }

      if (isEditing.value && uiStore.editingElement) {
        // Update existing parallel
        drawing.updateParallel(uiStore.editingElement.id, latitude, name);
        uiStore.addToast('Parallel updated successfully!', 'success');
        uiStore.stopEditing();
      } else {
        // Add new parallel
        drawing.drawParallel(latitude, name);
        uiStore.addToast('Parallel added successfully!', 'success');
      }
      closeModal();
      resetForm();
      return;
    }

    // Validate start coordinates
    if (!form.value.startCoord) {
      uiStore.addToast('Please select start coordinates', 'error');
      return;
    }

    // Parse start coordinates for non-meridian modes
    const startCoord = parseCoordinateString(form.value.startCoord);
    if (!startCoord) {
      uiStore.addToast(
        'Invalid start coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)',
        'error'
      );
      return;
    }
    const [startLat, startLon] = startCoord;

    let endLat: number;
    let endLon: number;
    let intersectLat: number | undefined;
    let intersectLon: number | undefined;
    let intersectDistance: number | undefined;

    switch (form.value.mode) {
      case 'coordinate': {
        if (!form.value.endCoord) {
          uiStore.addToast('Please select end coordinates', 'error');
          return;
        }
        const endCoord = parseCoordinateString(form.value.endCoord);
        if (!endCoord) {
          uiStore.addToast(
            'Invalid end coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)',
            'error'
          );
          return;
        }
        [endLat, endLon] = endCoord;

        break;
      }
      case 'azimuth': {
        const endpoint = destinationPoint(
          startLat,
          startLon,
          form.value.distance,
          form.value.azimuth
        );
        endLat = endpoint.lat;
        endLon = endpoint.lon;

        break;
      }
      case 'intersection': {
        if (!form.value.intersectCoord) {
          uiStore.addToast('Please select intersection coordinates', 'error');
          return;
        }
        const intersectCoord = parseCoordinateString(form.value.intersectCoord);
        if (!intersectCoord) {
          uiStore.addToast(
            'Invalid intersection coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)',
            'error'
          );
          return;
        }
        [intersectLat, intersectLon] = intersectCoord;

        // Validate distance is >= distance to intersection point
        const distToIntersection = calculateDistance(
          startLat,
          startLon,
          intersectLat,
          intersectLon
        );
        if (form.value.distance < distToIntersection - 1e-6) {
          uiStore.addToast(
            `Distance must be at least ${distToIntersection.toFixed(2)} km (distance to intersection)`,
            'error'
          );
          return;
        }

        const endpoint = endpointFromIntersection(
          startLat,
          startLon,
          intersectLat,
          intersectLon,
          form.value.distance
        );
        endLat = endpoint.lat;
        endLon = endpoint.lon;
        intersectDistance = form.value.distance;

        break;
      }
      default: {
        throw new Error('Invalid mode');
      }
    }

    // Smart name autogeneration
    let name = form.value.name.trim();
    if (!name) {
      switch (form.value.mode) {
        case 'coordinate': {
          // Try to find saved coordinate names for smart naming
          const startCoordSaved = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - startLat) < 0.0001 && Math.abs(c.lon - startLon) < 0.0001
          );
          const endCoordSaved = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - endLat) < 0.0001 && Math.abs(c.lon - endLon) < 0.0001
          );

          if (startCoordSaved && endCoordSaved) {
            name = `${startCoordSaved.name} => ${endCoordSaved.name}`;
          } else if (startCoordSaved || endCoordSaved) {
            // One coordinate is saved, try reverse geocoding for the other
            const startName = startCoordSaved?.name;
            const endName = endCoordSaved?.name;

            if (startName) {
              const { address } = await getReverseGeocodeAddress(endLat, endLon);
              const generatedEndName = address || `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`;
              name = `${startName} => ${generatedEndName}`;
            } else {
              const { address } = await getReverseGeocodeAddress(startLat, startLon);
              const generatedStartName =
                address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
              name = `${generatedStartName} => ${endName}`;
            }
          } else {
            // Neither coordinate is saved, try reverse geocoding for both
            const [startResult, endResult] = await Promise.all([
              getReverseGeocodeAddress(startLat, startLon),
              getReverseGeocodeAddress(endLat, endLon),
            ]);

            const startName =
              startResult.address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
            const endName = endResult.address || `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`;
            name = `${startName} => ${endName}`;
          }

          break;
        }
        case 'azimuth': {
          // Azimuth mode: "From [location] at [azimuth]°"
          const startCoordSaved = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - startLat) < 0.0001 && Math.abs(c.lon - startLon) < 0.0001
          );

          if (startCoordSaved) {
            name = `From ${startCoordSaved.name} at ${form.value.azimuth}°`;
          } else {
            const { address } = await getReverseGeocodeAddress(startLat, startLon);
            const startName = address || `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
            name = `From ${startName} at ${form.value.azimuth}°`;
          }

          break;
        }
        case 'intersection': {
          // Intersection mode: "From [start] via [intersection]"
          const startCoordSaved = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - startLat) < 0.0001 && Math.abs(c.lon - startLon) < 0.0001
          );
          const intersectCoordSaved = coordinatesStore.sortedCoordinates.find(
            (c: any) =>
              Math.abs(c.lat - intersectLat!) < 0.0001 && Math.abs(c.lon - intersectLon!) < 0.0001
          );

          const startName =
            startCoordSaved?.name ||
            (await getReverseGeocodeAddress(startLat, startLon)).address ||
            `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`;
          const intersectName =
            intersectCoordSaved?.name ||
            (await getReverseGeocodeAddress(intersectLat!, intersectLon!)).address ||
            `${intersectLat!.toFixed(4)}, ${intersectLon!.toFixed(4)}`;

          name = `From ${startName} via ${intersectName}`;

          break;
        }
        default: {
          // Fallback
          name = `Line ${layersStore.lineSegmentCount + 1}`;
        }
      }
    }

    if (isEditing.value && uiStore.editingElement) {
      // Update existing line segment in place
      drawing.updateLineSegment(
        uiStore.editingElement.id,
        startLat,
        startLon,
        endLat,
        endLon,
        name,
        form.value.mode,
        form.value.distance,
        form.value.azimuth,
        intersectLat,
        intersectLon,
        intersectDistance
      );
      uiStore.addToast('Line segment updated successfully!', 'success');
      uiStore.stopEditing();
    } else {
      drawing.drawLineSegment(
        startLat,
        startLon,
        endLat,
        endLon,
        name,
        form.value.mode,
        form.value.distance,
        form.value.azimuth,
        intersectLat,
        intersectLon,
        intersectDistance
      );
      uiStore.addToast('Line segment added successfully!', 'success');
    }
    closeModal();
    resetForm();
  } catch (error) {
    uiStore.addToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

function closeModal() {
  uiStore.closeModal('lineSegmentModal');
  uiStore.stopEditing();
  uiStore.stopCreating();
}

function resetForm() {
  form.value = {
    name: '',
    mode: 'coordinate',
    startCoord: '',
    endCoord: '',
    azimuth: 45,
    distance: 10,
    intersectCoord: '',
    freehandAzimuth: undefined,
  };
}
</script>

<style>
.line-segment-modal-card {
  height: 520px !important;
  min-height: 520px !important;
  max-height: 520px !important;
}
</style>
