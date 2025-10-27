<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Circle' : 'Add Circle' }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Circle Name"
            variant="outlined"
          />

          <!-- Center Coordinates with picker -->
          <v-menu>
            <template #activator="{ props }">
              <v-text-field
                v-model="form.centerCoord"
                append-inner-icon="mdi-map-marker"
                class="mb-4"
                density="compact"
                label="Center Coordinates"
                placeholder="48.8566, 2.3522"
                variant="outlined"
                v-bind="props"
                @click:append-inner="() => {}"
                @update:model-value="parseCoordinateInput"
              />
            </template>
            <v-list>
              <v-list-item v-if="coordinatesStore.sortedCoordinates.length === 0" disabled>
                <v-list-item-title class="text-caption"> No saved coordinates </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-for="coord in coordinatesStore.sortedCoordinates"
                :key="coord.id"
                @click="selectCoordinate(coord, 'center')"
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
            v-model.number="form.radius"
            class="mb-4"
            density="compact"
            label="Radius (km)"
            min="0"
            step="0.1"
            type="number"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">{{
          isEditing ? 'Update Circle' : 'Add Circle'
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { SavedCoordinate } from '@/services/storage';
import { computed, inject, ref, watch } from 'vue';
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
  centerCoord: '48.8566, 2.3522',
  radius: 5,
});

const isOpen = computed({
  get: () => uiStore.isModalOpen('circleModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

const isEditing = computed(() => {
  return uiStore.isEditing('circle', uiStore.editingElement?.id || '');
});

// Watch for modal opening - pre-fill form with current element data
watch(
  () => isOpen.value,
  (newValue) => {
    if (newValue && uiStore.editingElement?.type === 'circle') {
      const circle = layersStore.circles.find((c) => c.id === uiStore.editingElement?.id);
      if (circle) {
        form.value = {
          name: circle.name,
          centerCoord: `${circle.center.lat}, ${circle.center.lon}`,
          radius: circle.radius,
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
    if (newValue?.type === 'circle') {
      // Reset form to defaults
      form.value = {
        name: '',
        centerCoord: '48.8566, 2.3522',
        radius: 5,
      };

      // Apply pre-fill values if they exist
      if (uiStore.circleCenterPreFill) {
        form.value.centerCoord = `${uiStore.circleCenterPreFill.lat}, ${uiStore.circleCenterPreFill.lon}`;
      }
    }
  },
  { immediate: true }
);

function parseCoordinateInput() {
  // This function just validates the input format when needed
  // Actual parsing happens in submitForm
}

function selectCoordinate(coord: SavedCoordinate, field: 'center') {
  if (field === 'center') {
    form.value.centerCoord = `${coord.lat}, ${coord.lon}`;
  }
}

function submitForm() {
  if (form.value.radius <= 0) {
    uiStore.addToast('Please enter a valid radius', 'error');
    return;
  }

  // Parse coordinates
  const parts = form.value.centerCoord.split(',').map((s) => Number.parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some((p) => Number.isNaN(p))) {
    uiStore.addToast('Invalid coordinates format. Use: lat, lon (e.g., 48.8566, 2.3522)', 'error');
    return;
  }

  const [centerLat, centerLon] = parts;

  // Autogenerate name if empty (matches POC behavior)
  const name = form.value.name.trim() || `Circle ${layersStore.circleCount + 1}`;

  if (isEditing.value && uiStore.editingElement) {
    // Update existing circle
    drawing.updateCircle(uiStore.editingElement.id, centerLat, centerLon, form.value.radius, name);
    uiStore.addToast('Circle updated successfully!', 'success');
    uiStore.stopEditing();
  } else {
    // Add new circle
    drawing.drawCircle(centerLat, centerLon, form.value.radius, name);
    uiStore.addToast('Circle added successfully!', 'success');
  }
  closeModal();
  resetForm();
}

function closeModal() {
  uiStore.closeModal('circleModal');
  uiStore.stopEditing();
  uiStore.stopCreating();
}

function resetForm() {
  form.value = {
    name: '',
    centerCoord: '48.8566, 2.3522',
    radius: 5,
  };
}
</script>
