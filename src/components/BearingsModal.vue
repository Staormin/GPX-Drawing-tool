<template>
  <v-dialog
    v-model="isOpen"
    max-width="700px"
    @click:outside="closeModal"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title class="flex items-center justify-between">
        <span>Bearings from {{ sourcePoint?.name }}</span>
        <v-btn icon="mdi-close" size="small" variant="text" @click="closeModal" />
      </v-card-title>
      <v-card-text>
        <!-- Source Point Info -->
        <div v-if="sourcePoint" class="mb-4 p-4 bg-blue-50 rounded">
          <div class="font-semibold mb-1">{{ sourcePoint.name }}</div>
          <div class="text-sm text-gray-600">
            {{ sourcePoint.coordinates.lat.toFixed(6) }},
            {{ sourcePoint.coordinates.lon.toFixed(6) }}
          </div>
        </div>

        <!-- Other Points List -->
        <div v-if="otherPoints.length === 0" class="text-center text-gray-500 py-8">
          No other points in the project to calculate bearings to.
        </div>

        <v-table v-else density="compact">
          <thead>
            <tr>
              <th class="text-left cursor-pointer select-none" @click="sortBy('name')">
                <div class="flex items-center gap-1">
                  Point
                  <v-icon v-if="sortField === 'name'" size="small">{{
                    sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
                  }}</v-icon>
                </div>
              </th>
              <th class="text-right cursor-pointer select-none" @click="sortBy('distance')">
                <div class="flex items-center justify-end gap-1">
                  Distance (km)
                  <v-icon v-if="sortField === 'distance'" size="small">{{
                    sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
                  }}</v-icon>
                </div>
              </th>
              <th class="text-right cursor-pointer select-none" @click="sortBy('azimuth')">
                <div class="flex items-center justify-end gap-1">
                  Azimuth (°)
                  <v-icon v-if="sortField === 'azimuth'" size="small">{{
                    sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
                  }}</v-icon>
                </div>
              </th>
              <th class="text-right cursor-pointer select-none" @click="sortBy('inverseAzimuth')">
                <div class="flex items-center justify-end gap-1">
                  Inverse Azimuth (°)
                  <v-icon v-if="sortField === 'inverseAzimuth'" size="small">{{
                    sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
                  }}</v-icon>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pointData in sortedBearingsData"
              :key="pointData.point.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="handlePointClick(pointData.point)"
            >
              <td>
                <div class="font-medium">{{ pointData.point.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ pointData.point.coordinates.lat.toFixed(6) }},
                  {{ pointData.point.coordinates.lon.toFixed(6) }}
                </div>
              </td>
              <td class="text-right font-mono">{{ pointData.distance.toFixed(3) }}</td>
              <td class="text-right font-mono">{{ pointData.azimuth.toFixed(2) }}</td>
              <td class="text-right font-mono">{{ pointData.inverseAzimuth.toFixed(2) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeModal">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PointElement } from '@/services/storage';
import { computed, inject, ref } from 'vue';
import { calculateBearing, calculateDistance, calculateInverseBearing } from '@/services/geometry';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const mapContainer = inject('mapContainer') as any;

type SortField = 'name' | 'distance' | 'azimuth' | 'inverseAzimuth';
type SortDirection = 'asc' | 'desc';

const sortField = ref<SortField>('distance');
const sortDirection = ref<SortDirection>('asc');

const isOpen = computed({
  get: () => uiStore.bearingsPanel.isOpen,
  set: (value) => {
    if (!value) closeModal();
  },
});

const sourcePoint = computed(() => {
  if (!uiStore.bearingsPanel.sourcePointId) return null;
  return layersStore.points.find((p) => p.id === uiStore.bearingsPanel.sourcePointId);
});

const otherPoints = computed(() => {
  if (!uiStore.bearingsPanel.sourcePointId) return [];
  return layersStore.points.filter((p) => p.id !== uiStore.bearingsPanel.sourcePointId);
});

interface BearingData {
  point: PointElement;
  distance: number;
  azimuth: number;
  inverseAzimuth: number;
}

const bearingsData = computed<BearingData[]>(() => {
  if (!sourcePoint.value) return [];

  return otherPoints.value.map((point) => {
    const distance = calculateDistance(
      sourcePoint.value!.coordinates.lat,
      sourcePoint.value!.coordinates.lon,
      point.coordinates.lat,
      point.coordinates.lon
    );

    const azimuth = calculateBearing(
      sourcePoint.value!.coordinates.lat,
      sourcePoint.value!.coordinates.lon,
      point.coordinates.lat,
      point.coordinates.lon
    );

    const inverseAzimuth = calculateInverseBearing(
      sourcePoint.value!.coordinates.lat,
      sourcePoint.value!.coordinates.lon,
      point.coordinates.lat,
      point.coordinates.lon
    );

    return {
      point,
      distance,
      azimuth,
      inverseAzimuth,
    };
  });
});

const sortedBearingsData = computed<BearingData[]>(() => {
  const data = [...bearingsData.value];

  data.sort((a, b) => {
    let compareValue = 0;

    switch (sortField.value) {
      case 'name': {
        compareValue = a.point.name.localeCompare(b.point.name);
        break;
      }
      case 'distance': {
        compareValue = a.distance - b.distance;
        break;
      }
      case 'azimuth': {
        compareValue = a.azimuth - b.azimuth;
        break;
      }
      case 'inverseAzimuth': {
        compareValue = a.inverseAzimuth - b.inverseAzimuth;
        break;
      }
    }

    return sortDirection.value === 'asc' ? compareValue : -compareValue;
  });

  return data;
});

function sortBy(field: SortField) {
  if (sortField.value === field) {
    // Toggle direction if clicking the same field
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new field and default to ascending
    sortField.value = field;
    sortDirection.value = 'asc';
  }
}

function handlePointClick(point: PointElement) {
  // Navigate to the point on the map
  const lat = point.coordinates.lat;
  const lon = point.coordinates.lon;
  const zoom = 16; // Closer zoom for points

  mapContainer.setCenter(lat, lon, zoom);

  // Close the modal
  closeModal();
}

function closeModal() {
  uiStore.closeBearings();
}
</script>
