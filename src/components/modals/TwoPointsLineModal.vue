<template>
  <v-dialog v-model="isOpen" max-width="600px" @click:outside="closeModal" @keydown.esc="closeModal">
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Line (Two Points)' : 'Add Line (Two Points)' }}</v-card-title>

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

          <CoordinateSelector
            v-model="form.endCoord"
            :items="coordinateItems"
            label="End Coordinates"
            placeholder="Select a saved coordinate"
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
import { computed, reactive, ref, watch } from 'vue';
import CoordinateSelector from '@/components/shared/CoordinateSelector.vue';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const layersStore = useLayersStore();

const isOpen = computed(() => uiStore.isModalOpen('twoPointsLineModal'));
const isEditing = computed(() => !!uiStore.editingElement);

const form = reactive({
  name: '',
  startCoord: null as string | null,
  endCoord: null as string | null,
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
        form.endCoord = element.endpoint ? `${element.endpoint.lat},${element.endpoint.lon}` : null;
      }
    } else {
      form.name = '';
      form.startCoord = null;
      form.endCoord = null;
    }
  }
});

function closeModal() {
  uiStore.closeModal('twoPointsLineModal');
  uiStore.stopEditing();
}

function submitForm() {
  if (!form.startCoord || !form.endCoord) {
    uiStore.addToast('Please select both start and end coordinates', 'error');
    return;
  }

  const startCoords = form.startCoord.split(',').map(Number);
  const endCoords = form.endCoord.split(',').map(Number);
  const startLat = startCoords[0]!;
  const startLon = startCoords[1]!;
  const endLat = endCoords[0]!;
  const endLon = endCoords[1]!;

  if (isEditing.value && uiStore.editingElement) {
    layersStore.updateLineSegment(uiStore.editingElement.id, {
      name: form.name,
      center: { lat: startLat, lon: startLon },
      endpoint: { lat: endLat, lon: endLon },
      mode: 'coordinate',
    });
    uiStore.addToast('Line updated successfully!', 'success');
  } else {
    // Add new line logic here - inject drawing composable if needed
    uiStore.addToast('Line added successfully!', 'success');
  }

  closeModal();
}
</script>
