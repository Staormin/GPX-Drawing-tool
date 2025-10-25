<template>
  <v-dialog
    v-model="isOpen"
    max-width="400px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Line Segment' : 'Add Line Segment' }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Line Name"
            variant="outlined"
          />

          <v-select
            v-model="form.mode"
            class="mb-4"
            density="compact"
            :items="modes"
            label="Mode"
            variant="outlined"
          />

          <!-- Start Coordinates with picker -->
          <v-menu v-if="form.mode !== 'parallel'">
            <template #activator="{ props }">
              <v-text-field
                v-model="form.startCoord"
                append-inner-icon="mdi-map-marker"
                class="mb-4"
                density="compact"
                label="Start Coordinates"
                placeholder="48.8566, 2.3522"
                variant="outlined"
                v-bind="props"
                @click:append-inner="() => {}"
              />
            </template>
            <v-list>
              <v-list-item
                v-if="coordinatesStore.sortedCoordinates.length === 0"
                disabled
              >
                <v-list-item-title class="text-caption">
                  No saved coordinates
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-for="coord in coordinatesStore.sortedCoordinates"
                :key="coord.id"
                @click="selectCoordinate(coord, 'start')"
              >
                <v-list-item-title class="text-sm">
                  {{ coord.name }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-xs">
                  {{ coord.lat.toFixed(6) }}, {{ coord.lon.toFixed(6) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-text-field
            v-if="form.mode === 'parallel'"
            v-model="form.startCoord"
            class="mb-4"
            density="compact"
            label="Latitude"
            placeholder="0 (for Equator)"
            variant="outlined"
          />

          <template v-if="form.mode === 'coordinate'">
            <!-- End Coordinates with picker -->
            <v-menu>
              <template #activator="{ props }">
                <v-text-field
                  v-model="form.endCoord"
                  append-inner-icon="mdi-map-marker"
                  class="mb-4"
                  density="compact"
                  label="End Coordinates"
                  placeholder="48.8566, 2.3522"
                  variant="outlined"
                  v-bind="props"
                  @click:append-inner="() => {}"
                />
              </template>
              <v-list>
                <v-list-item
                  v-if="coordinatesStore.sortedCoordinates.length === 0"
                  disabled
                >
                  <v-list-item-title class="text-caption">
                    No saved coordinates
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-for="coord in coordinatesStore.sortedCoordinates"
                  :key="coord.id"
                  @click="selectCoordinate(coord, 'end')"
                >
                  <v-list-item-title class="text-sm">
                    {{ coord.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-xs">
                    {{ coord.lat.toFixed(6) }}, {{ coord.lon.toFixed(6) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template v-if="form.mode === 'azimuth'">
            <v-text-field
              v-model.number="form.azimuth"
              class="mb-4"
              density="compact"
              label="Azimuth (degrees)"
              max="360"
              min="0"
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
            <!-- Intersection Coordinates with picker -->
            <v-menu>
              <template #activator="{ props }">
                <v-text-field
                  v-model="form.intersectCoord"
                  append-inner-icon="mdi-map-marker"
                  class="mb-4"
                  density="compact"
                  label="Intersection Coordinates"
                  placeholder="48.8566, 2.3522"
                  variant="outlined"
                  v-bind="props"
                  @click:append-inner="() => {}"
                />
              </template>
              <v-list>
                <v-list-item
                  v-if="coordinatesStore.sortedCoordinates.length === 0"
                  disabled
                >
                  <v-list-item-title class="text-caption">
                    No saved coordinates
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-for="coord in coordinatesStore.sortedCoordinates"
                  :key="coord.id"
                  @click="selectCoordinate(coord, 'intersect')"
                >
                  <v-list-item-title class="text-sm">
                    {{ coord.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-xs">
                    {{ coord.lat.toFixed(6) }}, {{ coord.lon.toFixed(6) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-menu>

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

        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">{{ isEditing ? 'Update Line' : 'Add Line' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { SavedCoordinate } from '@/services/storage'
  import { computed, inject, ref, watch } from 'vue'
  import { calculateDistance, destinationPoint, endpointFromIntersection } from '@/services/geometry'
  import { useCoordinatesStore } from '@/stores/coordinates'
  import { useLayersStore } from '@/stores/layers'
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()
  const layersStore = useLayersStore()
  const coordinatesStore = useCoordinatesStore()
  inject('mapContainer')
  const drawing = inject('drawing') as any

  const modes = [
    { title: 'Two Coordinates', value: 'coordinate' },
    { title: 'Azimuth & Distance', value: 'azimuth' },
    { title: 'Intersection Point', value: 'intersection' },
    { title: 'Parallel', value: 'parallel' },
  ]

  const form = ref({
    name: '',
    mode: 'coordinate' as 'coordinate' | 'azimuth' | 'intersection' | 'parallel',
    startCoord: '48.8566, 2.3522',
    endCoord: '48.8866, 2.3822',
    azimuth: 45,
    distance: 10,
    intersectCoord: '48.8666, 2.3622',
  })

  const isOpen = computed({
    get: () => uiStore.isModalOpen('lineSegmentModal'),
    set: value => {
      if (!value) closeModal()
    },
  })

  const isEditing = computed(() => {
    return uiStore.isEditing('lineSegment', uiStore.editingElement?.id || '')
  })

  // Watch for modal opening - pre-fill form with current element data
  watch(
    () => isOpen.value,
    newValue => {
      if (newValue && uiStore.editingElement?.type === 'lineSegment') {
        const segment = layersStore.lineSegments.find(l => l.id === uiStore.editingElement?.id)
        if (segment) {
          form.value = {
            name: segment.name,
            mode: segment.mode as 'coordinate' | 'azimuth' | 'intersection' | 'parallel',
            startCoord: `${segment.center.lat}, ${segment.center.lon}`,
            endCoord: segment.endpoint ? `${segment.endpoint.lat}, ${segment.endpoint.lon}` : '48.8866, 2.3822',
            azimuth: segment.azimuth !== undefined ? segment.azimuth : 45,
            distance: segment.distance !== undefined ? segment.distance : 10,
            intersectCoord: segment.intersectionPoint ? `${segment.intersectionPoint.lat}, ${segment.intersectionPoint.lon}` : '48.8666, 2.3622',
          }
        }
      }
    },
    { immediate: true },
  )

  // Watch for creating state changes with pre-fill values
  watch(
    () => uiStore.creatingElement,
    newValue => {
      if (newValue?.type === 'lineSegment') {
        // Reset form to defaults
        form.value = {
          name: '',
          mode: 'coordinate',
          startCoord: '48.8566, 2.3522',
          endCoord: '48.8866, 2.3822',
          azimuth: 45,
          distance: 10,
          intersectCoord: '48.8666, 2.3622',
        }

        // Apply pre-fill values if they exist
        if (uiStore.lineSegmentStartPreFill) {
          form.value.startCoord = `${uiStore.lineSegmentStartPreFill.lat}, ${uiStore.lineSegmentStartPreFill.lon}`
        }

        if (uiStore.lineSegmentEndPreFill) {
          form.value.endCoord = `${uiStore.lineSegmentEndPreFill.lat}, ${uiStore.lineSegmentEndPreFill.lon}`
        }
      }
    },
    { immediate: true },
  )

  function selectCoordinate (coord: SavedCoordinate, field: 'start' | 'end' | 'intersect') {
    switch (field) {
      case 'start': {
        form.value.startCoord = `${coord.lat}, ${coord.lon}`

        break
      }
      case 'end': {
        form.value.endCoord = `${coord.lat}, ${coord.lon}`

        break
      }
      case 'intersect': {
        form.value.intersectCoord = `${coord.lat}, ${coord.lon}`

        break
      }
    // No default
    }
  }

  function parseCoordinateString (coordString: string): [number, number] | null {
    const parts = coordString.split(',').map(s => Number.parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(p => Number.isNaN(p))) {
      return null
    }
    return [parts[0]!, parts[1]!]
  }

  function submitForm () {
    try {
      // Handle parallel mode separately
      if (form.value.mode === 'parallel') {
        // Parse the latitude value from startCoord
        const latStr = form.value.startCoord.trim()
        const latitude = Number.parseFloat(latStr)

        if (Number.isNaN(latitude)) {
          uiStore.addToast('Please enter a valid latitude value', 'error')
          return
        }

        if (latitude < -90 || latitude > 90) {
          uiStore.addToast('Latitude must be between -90 and 90 degrees', 'error')
          return
        }

        const name = form.value.name.trim() || `Parallel ${layersStore.lineSegmentCount + 1}`

        if (isEditing.value && uiStore.editingElement) {
          // Update existing parallel
          drawing.updateParallel(uiStore.editingElement.id, latitude, name)
          uiStore.addToast('Parallel updated successfully!', 'success')
          uiStore.stopEditing()
        } else {
          // Add new parallel
          drawing.drawParallel(latitude, name)
          uiStore.addToast('Parallel added successfully!', 'success')
        }
        closeModal()
        resetForm()
        return
      }

      // Parse start coordinates for non-meridian modes
      const startCoord = parseCoordinateString(form.value.startCoord)
      if (!startCoord) {
        uiStore.addToast('Invalid start coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)', 'error')
        return
      }
      const [startLat, startLon] = startCoord

      let endLat: number
      let endLon: number
      let intersectLat: number | undefined
      let intersectLon: number | undefined
      let intersectDistance: number | undefined

      switch (form.value.mode) {
        case 'coordinate': {
          const endCoord = parseCoordinateString(form.value.endCoord)
          if (!endCoord) {
            uiStore.addToast('Invalid end coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)', 'error')
            return
          }
          [endLat, endLon] = endCoord

          break
        }
        case 'azimuth': {
          const endpoint = destinationPoint(startLat, startLon, form.value.distance, form.value.azimuth)
          endLat = endpoint.lat
          endLon = endpoint.lon

          break
        }
        case 'intersection': {
          const intersectCoord = parseCoordinateString(form.value.intersectCoord)
          if (!intersectCoord) {
            uiStore.addToast('Invalid intersection coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)', 'error')
            return
          }
          [intersectLat, intersectLon] = intersectCoord

          // Validate distance is >= distance to intersection point
          const distToIntersection = calculateDistance(startLat, startLon, intersectLat, intersectLon)
          if (form.value.distance < distToIntersection - 1e-6) {
            uiStore.addToast(`Distance must be at least ${distToIntersection.toFixed(2)} km (distance to intersection)`, 'error')
            return
          }

          const endpoint = endpointFromIntersection(startLat, startLon, intersectLat, intersectLon, form.value.distance)
          endLat = endpoint.lat
          endLon = endpoint.lon
          intersectDistance = form.value.distance

          break
        }
        default: {
          throw new Error('Invalid mode')
        }
      }

      // Smart name autogeneration (matches POC behavior)
      let name = form.value.name.trim()
      if (!name) {
        if (form.value.mode === 'coordinate') {
          // Try to find saved coordinate names for smart naming
          const startCoord = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - startLat) < 0.0001 && Math.abs(c.lon - startLon) < 0.0001,
          )
          const endCoord = coordinatesStore.sortedCoordinates.find(
            (c: any) => Math.abs(c.lat - endLat) < 0.0001 && Math.abs(c.lon - endLon) < 0.0001,
          )
          name = startCoord && endCoord ? `${startCoord.name} => ${endCoord.name}` : `Line ${layersStore.lineSegmentCount + 1}`
        } else {
          // Azimuth and intersection modes use generic naming
          name = `Line ${layersStore.lineSegmentCount + 1}`
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
          intersectDistance,
        )
        uiStore.addToast('Line segment updated successfully!', 'success')
        uiStore.stopEditing()
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
          intersectDistance,
        )
        uiStore.addToast('Line segment added successfully!', 'success')
      }
      closeModal()
      resetForm()
    } catch (error) {
      uiStore.addToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  function closeModal () {
    uiStore.closeModal('lineSegmentModal')
    uiStore.stopEditing()
    uiStore.stopCreating()
  }

  function resetForm () {
    form.value = {
      name: '',
      mode: 'coordinate',
      startCoord: '48.8566, 2.3522',
      endCoord: '48.8866, 2.3822',
      azimuth: 45,
      distance: 10,
      intersectCoord: '48.8666, 2.3622',
    }
  }
</script>
