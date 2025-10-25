<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Point' : 'Add Point' }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Point Name"
            variant="outlined"
          />

          <!-- Coordinates with picker -->
          <v-menu>
            <template #activator="{ props }">
              <v-text-field
                v-model="form.coordinates"
                append-inner-icon="mdi-map-marker"
                class="mb-4"
                density="compact"
                label="Coordinates"
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
                @click="selectCoordinate(coord)"
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
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">{{ isEditing ? 'Update Point' : 'Add Point' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { SavedCoordinate } from '@/services/storage'
  import { computed, inject, ref, watch } from 'vue'
  import { useCoordinatesStore } from '@/stores/coordinates'
  import { useLayersStore } from '@/stores/layers'
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()
  const layersStore = useLayersStore()
  const coordinatesStore = useCoordinatesStore()
  inject('mapContainer')
  const drawing = inject('drawing') as any

  const form = ref({
    name: '',
    coordinates: '48.8566, 2.3522',
  })

  const isOpen = computed({
    get: () => uiStore.isModalOpen('pointModal'),
    set: value => {
      if (!value) closeModal()
    },
  })

  const isEditing = computed(() => {
    return uiStore.isEditing('point', uiStore.editingElement?.id || '')
  })

  // Watch for modal opening - pre-fill form with current element data
  watch(
    () => isOpen.value,
    newValue => {
      if (newValue && uiStore.editingElement?.type === 'point') {
        const point = layersStore.points.find(p => p.id === uiStore.editingElement?.id)
        if (point) {
          form.value = {
            name: point.name,
            coordinates: `${point.coordinates.lat}, ${point.coordinates.lon}`,
          }
        }
      }
    },
    { immediate: true },
  )

  function selectCoordinate (coord: SavedCoordinate) {
    form.value.coordinates = `${coord.lat}, ${coord.lon}`
  }

  function submitForm () {
    // Parse coordinates
    const parts = form.value.coordinates.split(',').map(s => Number.parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(p => Number.isNaN(p))) {
      uiStore.addToast('Invalid coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)', 'error')
      return
    }

    const [lat, lon] = parts

    // Autogenerate name if empty (matches POC behavior)
    const name = form.value.name.trim() || `Point ${layersStore.pointCount + 1}`

    if (isEditing.value && uiStore.editingElement) {
      // Note: Point update not yet implemented in useDrawing
      // For now, delete and recreate
      drawing.deleteElement('point', uiStore.editingElement.id)
      drawing.drawPoint(lat, lon, name)
      uiStore.addToast('Point updated successfully!', 'success')
      uiStore.stopEditing()
    } else {
      // Add new point
      drawing.drawPoint(lat, lon, name)
      uiStore.addToast('Point added successfully!', 'success')
    }
    closeModal()
    resetForm()
  }

  function closeModal () {
    uiStore.closeModal('pointModal')
    uiStore.stopEditing()
  }

  function resetForm () {
    form.value = {
      name: '',
      coordinates: '48.8566, 2.3522',
    }
  }
</script>
