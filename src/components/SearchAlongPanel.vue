<template>
  <!-- Match the sidebar-inner structure from index.vue -->
  <div
    ref="scrollContainer"
    style="display: flex; flex-direction: column; height: 100%; overflow-y: auto"
  >
    <!-- Sticky Header Section -->
    <div
      style="
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgb(var(--v-theme-surface));
        padding: 16px 16px 0;
      "
    >
      <!-- Header -->
      <div
        style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-bottom: 16px"
      >
        <v-btn icon="mdi-arrow-left" size="small" variant="text" @click="handleClose" />
        <span class="text-subtitle-2">Search Results</span>
      </div>

      <!-- Filter Section - Show for both line segments and points (inside sticky header) -->
      <div
        v-if="!isSearching"
        style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px"
      >
        <v-text-field
          v-model="filterText"
          clearable
          density="compact"
          :disabled="isSearching"
          placeholder="Filter results by name..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />

        <!-- Include Type Filter -->
        <v-select
          v-model="includedTypes"
          chips
          clearable
          closable-chips
          density="compact"
          :disabled="isSearching"
          :items="availableIncludeTypes"
          label="Include types"
          multiple
          variant="outlined"
        >
          <template #selection="{ index }">
            <!-- Show only first 3 chips and +X more -->
            <template v-if="index < 3 && includedTypes[index]">
              <v-chip
                class="ma-1"
                closable
                color="success"
                size="small"
                @click:close="removeIncludedType(includedTypes[index]!)"
              >
                {{ includedTypes[index] }}
              </v-chip>
            </template>
            <!-- Show +X more for remaining items after 3rd chip -->
            <span v-else-if="index === 3" class="text-caption text-medium-emphasis ml-1">
              +{{ includedTypes.length - 3 }} more
            </span>
          </template>
        </v-select>

        <!-- Exclude Type Filter -->
        <v-select
          v-model="excludedTypes"
          chips
          clearable
          closable-chips
          density="compact"
          :disabled="isSearching"
          :items="availableExcludeTypes"
          label="Exclude types"
          multiple
          variant="outlined"
        >
          <template #selection="{ index }">
            <!-- Show only first 3 chips and +X more -->
            <template v-if="index < 3 && excludedTypes[index]">
              <v-chip
                class="ma-1"
                closable
                color="error"
                size="small"
                @click:close="removeExcludedType(excludedTypes[index]!)"
              >
                {{ excludedTypes[index] }}
              </v-chip>
            </template>
            <!-- Show +X more for remaining items after 3rd chip -->
            <span v-else-if="index === 3" class="text-caption text-medium-emphasis ml-1">
              +{{ excludedTypes.length - 3 }} more
            </span>
          </template>
        </v-select>

        <!-- Distance Slider -->
        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Search Distance</label>
            <span class="text-subtitle-2 font-weight-bold text-primary"
              >{{ liveDisplayDistance.toFixed(1) }} km</span
            >
          </div>
          <v-slider
            v-model="liveDisplayDistance"
            color="primary"
            :disabled="isSearching"
            :max="maxSearchDistance"
            :min="0.5"
            :step="0.1"
            thumb-size="20"
            track-size="4"
            @mouseup="handleDisplayDistanceRelease"
            @touchend="handleDisplayDistanceRelease"
          />
        </div>

        <!-- Altitude Range Slider -->
        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Altitude Range</label>
            <span class="text-subtitle-2 font-weight-bold text-primary">
              {{ liveAltitudeRange[0].toFixed(0) }} m - {{ liveAltitudeRange[1].toFixed(0) }} m
            </span>
          </div>
          <v-range-slider
            v-model="liveAltitudeRange"
            color="primary"
            :disabled="isSearching"
            :max="altitudeMinMax.max"
            :min="altitudeMinMax.min"
            :step="10"
            thumb-size="20"
            track-size="4"
            @mouseup="handleAltitudeRangeRelease"
            @touchend="handleAltitudeRangeRelease"
          />
        </div>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div style="padding: 0 16px 96px 16px">
      <!-- Loading Indicator -->
      <div
        v-if="isSearching"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        "
      >
        <v-progress-circular color="primary" indeterminate size="48" width="4" />
        <div class="text-caption text-disabled mt-4">Searching...</div>
      </div>

      <!-- Main Content Area -->
      <template v-else>
        <!-- Results Section -->
        <div
          v-if="filteredResults.length > 0 || isFiltering"
          style="display: flex; flex-direction: column; gap: 8px"
        >
          <div style="position: relative; min-height: 100px; overflow-x: auto">
            <!-- Loading overlay -->
            <div
              v-if="isFiltering"
              style="
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                z-index: 10;
              "
            >
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px">
                <v-progress-circular color="primary" indeterminate size="32" width="3" />
                <div class="text-caption text-disabled">Filtering...</div>
              </div>
            </div>

            <!-- Results table -->
            <table style="min-width: 100%; border-collapse: collapse">
              <thead>
                <tr
                  style="
                    border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.12);
                    background-color: rgba(var(--v-theme-on-surface), 0.05);
                  "
                >
                  <th
                    style="
                      padding: 8px;
                      text-align: left;
                      cursor: pointer;
                      width: 45%;
                      min-width: 120px;
                    "
                    @click="toggleSort('name')"
                  >
                    <div class="text-xs font-medium text-slate-700 d-flex align-center gap-1">
                      Name
                      <v-icon
                        v-if="sortBy === 'name'"
                        :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                        size="16"
                      />
                    </div>
                  </th>
                  <th
                    style="
                      padding: 8px;
                      text-align: right;
                      cursor: pointer;
                      width: 27%;
                      min-width: 70px;
                    "
                    @click="toggleSort('distance')"
                  >
                    <div
                      class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1"
                    >
                      Distance
                      <v-icon
                        v-if="sortBy === 'distance'"
                        :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                        size="16"
                      />
                    </div>
                  </th>
                  <th
                    style="
                      padding: 8px;
                      text-align: right;
                      cursor: pointer;
                      width: 28%;
                      min-width: 70px;
                    "
                    @click="toggleSort('elevation')"
                  >
                    <div
                      class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1"
                    >
                      Elevation
                      <v-icon
                        v-if="sortBy === 'elevation'"
                        :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                        size="16"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(result, index) in filteredResults"
                  :key="`${result.main}-${index}`"
                  class="cursor-pointer"
                  style="
                    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
                    transition: background-color 0.2s;
                  "
                  @click="handleResultClick(result)"
                  @mouseenter="
                    (e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        'rgba(var(--v-theme-primary), 0.15)')
                  "
                  @mouseleave="
                    (e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                  "
                >
                  <td style="padding: 8px; width: 45%; min-width: 120px">
                    <div
                      class="font-medium text-sm"
                      style="
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        max-width: 100%;
                      "
                      :title="result.main.length > 35 ? result.main : ''"
                    >
                      {{
                        result.main.length > 35 ? result.main.substring(0, 35) + '...' : result.main
                      }}
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px">
                      <div
                        class="text-xs text-slate-600 text-truncate"
                        :title="result.type || 'N/A'"
                      >
                        {{ result.type || 'N/A' }}
                      </div>
                      <v-btn
                        v-if="!includedTypes.includes(result.type || 'N/A')"
                        color="success"
                        icon="mdi-plus"
                        size="x-small"
                        variant="text"
                        @click.stop="addIncludedType(result.type || 'N/A')"
                      />
                      <v-btn
                        v-if="!excludedTypes.includes(result.type || 'N/A')"
                        color="error"
                        icon="mdi-minus"
                        size="x-small"
                        variant="text"
                        @click.stop="addExcludedType(result.type || 'N/A')"
                      />
                    </div>
                  </td>
                  <td
                    style="
                      padding: 8px;
                      text-align: right;
                      width: 27%;
                      min-width: 70px;
                      white-space: nowrap;
                    "
                  >
                    <div class="text-sm font-medium">
                      {{ getResultDistance(result).toFixed(1) }} km
                    </div>
                  </td>
                  <td
                    style="
                      padding: 8px;
                      text-align: right;
                      width: 28%;
                      min-width: 70px;
                      white-space: nowrap;
                    "
                  >
                    <div class="text-sm font-medium">
                      {{ result.elevation ? `${result.elevation} m` : 'N/A' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="text-caption text-disabled text-center" style="padding: 32px 16px">
          <v-icon class="mb-2" icon="mdi-magnify" size="24" />
          <div>No results match your filter.</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type L from 'leaflet';
import type { AddressSearchResult } from '@/services/geoportail';
import * as turf from '@turf/turf';
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
import { generateLinePointsLinear } from '@/services/geometry';
import {
  distancePointToSegment,
  haversineDistance,
  searchLocationsNearPath,
} from '@/services/geoportail';
import { createSearchZoneLayer, removeSearchZoneLayer } from '@/services/searchZone';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const mapContainer = inject('mapContainer') as any;
const scrollContainer = ref<HTMLElement | null>(null);
const searchDistance = ref(5); // Initial value, will be set based on element type
const displayDistance = ref(1); // Committed value used for filtering
const liveDisplayDistance = ref(1); // Live value shown while dragging slider
const previousDisplayDistance = ref(1); // Track previous distance to detect increase vs decrease
const results = ref<AddressSearchResult[]>([]);
const filterText = ref('');
const includedTypes = ref<string[]>([]); // Types to include (show only these)
const excludedTypes = ref<string[]>([]); // Types to exclude (hide these)
const isSearching = ref(false);
const isFiltering = ref(false); // Track if filtering is in progress
const sortBy = ref<'name' | 'type' | 'elevation' | 'distance'>('name');
const sortAsc = ref(true);
const altitudeRange = ref<[number, number]>([0, 0]); // Committed value used for filtering
const liveAltitudeRange = ref<[number, number]>([0, 0]); // Live value shown while dragging slider
const cachedFilteredResults = ref<AddressSearchResult[]>([]);
const cachedUnfilteredResults = ref<AddressSearchResult[]>([]); // Results before sorting

let searchZoneLayer: L.FeatureGroup | null = null;
let filterTimeoutId: number | null = null;
let sortTimeoutId: number | null = null;

// Get the maximum search distance based on element type
const maxSearchDistance = computed(() => {
  const { elementType } = uiStore.searchAlongPanel;
  return elementType === 'point' ? 20 : 5;
});

// Calculate min/max altitude from results
const altitudeMinMax = computed(() => {
  if (results.value.length === 0) {
    return { min: 0, max: 0 };
  }

  const elevations = results.value
    .map((r) => r.elevation ?? 0)
    .filter((e) => e !== null && e !== undefined);

  if (elevations.length === 0) {
    return { min: 0, max: 0 };
  }

  // Use reduce to avoid stack overflow with large arrays
  let min = elevations[0]!;
  let max = elevations[0]!;
  for (const elev of elevations) {
    if (elev < min) min = elev;
    if (elev > max) max = elev;
  }

  return { min, max };
});

// Get available types from cached filtered results (simpler approach to avoid circular dependencies)
const availableTypes = computed(() => {
  // Use cachedUnfilteredResults which contains results after all filters except type filter
  const filtered = cachedUnfilteredResults.value;

  // Extract unique types
  const types = new Set<string>();
  for (const result of filtered) {
    const type = result.type || 'N/A';
    types.add(type);
  }

  return Array.from(types).toSorted();
});

// Available types for the include dropdown (exclude those already excluded)
const availableIncludeTypes = computed(() => {
  return availableTypes.value.filter((type) => !excludedTypes.value.includes(type));
});

// Available types for the exclude dropdown (exclude those already included)
const availableExcludeTypes = computed(() => {
  return availableTypes.value.filter((type) => !includedTypes.value.includes(type));
});

// Get the path points for the current element
const pathPoints = computed(() => {
  const { elementType, elementId } = uiStore.searchAlongPanel;
  if (!elementType || !elementId) return [];

  if (elementType === 'point') {
    const point = layersStore.points.find((p) => p.id === elementId);
    if (!point) return [];
    // For points, just return the center point
    return [point.coordinates];
  } else if (elementType === 'lineSegment') {
    const segment = layersStore.lineSegments.find((s) => s.id === elementId);
    if (!segment) return [];

    // Handle different segment modes
    if (segment.mode === 'parallel') {
      // For parallel lines, create a horizontal line from west to east
      const lat = segment.longitude === undefined ? 0 : segment.longitude;
      const westPoint = { lat, lon: -180 };
      const eastPoint = { lat, lon: 180 };
      return generateLinePointsLinear(
        westPoint.lat,
        westPoint.lon,
        eastPoint.lat,
        eastPoint.lon,
        120
      );
    } else if (segment.endpoint) {
      // Generate points along the line segment using linear interpolation
      // This ensures the buffer zone aligns with the displayed straight line in Leaflet
      // Works for coordinate, azimuth, and intersection modes
      return generateLinePointsLinear(
        segment.center.lat,
        segment.center.lon,
        segment.endpoint.lat,
        segment.endpoint.lon,
        120
      );
    } else {
      // For other modes without endpoint, cannot search
      return [];
    }
  }

  return [];
});

// Create the buffer polygon for the search zone
const bufferPolygon = computed(() => {
  if (pathPoints.value.length === 0) return null;

  try {
    const { elementType } = uiStore.searchAlongPanel;
    let geometry;

    if (elementType === 'point') {
      // For points, create a point geometry
      const point = pathPoints.value[0];
      if (!point) return null;
      geometry = turf.point([point.lon, point.lat]);
    } else {
      // For line segments, create a LineString geometry (GeoJSON uses [lon, lat])
      const coordinates = pathPoints.value.map((p) => [p.lon, p.lat]);
      geometry = turf.lineString(coordinates);
    }

    // Create buffer polygon at the search distance
    return turf.buffer(geometry, searchDistance.value, {
      units: 'kilometers',
    });
  } catch (error) {
    console.error('Error creating buffer polygon:', error);
    return null;
  }
});

// Expose filteredResults as a computed that returns cached results
const filteredResults = computed(() => cachedFilteredResults.value);

// Apply sorting to the unfiltered cached results
function applySorting() {
  isFiltering.value = true;

  const callback = () => {
    try {
      // Sort the cached unfiltered results
      cachedFilteredResults.value = [...cachedUnfilteredResults.value].toSorted((a, b) => {
        let compareValue = 0;

        switch (sortBy.value) {
          case 'name': {
            compareValue = a.main.localeCompare(b.main);

            break;
          }
          case 'type': {
            compareValue = (a.type || '').localeCompare(b.type || '');

            break;
          }
          case 'elevation': {
            const elevA = a.elevation ?? -1;
            const elevB = b.elevation ?? -1;
            compareValue = elevA - elevB;

            break;
          }
          case 'distance': {
            const distA = getResultDistance(a);
            const distB = getResultDistance(b);
            compareValue = distA - distB;

            break;
          }
          // No default
        }

        return sortAsc.value ? compareValue : -compareValue;
      });
    } finally {
      isFiltering.value = false;
    }
  };

  // Clear previous timeout if exists
  if (sortTimeoutId !== null) {
    clearTimeout(sortTimeoutId);
  }

  // Schedule sorting to run immediately for better responsiveness
  if (typeof requestIdleCallback === 'undefined') {
    sortTimeoutId = window.setTimeout(callback, 0);
  } else {
    requestIdleCallback(callback, { timeout: 16 });
  }
}

// Background filtering function
function performFiltering() {
  isFiltering.value = true;

  // Use requestIdleCallback if available, otherwise use setTimeout
  const callback = () => {
    try {
      // Cache values to avoid reactive lookups
      const allResults = results.value;
      const query = filterText.value.trim().toLowerCase();
      const paths = pathPoints.value;
      const maxDist = displayDistance.value;
      const [minAlt, maxAlt] = altitudeRange.value;
      const hasIncluded = includedTypes.value.length > 0;
      const hasExcluded = excludedTypes.value.length > 0;

      // Convert arrays to Sets for O(1) lookup instead of O(n)
      const includedSet = hasIncluded ? new Set(includedTypes.value) : null;
      const excludedSet = hasExcluded ? new Set(excludedTypes.value) : null;

      // Single-pass filtering
      const filtered = allResults.filter((result) => {
        // Text filter
        if (query) {
          const mainLower = result.main.toLowerCase();
          const typeLower = result.type?.toLowerCase() || '';
          if (!mainLower.includes(query) && !typeLower.includes(query)) {
            return false;
          }
        }

        // Distance filter
        if (paths.length > 0) {
          let minDist = Infinity;
          if (paths.length === 1) {
            minDist = haversineDistance(result.coordinates, paths[0]!);
          } else {
            for (let i = 0; i < paths.length - 1; i++) {
              const dist = distancePointToSegment(result.coordinates, paths[i]!, paths[i + 1]!);
              if (dist < minDist) minDist = dist;
              if (minDist <= maxDist) break; // Early exit if within range
            }
          }
          if (minDist > maxDist) return false;
        }

        // Altitude filter
        const elevation = result.elevation ?? 0;
        if (elevation < minAlt || elevation > maxAlt) {
          return false;
        }

        // Type filters
        if (hasIncluded || hasExcluded) {
          const type = result.type || 'N/A';
          if (hasIncluded && !includedSet!.has(type)) {
            return false;
          }
          if (hasExcluded && excludedSet!.has(type)) {
            return false;
          }
        }

        return true;
      });

      // Store the filtered results before sorting
      cachedUnfilteredResults.value = filtered;

      // Apply sorting to the filtered results
      const currentSort = sortBy.value;
      const ascending = sortAsc.value;

      // Cache distance calculations for distance sorting
      const distanceCache =
        currentSort === 'distance' ? new Map<AddressSearchResult, number>() : null;

      cachedFilteredResults.value = filtered.toSorted((a, b) => {
        let compareValue = 0;

        switch (currentSort) {
          case 'name': {
            compareValue = a.main.localeCompare(b.main);
            break;
          }
          case 'type': {
            compareValue = (a.type || '').localeCompare(b.type || '');
            break;
          }
          case 'elevation': {
            compareValue = (a.elevation ?? -1) - (b.elevation ?? -1);
            break;
          }
          case 'distance': {
            let distA = distanceCache!.get(a);
            if (distA === undefined) {
              distA = getResultDistance(a);
              distanceCache!.set(a, distA);
            }
            let distB = distanceCache!.get(b);
            if (distB === undefined) {
              distB = getResultDistance(b);
              distanceCache!.set(b, distB);
            }
            compareValue = distA - distB;
            break;
          }
        }

        return ascending ? compareValue : -compareValue;
      });
    } finally {
      isFiltering.value = false;
    }
  };

  // Clear previous timeout if exists
  if (filterTimeoutId !== null) {
    clearTimeout(filterTimeoutId);
  }

  // Schedule filtering to run immediately for better responsiveness
  if (typeof requestIdleCallback === 'undefined') {
    filterTimeoutId = window.setTimeout(callback, 0);
  } else {
    requestIdleCallback(callback, { timeout: 16 });
  }
}

// Auto-search when component mounts
onMounted(async () => {
  // Initialize searchDistance based on element type
  const { elementType } = uiStore.searchAlongPanel;
  searchDistance.value = elementType === 'point' ? 20 : 5;

  // Auto-launch search with appropriate default
  if (pathPoints.value.length > 0) {
    await handleSearch();
    // Create search zone layer showing the display distance
    if (mapContainer && displayDistance.value > 0) {
      searchZoneLayer = createSearchZoneLayer(
        mapContainer,
        pathPoints.value,
        displayDistance.value
      );
    }
  }
});

// Synchronize live values with committed values when search results are loaded
watch(results, () => {
  liveDisplayDistance.value = displayDistance.value;
  liveAltitudeRange.value = altitudeRange.value;
});

// Handle closing the search panel
watch(
  () => uiStore.searchAlongPanel.isOpen,
  (isOpen) => {
    if (
      !isOpen && // Remove search zone when panel closes
      searchZoneLayer &&
      mapContainer
    ) {
      removeSearchZoneLayer(mapContainer, searchZoneLayer);
      searchZoneLayer = null;
    }
  }
);

// Helper function to scroll results to top
function scrollToTop() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
}

// Update search zone and trigger filtering when display distance changes
watch(displayDistance, (newDistance) => {
  if (searchZoneLayer && mapContainer && pathPoints.value.length > 0) {
    removeSearchZoneLayer(mapContainer, searchZoneLayer);
    searchZoneLayer = createSearchZoneLayer(mapContainer, pathPoints.value, newDistance);
  }
  // Trigger background filtering
  performFiltering();
  scrollToTop();
});

// Trigger background filtering when altitude range changes
watch(altitudeRange, () => {
  performFiltering();
  scrollToTop();
});

// Trigger background filtering when filter text changes
watch(filterText, () => {
  performFiltering();
  scrollToTop();
});

// Trigger sorting (only re-sort, don't re-filter) when sort changes
watch([sortBy, sortAsc], () => {
  applySorting();
  scrollToTop();
});

// Trigger background filtering when included types change
watch(
  includedTypes,
  () => {
    performFiltering();
    scrollToTop();
  },
  { deep: true }
);

// Trigger background filtering when excluded types change
watch(
  excludedTypes,
  () => {
    performFiltering();
    scrollToTop();
  },
  { deep: true }
);

// Watch for changes in filters that affect availableTypes and clean up type filters
watch([displayDistance, altitudeRange, filterText], ([newDistance]) => {
  // Only reset types when distance decreases or other filters change
  const isDistanceDecrease = newDistance < previousDisplayDistance.value;

  // Clean up type filters after a delay to avoid circular dependency
  nextTick(() => {
    const currentAvailable = availableTypes.value;

    // Clean up included types
    const oldIncludedLength = includedTypes.value.length;
    const newIncluded = includedTypes.value.filter((type) => currentAvailable.includes(type));
    if (isDistanceDecrease && newIncluded.length !== oldIncludedLength) {
      includedTypes.value = newIncluded;
    }

    // Clean up excluded types
    const oldExcludedLength = excludedTypes.value.length;
    const newExcluded = excludedTypes.value.filter((type) => currentAvailable.includes(type));
    if (isDistanceDecrease && newExcluded.length !== oldExcludedLength) {
      excludedTypes.value = newExcluded;
    }
  });

  // Update previous distance
  previousDisplayDistance.value = newDistance;
});

// Handler for distance slider release
function handleDisplayDistanceRelease() {
  displayDistance.value = liveDisplayDistance.value;
}

// Handler for altitude range slider release
function handleAltitudeRangeRelease() {
  altitudeRange.value = liveAltitudeRange.value;
}

// Handler for adding a type to the include filter
function addIncludedType(type: string) {
  if (!includedTypes.value.includes(type)) {
    includedTypes.value.push(type);
  }
  // Remove from excluded if present
  excludedTypes.value = excludedTypes.value.filter((t) => t !== type);
}

// Handler for adding a type to the exclude filter
function addExcludedType(type: string) {
  if (!excludedTypes.value.includes(type)) {
    excludedTypes.value.push(type);
  }
  // Remove from included if present
  includedTypes.value = includedTypes.value.filter((t) => t !== type);
}

// Handler for removing a type from the include filter
function removeIncludedType(type: string) {
  includedTypes.value = includedTypes.value.filter((t) => t !== type);
}

// Handler for removing a type from the exclude filter
function removeExcludedType(type: string) {
  excludedTypes.value = excludedTypes.value.filter((t) => t !== type);
}

function handleClose() {
  uiStore.closeSearchAlong();
  results.value = [];
  // Reset to element-specific defaults
  searchDistance.value = uiStore.searchAlongPanel.elementType === 'point' ? 20 : 5;
  displayDistance.value = 1; // Reset to 1km default
  liveDisplayDistance.value = 1; // Reset live value
  previousDisplayDistance.value = 1; // Reset previous distance
  filterText.value = ''; // Reset filter
  includedTypes.value = []; // Reset include filter
  excludedTypes.value = []; // Reset exclude filter
  altitudeRange.value = [0, 0]; // Reset altitude range
  liveAltitudeRange.value = [0, 0]; // Reset live value
  if (searchZoneLayer && mapContainer) {
    removeSearchZoneLayer(mapContainer, searchZoneLayer);
    searchZoneLayer = null;
  }
}

async function handleSearch() {
  if (isSearching.value || pathPoints.value.length === 0) {
    return;
  }

  isSearching.value = true;
  results.value = [];
  filterText.value = ''; // Reset filter when searching
  altitudeRange.value = [0, 0]; // Reset altitude range when searching
  liveAltitudeRange.value = [0, 0]; // Reset live altitude range

  try {
    const locations = await searchLocationsNearPath(
      pathPoints.value,
      searchDistance.value,
      bufferPolygon.value // Use buffer polygon for precise spatial filtering
    );

    results.value = locations;

    // Adjust display distance to 1km after getting results
    if (locations.length > 0) {
      displayDistance.value = 1;
      previousDisplayDistance.value = 1;
    }

    // Update altitude range to match results
    if (locations.length > 0) {
      const elevations = locations
        .map((l) => l.elevation ?? 0)
        .filter((e) => e !== null && e !== undefined);

      if (elevations.length > 0) {
        // Use loop to avoid stack overflow with large arrays
        let minElev = elevations[0]!;
        let maxElev = elevations[0]!;
        for (const elev of elevations) {
          if (elev < minElev) minElev = elev;
          if (elev > maxElev) maxElev = elev;
        }
        altitudeRange.value = [minElev, maxElev];
      }
    }

    // Trigger filtering after results are loaded
    performFiltering();

    if (locations.length === 0) {
      uiStore.addToast('No locations found', 'info');
    } else {
      uiStore.addToast(`Found ${locations.length} location(s)`, 'success');
    }
  } catch (error) {
    console.error('Error searching locations:', error);
    uiStore.addToast('Error searching locations', 'error');
  } finally {
    isSearching.value = false;
  }
}

function handleResultClick(result: AddressSearchResult) {
  const mapInstance = mapContainer?.map?.value || mapContainer?.map;
  if (!mapInstance) {
    uiStore.addToast('Map not available', 'error');
    return;
  }

  // Fly to the result location
  mapInstance.flyTo(
    [result.coordinates.lat, result.coordinates.lon],
    16, // zoom level
    {
      duration: 1, // animation duration in seconds
    }
  );

  uiStore.addToast(`Navigating to ${result.main}`, 'success');
}

function getResultDistance(result: AddressSearchResult): number {
  if (pathPoints.value.length === 0) return 0;

  // Always use the first point (center of circle or start of segment)
  return haversineDistance(result.coordinates, pathPoints.value[0]!);
}

function toggleSort(column: 'name' | 'type' | 'elevation' | 'distance') {
  if (sortBy.value === column) {
    // Toggle ascending/descending if clicking the same column
    sortAsc.value = !sortAsc.value;
  } else {
    // Switch to new column, default to ascending
    sortBy.value = column;
    sortAsc.value = true;
  }
}
</script>
