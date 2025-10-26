<template>
  <div class="search-along-panel-sidebar d-flex flex-column h-full">
    <!-- Scrollable sidebar content -->
    <div class="sidebar-inner flex-grow-1 overflow-y-auto">
      <!-- Results header with back arrow -->
      <div class="pa-4 flex-shrink-0 d-flex align-center">
        <v-btn
          icon="mdi-arrow-left"
          size="small"
          variant="text"
          @click="handleClose"
        />
        <span class="text-subtitle-2 ml-2">Search Results</span>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isSearching" class="pa-4 pt-0 d-flex flex-column align-center justify-center" style="min-height: 200px;">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
          width="4"
        />
        <div class="text-caption text-disabled mt-4">Searching...</div>
      </div>

      <!-- Filter Section -->
      <div v-else class="pa-4 pt-0">
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
        <div class="mt-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Search Distance</label>
            <span class="text-subtitle-2 font-weight-bold text-primary">{{ displayDistance.toFixed(1) }} km</span>
          </div>
          <v-slider
            v-model="displayDistance"
            :min="0.5"
            :max="5"
            :step="0.1"
            :disabled="isSearching"
          />
        </div>


        <!-- Altitude Range Slider -->
        <div class="mt-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Altitude Range</label>
            <span class="text-subtitle-2 font-weight-bold text-primary">
              {{ altitudeRange[0].toFixed(0) }} m - {{ altitudeRange[1].toFixed(0) }} m
            </span>
          </div>
          <v-range-slider
            v-model="altitudeRange"
            :min="altitudeMinMax.min"
            :max="altitudeMinMax.max"
            :step="10"
            color="primary"
            track-size="4"
            thumb-size="20"
            :disabled="isSearching"
          />
          <div class="text-caption text-disabled mt-2">
            Min: {{ altitudeMinMax.min.toFixed(0) }} m | Max: {{ altitudeMinMax.max.toFixed(0) }} m
          </div>
        </div>

        <div class="text-caption text-disabled mt-3">
          Showing {{ filteredResults.length }} of {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
        </div>

        <!-- Results Table -->
        <div v-if="filteredResults.length > 0" class="mt-3">
          <div class="text-subtitle-2 mb-2">Results</div>
          <div class="overflow-y-auto" style="max-height: 500px;">
            <table class="w-full">
              <tbody>
                <tr
                  v-for="(result, index) in filteredResults"
                  :key="`${result.main}-${index}`"
                  class="cursor-pointer hover:bg-opacity-50"
                  style="border-bottom: 1px solid rgba(148, 163, 184, 0.15); transition: background-color 0.2s;"
                  @click="handleResultClick(result)"
                  @mouseenter="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)'"
                  @mouseleave="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
                >
                  <td class="pa-3" style="width: 70%;">
                    <div class="font-medium text-sm text-truncate">{{ result.main }}</div>
                    <div class="text-xs text-slate-600 text-truncate">{{ result.type || 'N/A' }}</div>
                  </td>
                  <td class="pa-3 text-right" style="width: 30%;">
                    <div class="text-sm font-medium">{{ result.elevation ? `${result.elevation} m` : 'N/A' }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="text-caption text-disabled text-center pa-8">
          <v-icon icon="mdi-magnify" size="24" class="mb-2" />
          <div>No results match your filter.</div>
        </div>
      </div>
    </div>

    <!-- Action buttons footer -->
    <div class="sidebar-footer">
      <div class="pa-4">
        <!-- No additional actions needed for search panel -->
      </div>
    </div>
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
  const searchDistance = ref(5) // Search within 5km
  const displayDistance = ref(1) // Display results within 1km by default
  const results = ref<AddressSearchResult[]>([])
  const filterText = ref('')
  const isSearching = ref(false)
  const sortBy = ref<'name' | 'type' | 'elevation'>('name')
  const sortAsc = ref(true)
  const altitudeRange = ref<[number, number]>([0, 0])

  let searchZoneLayer: L.FeatureGroup | null = null

  // Get the element name
  const elementName = computed(() => {
    const { elementType, elementId } = uiStore.searchAlongPanel
    if (!elementType || !elementId) return null

    if (elementType === 'circle') {
      return layersStore.circles.find(c => c.id === elementId)?.name || null
    } else if (elementType === 'lineSegment') {
      return layersStore.lineSegments.find(s => s.id === elementId)?.name || null
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

    if (elementType === 'circle') {
      const circle = layersStore.circles.find(c => c.id === elementId)
      if (!circle) return []
      // Generate points along the circle perimeter
      return generateCircle(circle.center.lat, circle.center.lon, circle.radius, 120)
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
      // Convert path points to GeoJSON LineString (GeoJSON uses [lon, lat])
      const coordinates = pathPoints.value.map(p => [p.lon, p.lat])
      const lineString = turf.lineString(coordinates)

      // Create buffer polygon at the search distance
      const buffered = turf.buffer(lineString, searchDistance.value, {
        units: 'kilometers',
      })

      return buffered
    } catch (error) {
      console.error('Error creating buffer polygon:', error)
      return null
    }
  })

  // Filter results based on search text, type, altitude range, and apply sorting
  const filteredResults = computed(() => {
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
        for (let i = 0; i < pathPoints.value.length - 1; i++) {
          const dist = distancePointToSegment(
            result.coordinates,
            pathPoints.value[i]!,
            pathPoints.value[i + 1]!,
          )
          minDist = Math.min(minDist, dist)
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

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let compareValue = 0

      if (sortBy.value === 'name') {
        compareValue = a.main.localeCompare(b.main)
      } else if (sortBy.value === 'type') {
        compareValue = (a.secondary || '').localeCompare(b.secondary || '')
      } else if (sortBy.value === 'elevation') {
        const elevA = a.elevation ?? -1
        const elevB = b.elevation ?? -1
        compareValue = elevA - elevB
      }

      return sortAsc.value ? compareValue : -compareValue
    })

    return filtered
  })

  // Auto-search when component mounts
  onMounted(async () => {
    // Auto-launch search with 5km default
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

  // Update search zone when display distance changes
  watch(displayDistance, (newDistance) => {
    if (searchZoneLayer && mapContainer && pathPoints.value.length > 0) {
      removeSearchZoneLayer(mapContainer, searchZoneLayer)
      searchZoneLayer = createSearchZoneLayer(
        mapContainer,
        pathPoints.value,
        newDistance,
      )
    }
  })

  function handleClose () {
    uiStore.closeSearchAlong()
    results.value = []
    searchDistance.value = 5 // Reset to 5km default
    displayDistance.value = 1 // Reset to 1km default
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

  function toggleSort (column: 'name' | 'type' | 'elevation') {
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
