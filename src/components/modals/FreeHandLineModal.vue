<template>
  <v-dialog v-model="isOpen" max-width="600px" @click:outside="closeModal" @keydown.esc="closeModal">
    <v-card>
      <v-card-title>Add Line (Free Hand)</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            label="Line Name (optional)"
            density="compact"
            variant="outlined"
            class="mb-4"
          />

          <CoordinateSelector
            v-model="form.startCoord"
            :items="coordinateItems"
            label="Start Coordinates (optional)"
            placeholder="Select a saved coordinate or click on map"
          />

          <v-text-field
            v-model.number="form.azimuth"
            label="Azimuth (degrees, optional)"
            type="number"
            min="0"
            max="360"
            step="0.01"
            density="compact"
            variant="outlined"
            placeholder="Leave empty for free direction"
            class="mb-4"
          />

          <v-alert type="info" density="compact" class="mb-0">
            Click "Start Drawing" to enter drawing mode. Move your mouse to set the endpoint. Press
            Escape to cancel.
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">Start Drawing</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import CoordinateSelector from '@/components/shared/CoordinateSelector.vue';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();

const isOpen = computed(() => uiStore.isModalOpen('freeHandLineModal'));

const form = reactive({
  name: '',
  startCoord: null as string | null,
  azimuth: undefined as number | undefined,
});

const coordinateItems = computed(() => {
  return coordinatesStore.savedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`,
    value: `${coord.lat},${coord.lon}`,
  }));
});

watch(isOpen, (newVal) => {
  if (newVal) {
    form.name = '';
    form.startCoord = null;
    form.azimuth = undefined;
  }
});

function closeModal() {
  uiStore.closeModal('freeHandLineModal');
}

function submitForm() {
  uiStore.startFreeHandDrawing(form.startCoord, form.azimuth, form.name);
  closeModal();
}
</script>
