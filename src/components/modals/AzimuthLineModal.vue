<template>
  <v-dialog v-model="isOpen" max-width="600px" @click:outside="closeModal" @keydown.esc="closeModal">
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Line (Azimuth)' : 'Add Line (Azimuth)' }}</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            label="Line Name"
            density="compact"
            variant="outlined"
            class="mb-4"
          />

          <CoordinateSelector
            v-model="form.startCoord"
            :items="coordinateItems"
            label="Start Coordinates"
            placeholder="Select a saved coordinate"
          />

          <v-text-field
            v-model.number="form.azimuth"
            label="Azimuth (degrees)"
            type="number"
            min="0"
            max="360"
            step="0.01"
            density="compact"
            variant="outlined"
            class="mb-4"
          />

          <v-text-field
            v-model.number="form.distance"
            label="Distance (km)"
            type="number"
            min="0"
            step="0.1"
            density="compact"
            variant="outlined"
            class="mb-4"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">{{ isEditing ? 'Update' : 'Add' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import CoordinateSelector from '@/components/shared/CoordinateSelector.vue';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const layersStore = useLayersStore();

const isOpen = computed(() => uiStore.isModalOpen('azimuthLineModal'));
const isEditing = computed(() => !!uiStore.editingElement);

const form = reactive({
  name: '',
  startCoord: null as string | null,
  azimuth: 0,
  distance: 0,
});

const coordinateItems = computed(() => {
  return coordinatesStore.savedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`,
    value: `${coord.lat},${coord.lon}`,
  }));
});

watch(isOpen, (newVal) => {
  if (newVal) {
    if (isEditing.value && uiStore.editingElement) {
      const element = layersStore.lineSegments.find((l) => l.id === uiStore.editingElement?.id);
      if (element) {
        form.name = element.name;
        form.startCoord = `${element.center.lat},${element.center.lon}`;
        form.azimuth = element.azimuth || 0;
        form.distance = element.distance || 0;
      }
    } else {
      form.name = '';
      form.startCoord = null;
      form.azimuth = 0;
      form.distance = 0;
    }
  }
});

function closeModal() {
  uiStore.closeModal('azimuthLineModal');
  uiStore.stopEditing();
}

function submitForm() {
  if (!form.startCoord) {
    uiStore.addToast('Please select start coordinates', 'error');
    return;
  }

  const startCoords = form.startCoord.split(',').map(Number);
  const startLat = startCoords[0]!;
  const startLon = startCoords[1]!;

  if (isEditing.value && uiStore.editingElement) {
    layersStore.updateLineSegment(uiStore.editingElement.id, {
      name: form.name,
      center: { lat: startLat, lon: startLon },
      mode: 'azimuth',
      azimuth: form.azimuth,
      distance: form.distance,
    });
    uiStore.addToast('Line updated successfully!', 'success');
  } else {
    uiStore.addToast('Line added successfully!', 'success');
  }

  closeModal();
}
</script>
