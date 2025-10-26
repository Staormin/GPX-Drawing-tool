<template>
  <!-- Match the sidebar-inner structure from index.vue -->
  <div style="display: flex; flex-direction: column; gap: 16px; padding: 16px; height: 100%; overflow-y: auto; padding-bottom: 96px;">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
      <v-btn
        icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="handleClose"
      />
      <span class="text-subtitle-2">Search Results</span>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isSearching" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
        width="4"
      />
      <div class="text-caption text-disabled mt-4">Searching...</div>
    </div>

    <!-- Main Content Area -->
    <template v-else>
      <!-- Filter Section - Show for both line segments and points -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <v-text-field
          v-model="filterText"
          placeholder="Filter results by name..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          variant="outlined"
          :disabled="isSearching"
        />

        <!-- Distance Slider -->
        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Search Distance</label>
            <span class="text-subtitle-2 font-weight-bold text-primary">{{ liveDisplayDistance.toFixed(1) }} km</span>
          </div>
          <v-slider
            v-model="liveDisplayDistance"
            :min="0.5"
            :max="maxSearchDistance"
            :step="0.1"
            :disabled="isSearching"
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
            :min="altitudeMinMax.min"
            :max="altitudeMinMax.max"
            :step="10"
            color="primary"
            track-size="4"
            thumb-size="20"
            :disabled="isSearching"
            @mouseup="handleAltitudeRangeRelease"
            @touchend="handleAltitudeRangeRelease"
          />
          <div class="text-caption text-disabled mt-2">
            Min: {{ altitudeMinMax.min.toFixed(0) }} m | Max: {{ altitudeMinMax.max.toFixed(0) }} m
          </div>
        </div>

        <div class="text-caption text-disabled mt-2">
          Showing {{ filteredResults.length }} of {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="filteredResults.length > 0 || isFiltering" style="display: flex; flex-direction: column; gap: 8px;">
        <div class="text-subtitle-2">Results</div>
        <div style="position: relative; min-height: 100px; overflow-x: auto;">
          <!-- Loading overlay -->
          <div v-if="isFiltering" style="position: absolute; inset: 0; background: rgba(255, 255, 255, 0.7); display: flex; align-items: center; justify-content: center; border-radius: 4px; z-index: 10;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <v-progress-circular
                indeterminate
                color="primary"
                size="32"
                width="3"
              />
              <div class="text-caption text-disabled">Filtering...</div>
            </div>
          </div>

          <!-- Results table -->
          <table style="min-width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(148, 163, 184, 0.3); background-color: rgba(148, 163, 184, 0.05);">
                <th style="padding: 8px; text-align: left; cursor: pointer; width: 45%; min-width: 120px;" @click="toggleSort('name')">
                  <div class="text-xs font-medium text-slate-700 d-flex align-center gap-1">
                    Name
                    <v-icon
                      v-if="sortBy === 'name'"
                      :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                      size="16"
                    />
                  </div>
                </th>
                <th style="padding: 8px; text-align: right; cursor: pointer; width: 27%; min-width: 70px;" @click="toggleSort('distance')">
                  <div class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1">
                    Distance
                    <v-icon
                      v-if="sortBy === 'distance'"
                      :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                      size="16"
                    />
                  </div>
                </th>
                <th style="padding: 8px; text-align: right; cursor: pointer; width: 28%; min-width: 70px;" @click="toggleSort('elevation')">
                  <div class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1">
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
                style="border-bottom: 1px solid rgba(148, 163, 184, 0.15); transition: background-color 0.2s;"
                @click="handleResultClick(result)"
                @mouseenter="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)'"
                @mouseleave="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
              >
                <td style="padding: 8px; width: 45%; min-width: 120px;">
                  <div class="font-medium text-sm" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;" :title="result.main.length > 35 ? result.main : ''">
                    {{ result.main.length > 35 ? result.main.substring(0, 35) + '...' : result.main }}
                  </div>
                  <div class="text-xs text-slate-600 text-truncate" :title="result.type || 'N/A'">{{ result.type || 'N/A' }}</div>
                </td>
                <td style="padding: 8px; text-align: right; width: 27%; min-width: 70px; white-space: nowrap;">
                  <div class="text-sm font-medium">{{ getResultDistance(result).toFixed(1) }} km</div>
                </td>
                <td style="padding: 8px; text-align: right; width: 28%; min-width: 70px; white-space: nowrap;">
                  <div class="text-sm font-medium">{{ result.elevation ? `${result.elevation} m` : 'N/A' }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-caption text-disabled text-center" style="padding: 32px 16px;">
        <v-icon icon="mdi-magnify" size="24" class="mb-2" />
        <div>No results match your filter.</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { computed, inject, onMounted, ref, watch } from 'vue'
  import * as turf from '@turf/turf'
  import { useUIStore } from '@/stores/ui'
  import { useLayersStore } from '@/stores/layers'
  import { searchLocationsNearPath, haversineDistance, distancePointToSegment } from '@/services/geoportail'
  import { generateCircle, generateLinePointsLinear } from '@/services/geometry'
  import type { AddressSearchResult } from '@/services/geoportail'
  import { createSearchZoneLayer, removeSearchZoneLayer } from '@/services/searchZone'
  import type L from 'leaflet'

  const uiStore = useUIStore()
  const layersStore = useLayersStore()
  const mapContainer = inject('mapContainer') as any
  const searchDistance = ref(5) // Initial value, will be set based on element type
  const displayDistance = ref(1) // Committed value used for filtering
  const liveDisplayDistance = ref(1) // Live value shown while dragging slider
  const results = ref<AddressSearchResult[]>([])
  const filterText = ref('')
  const isSearching = ref(false)
  const isFiltering = ref(false) // Track if filtering is in progress
  const sortBy = ref<'name' | 'type' | 'elevation' | 'distance'>('name')
  const sortAsc = ref(true)
  const altitudeRange = ref<[number, number]>([0, 0]) // Committed value used for filtering
  const liveAltitudeRange = ref<[number, number]>([0, 0]) // Live value shown while dragging slider
  const cachedFilteredResults = ref<AddressSearchResult[]>([])
  const cachedUnfilteredResults = ref<AddressSearchResult[]>([]) // Results before sorting

  let searchZoneLayer: L.FeatureGroup | null = null
  let filterTimeoutId: number | null = null
  let sortTimeoutId: number | null = null

  // Get the maximum search distance based on element type
  const maxSearchDistance = computed(() => {
    const { elementType } = uiStore.searchAlongPanel
    return elementType === 'point' ? 20 : 5
  })

  // Get the element name
  const elementName = computed(() => {
    const { elementType, elementId } = uiStore.searchAlongPanel
    if (!elementType || !elementId) return null

    if (elementType === 'lineSegment') {
      return layersStore.lineSegments.find(s => s.id === elementId)?.name || null
    } else if (elementType === 'point') {
      return layersStore.points.find(p => p.id === elementId)?.name || null
    }

    return null
  })

  // Get unique types from results for the filter dropdown
  const availableTypes = computed(() => {
    const types = new Set<string>()
    results.value.forEach((result) => {
      if (result.type) {
        types.add(result.type)
      }
    })
    return Array.from(types).sort()
  })

  // Calculate min/max altitude from results
  const altitudeMinMax = computed(() => {
    if (results.value.length === 0) {
      return { min: 0, max: 0 }
    }

    const elevations = results.value
      .map(r => r.elevation ?? 0)
      .filter(e => e !== null && e !== undefined)

    if (elevations.length === 0) {
      return { min: 0, max: 0 }
    }

    const min = Math.min(...elevations)
    const max = Math.max(...elevations)

    return { min, max }
  })

  // Get the path points for the current element
  const pathPoints = computed(() => {
    const { elementType, elementId } = uiStore.searchAlongPanel
    if (!elementType || !elementId) return []

    if (elementType === 'point') {
      const point = layersStore.points.find(p => p.id === elementId)
      if (!point) return []
      // For points, just return the center point
      return [point.coordinates]
    } else if (elementType === 'lineSegment') {
      const segment = layersStore.lineSegments.find(s => s.id === elementId)
      if (!segment) return []

      // Handle different segment modes
      if (segment.mode === 'parallel') {
        // For parallel lines, create a horizontal line from west to east
        const lat = segment.longitude !== undefined ? segment.longitude : 0
        const westPoint = { lat, lon: -180 }
        const eastPoint = { lat, lon: 180 }
        return generateLinePointsLinear(
          westPoint.lat,
          westPoint.lon,
          eastPoint.lat,
          eastPoint.lon,
          120,
        )
      } else if (!segment.endpoint) {
        // For other modes without endpoint, cannot search
        return []
      } else {
        // Generate points along the line segment using linear interpolation
        // This ensures the buffer zone aligns with the displayed straight line in Leaflet
        // Works for coordinate, azimuth, and intersection modes
        return generateLinePointsLinear(
          segment.center.lat,
          segment.center.lon,
          segment.endpoint.lat,
          segment.endpoint.lon,
          120,
        )
      }
    }

    return []
  })

  // Create the buffer polygon for the search zone
  const bufferPolygon = computed(() => {
    if (pathPoints.value.length === 0) return null

    try {
      const { elementType } = uiStore.searchAlongPanel
      let geometry

      if (elementType === 'point') {
        // For points, create a point geometry
        const point = pathPoints.value[0]
        if (!point) return null
        geometry = turf.point([point.lon, point.lat])
      } else {
        // For line segments, create a LineString geometry (GeoJSON uses [lon, lat])
        const coordinates = pathPoints.value.map(p => [p.lon, p.lat])
        geometry = turf.lineString(coordinates)
      }

      // Create buffer polygon at the search distance
      const buffered = turf.buffer(geometry, searchDistance.value, {
        units: 'kilometers',
      })

      return buffered
    } catch (error) {
      console.error('Error creating buffer polygon:', error)
      return null
    }
  })

  // Expose filteredResults as a computed that returns cached results
  const filteredResults = computed(() => cachedFilteredResults.value)

  // Apply sorting to the unfiltered cached results
  function applySorting () {
    isFiltering.value = true

    const callback = () => {
      try {
        // Sort the cached unfiltered results
        const sorted = [...cachedUnfilteredResults.value].sort((a, b) => {
          let compareValue = 0

          if (sortBy.value === 'name') {
            compareValue = a.main.localeCompare(b.main)
          } else if (sortBy.value === 'type') {
            compareValue = (a.secondary || '').localeCompare(b.secondary || '')
          } else if (sortBy.value === 'elevation') {
            const elevA = a.elevation ?? -1
            const elevB = b.elevation ?? -1
            compareValue = elevA - elevB
          } else if (sortBy.value === 'distance') {
            const distA = getResultDistance(a)
            const distB = getResultDistance(b)
            compareValue = distA - distB
          }

          return sortAsc.value ? compareValue : -compareValue
        })

        cachedFilteredResults.value = sorted
      } finally {
        isFiltering.value = false
      }
    }

    // Clear previous timeout if exists
    if (sortTimeoutId !== null) {
      clearTimeout(sortTimeoutId)
    }

    // Schedule sorting to run on next idle time
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(callback, { timeout: 100 })
    } else {
      sortTimeoutId = window.setTimeout(callback, 50)
    }
  }

  // Background filtering function
  function performFiltering () {
    isFiltering.value = true

    // Use requestIdleCallback if available, otherwise use setTimeout
    const callback = () => {
      try {
        let filtered = results.value

        // Apply text filter
        if (filterText.value.trim()) {
          const query = filterText.value.toLowerCase()
          filtered = filtered.filter(
            result =>
              result.main.toLowerCase().includes(query) ||
              (result.secondary && result.secondary.toLowerCase().includes(query)),
          )
        }

        // Apply distance filter - only show results within displayDistance from the path
        if (results.value.length > 0 && pathPoints.value.length > 0) {
          filtered = filtered.filter((result) => {
            let minDist = Infinity
            if (pathPoints.value.length === 1) {
              // For single point, calculate distance to that point
              minDist = haversineDistance(result.coordinates, pathPoints.value[0]!)
            } else {
              // For multiple points, use segment-based distance
              for (let i = 0; i < pathPoints.value.length - 1; i++) {
                const dist = distancePointToSegment(
                  result.coordinates,
                  pathPoints.value[i]!,
                  pathPoints.value[i + 1]!,
                )
                minDist = Math.min(minDist, dist)
              }
            }
            return minDist <= displayDistance.value
          })
        }

        // No type filter - show all results

        // Apply altitude filter (only if we have search results and altitude range is set)
        if (results.value.length > 0) {
          const [minAlt, maxAlt] = altitudeRange.value
          filtered = filtered.filter((result) => {
            const elevation = result.elevation ?? 0
            return elevation >= minAlt && elevation <= maxAlt
          })
        }

        // Store the filtered results before sorting
        cachedUnfilteredResults.value = filtered

        // Apply sorting to the filtered results
        const sorted = [...filtered].sort((a, b) => {
          let compareValue = 0

          if (sortBy.value === 'name') {
            compareValue = a.main.localeCompare(b.main)
          } else if (sortBy.value === 'type') {
            compareValue = (a.secondary || '').localeCompare(b.secondary || '')
          } else if (sortBy.value === 'elevation') {
            const elevA = a.elevation ?? -1
            const elevB = b.elevation ?? -1
            compareValue = elevA - elevB
          } else if (sortBy.value === 'distance') {
            const distA = getResultDistance(a)
            const distB = getResultDistance(b)
            compareValue = distA - distB
          }

          return sortAsc.value ? compareValue : -compareValue
        })

        cachedFilteredResults.value = sorted
      } finally {
        isFiltering.value = false
      }
    }

    // Clear previous timeout if exists
    if (filterTimeoutId !== null) {
      clearTimeout(filterTimeoutId)
    }

    // Schedule filtering to run on next idle time
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(callback, { timeout: 100 })
    } else {
      filterTimeoutId = window.setTimeout(callback, 50)
    }
  }

  // Auto-search when component mounts
  onMounted(async () => {
    // Initialize searchDistance based on element type
    const { elementType } = uiStore.searchAlongPanel
    searchDistance.value = elementType === 'point' ? 20 : 5

    // Auto-launch search with appropriate default
    if (pathPoints.value.length > 0) {
      await handleSearch()
      // Create search zone layer showing the display distance
      if (mapContainer && displayDistance.value > 0) {
        searchZoneLayer = createSearchZoneLayer(
          mapContainer,
          pathPoints.value,
          displayDistance.value,
        )
      }
    }
  })

  // Synchronize live values with committed values when search results are loaded
  watch(results, () => {
    liveDisplayDistance.value = displayDistance.value
    liveAltitudeRange.value = altitudeRange.value
  })

  // Handle closing the search panel
  watch(() => uiStore.searchAlongPanel.isOpen, (isOpen) => {
    if (!isOpen) {
      // Remove search zone when panel closes
      if (searchZoneLayer && mapContainer) {
        removeSearchZoneLayer(mapContainer, searchZoneLayer)
        searchZoneLayer = null
      }
    }
  })

  // Update search zone and trigger filtering when display distance changes
  watch(displayDistance, (newDistance) => {
    if (searchZoneLayer && mapContainer && pathPoints.value.length > 0) {
      removeSearchZoneLayer(mapContainer, searchZoneLayer)
      searchZoneLayer = createSearchZoneLayer(
        mapContainer,
        pathPoints.value,
        newDistance,
      )
    }
    // Trigger background filtering
    performFiltering()
  })

  // Trigger background filtering when altitude range changes
  watch(altitudeRange, () => {
    performFiltering()
  })

  // Trigger background filtering when filter text changes
  watch(filterText, () => {
    performFiltering()
  })

  // Trigger sorting (only re-sort, don't re-filter) when sort changes
  watch([sortBy, sortAsc], () => {
    applySorting()
  })

  // Handler for distance slider release
  function handleDisplayDistanceRelease () {
    displayDistance.value = liveDisplayDistance.value
  }

  // Handler for altitude range slider release
  function handleAltitudeRangeRelease () {
    altitudeRange.value = liveAltitudeRange.value
  }

  function handleClose () {
    uiStore.closeSearchAlong()
    results.value = []
    // Reset to element-specific defaults
    searchDistance.value = uiStore.searchAlongPanel.elementType === 'point' ? 20 : 5
    displayDistance.value = 1 // Reset to 1km default
    liveDisplayDistance.value = 1 // Reset live value
    filterText.value = '' // Reset filter
    altitudeRange.value = [0, 0] // Reset altitude range
    liveAltitudeRange.value = [0, 0] // Reset live value
    if (searchZoneLayer && mapContainer) {
      removeSearchZoneLayer(mapContainer, searchZoneLayer)
      searchZoneLayer = null
    }
  }

  async function handleSearch () {
    if (isSearching.value || pathPoints.value.length === 0) {
      return
    }

    isSearching.value = true
    results.value = []
    filterText.value = '' // Reset filter when searching
    altitudeRange.value = [0, 0] // Reset altitude range when searching
    liveAltitudeRange.value = [0, 0] // Reset live altitude range

    try {
      const locations = await searchLocationsNearPath(
        pathPoints.value,
        searchDistance.value,
        [], // Search all named elements with place tag
        bufferPolygon.value, // Use buffer polygon for precise spatial filtering
      )

      results.value = locations

      // Adjust display distance to 1km after getting results
      if (locations.length > 0) {
        displayDistance.value = 1
      }

      // Update altitude range to match results
      if (locations.length > 0) {
        const elevations = locations
          .map(l => l.elevation ?? 0)
          .filter(e => e !== null && e !== undefined)

        if (elevations.length > 0) {
          const minElev = Math.min(...elevations)
          const maxElev = Math.max(...elevations)
          altitudeRange.value = [minElev, maxElev]
        }
      }

      // Trigger filtering after results are loaded
      performFiltering()

      if (locations.length === 0) {
        uiStore.addToast('No locations found', 'info')
      } else {
        uiStore.addToast(`Found ${locations.length} location(s)`, 'success')
      }
    } catch (error) {
      console.error('Error searching locations:', error)
      uiStore.addToast('Error searching locations', 'error')
    } finally {
      isSearching.value = false
    }
  }

  function handleResultClick (result: AddressSearchResult) {
    const mapInstance = mapContainer?.map?.value || mapContainer?.map
    if (!mapInstance) {
      uiStore.addToast('Map not available', 'error')
      return
    }

    // Fly to the result location
    mapInstance.flyTo(
      [result.coordinates.lat, result.coordinates.lon],
      16, // zoom level
      {
        duration: 1, // animation duration in seconds
      },
    )

    uiStore.addToast(`Navigating to ${result.main}`, 'success')
  }

  function getResultDistance (result: AddressSearchResult): number {
    if (pathPoints.value.length === 0) return 0

    // Always use the first point (center of circle or start of segment)
    return haversineDistance(result.coordinates, pathPoints.value[0]!)
  }

  function toggleSort (column: 'name' | 'type' | 'elevation' | 'distance') {
    if (sortBy.value === column) {
      // Toggle ascending/descending if clicking the same column
      sortAsc.value = !sortAsc.value
    } else {
      // Switch to new column, default to ascending
      sortBy.value = column
      sortAsc.value = true
    }
  }
</script>
