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

          <!-- Center Coordinates selector -->
          <v-select
            v-model="form.centerCoord"
            class="mb-4"
            clearable
            density="compact"
            item-title="label"
            item-value="value"
            :items="coordinateItems"
            label="Center Coordinates"
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
import { computed, inject, ref, watch } from 'vue';
import { getReverseGeocodeAddress } from '@/services/address';
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
  centerCoord: '',
  radius: 5,
});

const coordinateItems = computed(() => {
  return coordinatesStore.sortedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`,
    value: `${coord.lat}, ${coord.lon}`,
  }));
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
        centerCoord: '',
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

async function submitForm() {
  if (!form.value.centerCoord) {
    uiStore.addToast('Please select center coordinates', 'error');
    return;
  }

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

  const centerLat = parts[0]!;
  const centerLon = parts[1]!;

  // Autogenerate name if empty
  let name = form.value.name.trim();
  if (!name) {
    // Check if coordinates match a saved coordinate
    const savedCoord = coordinatesStore.sortedCoordinates.find(
      (c: any) => Math.abs(c.lat - centerLat) < 0.0001 && Math.abs(c.lon - centerLon) < 0.0001
    );

    if (savedCoord) {
      name = `Circle at ${savedCoord.name}`;
    } else {
      // Try reverse geocoding
      const { address } = await getReverseGeocodeAddress(centerLat, centerLon);
      name = address ? `Circle at ${address}` : `Circle ${layersStore.circleCount + 1}`;
    }
  }

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
    centerCoord: '',
    radius: 5,
  };
}
</script>
