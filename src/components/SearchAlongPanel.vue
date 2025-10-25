<template>
  <div v-if="uiStore.searchAlongPanel.isOpen" :style="{ position: 'fixed', top: '1rem', right: '1rem', width: '40vw', height: '85vh', maxWidth: '800px', maxHeight: '900px', minWidth: '400px', zIndex: 1001, display: 'flex', flexDirection: 'column' }">
    <v-card elevation="4" class="d-flex flex-column overflow-hidden" style="flex: 1 1 auto; min-height: 0;">
      <!-- Header -->
      <v-card-title class="flex-shrink-0 pb-2">
        <div class="d-flex align-center justify-space-between w-full">
          <h2 class="text-h6 font-weight-bold">Location Near</h2>
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="handleClose"
          />
        </div>
      </v-card-title>

      <div v-if="elementName" class="px-6 pb-3 text-caption text-disabled flex-shrink-0">
        Searching near <strong>{{ elementName }}</strong>
      </div>

      <v-divider />

      <!-- Inputs Section -->
      <div class="pa-6 flex-shrink-0">
        <!-- Distance slider -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-subtitle-2">Search Distance</label>
            <span class="text-subtitle-2 font-weight-bold text-primary">{{ searchDistance.toFixed(1) }} km</span>
          </div>
          <v-slider
            v-model="searchDistance"
            :min="0.5"
            :max="5"
            :step="0.1"
          />
        </div>

        <!-- Search button -->
        <v-btn
          color="primary"
          block
          size="large"
          :loading="isSearching"
          :disabled="isSearching"
          @click="handleSearch"
        >
          <v-icon icon="mdi-magnify" start />
          Search
        </v-btn>
      </div>

      <v-divider />

      <!-- Filter Section -->
      <div v-if="results.length > 0" class="pa-4 flex-shrink-0">
        <v-text-field
          v-model="filterText"
          placeholder="Filter results by name..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
          variant="outlined"
        />
        <div class="text-caption text-disabled mt-2">
          Showing {{ filteredResults.length }} of {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <v-divider v-if="results.length > 0" />

      <!-- Results Section -->
      <div v-if="filteredResults.length > 0" class="pa-4 overflow-y-auto" style="flex: 1 1 auto; min-height: 0;">
        <div
          v-for="(result, index) in filteredResults"
          :key="`${result.main}-${index}`"
          class="mb-3 pb-3 border-bottom cursor-pointer hover:bg-grey-100 pa-2 rounded transition-colors"
          @click="handleResultClick(result)"
        >
          <div class="d-flex align-start">
            <v-icon icon="mdi-map-marker" size="small" class="mt-1 mr-2 flex-shrink-0 text-primary" />
            <div class="flex-grow-1">
              <div class="font-weight-500 text-subtitle-2">{{ result.main }}</div>
              <div v-if="result.secondary" class="text-caption text-disabled mt-1">
                {{ result.secondary }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="d-flex flex-column align-center justify-center text-disabled text-center pa-8" style="flex: 1 1 auto; min-height: 0;">
        <v-icon icon="mdi-magnify" size="32" class="mb-2" />
        <div class="text-caption">{{ results.length === 0 ? 'No results yet. Click "Search" to get started.' : 'No results match your filter.' }}</div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, inject, ref, watch } from 'vue'
  import * as turf from '@turf/turf'
  import { useUIStore } from '@/stores/ui'
  import { useLayersStore } from '@/stores/layers'
  import { searchLocationsNearPath, haversineDistance } from '@/services/geoportail'
  import { generateCircle, generateLinePointsLinear } from '@/services/geometry'
  import type { AddressSearchResult } from '@/services/geoportail'
  import { createSearchZoneLayer, removeSearchZoneLayer } from '@/services/searchZone'
  import type L from 'leaflet'

  const uiStore = useUIStore()
  const layersStore = useLayersStore()
  const mapContainer = inject('mapContainer') as any
  const searchDistance = ref(1)
  const results = ref<AddressSearchResult[]>([])
  const filterText = ref('')
  const isSearching = ref(false)
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

  // Get the path points for the current element
  const pathPoints = computed(() => {
    const { elementType, elementId } = uiStore.searchAlongPanel
    if (!elementType || !elementId) return []

    if (elementType === 'circle') {
      const circle = layersStore.circles.find(c => c.id === elementId)
      if (!circle) return []
      // Generate points along the circle perimeter
      return generateCircle(circle.center.lat, circle.center.lon, circle.radius, 60)
    } else if (elementType === 'lineSegment') {
      const segment = layersStore.lineSegments.find(s => s.id === elementId)
      if (!segment || !segment.endpoint) return []
      // Generate points along the line segment using linear interpolation
      // This ensures the buffer zone aligns with the displayed straight line in Leaflet
      return generateLinePointsLinear(
        segment.center.lat,
        segment.center.lon,
        segment.endpoint.lat,
        segment.endpoint.lon,
        60,
      )
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

  // Filter results based on search text and sort by distance from start point
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

    // Sort by distance from start point
    const startPoint = pathPoints.value[0]
    if (startPoint && filtered.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        const distA = haversineDistance(startPoint, a.coordinates)
        const distB = haversineDistance(startPoint, b.coordinates)
        return distA - distB
      })
    }

    return filtered
  })

  // Close sidebar when search along panel opens
  watch(() => uiStore.searchAlongPanel.isOpen, (isOpen) => {
    if (isOpen) {
      uiStore.setSidebarOpen(false)
      // Show search zone when panel opens
      if (mapContainer && pathPoints.value.length > 0) {
        searchZoneLayer = createSearchZoneLayer(
          mapContainer,
          pathPoints.value,
          searchDistance.value,
        )
      }
    } else {
      // Remove search zone when panel closes
      if (searchZoneLayer && mapContainer) {
        removeSearchZoneLayer(mapContainer, searchZoneLayer)
        searchZoneLayer = null
      }
    }
  })

  // Update search zone when distance changes
  watch(searchDistance, (newDistance) => {
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
    searchDistance.value = 1
    if (searchZoneLayer && mapContainer) {
      removeSearchZoneLayer(mapContainer, searchZoneLayer)
      searchZoneLayer = null
    }
  }

  async function handleSearch () {
    if (isSearching.value || pathPoints.value.length === 0) return

    isSearching.value = true
    results.value = []
    filterText.value = '' // Reset filter when searching

    try {
      const locations = await searchLocationsNearPath(
        pathPoints.value,
        searchDistance.value,
        ['LieuDit', 'Commune'],
        bufferPolygon.value, // Pass the buffer polygon for precise filtering
      )

      results.value = locations
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
</script>
