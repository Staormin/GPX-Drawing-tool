<template>
  <v-dialog
    v-model="isOpen"
    max-width="600px"
    @click:outside="closeModal"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>Add Polygon</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Polygon Name (optional)"
            variant="outlined"
          />

          <!-- Points Selection -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Select Points (minimum 3)</div>
            <v-chip-group v-model="selectedPoints" column multiple>
              <v-chip
                v-for="point in layersStore.sortedPoints"
                :key="point.id"
                filter
                :value="point.id"
                variant="outlined"
              >
                {{ point.name }}
              </v-chip>
            </v-chip-group>

            <v-alert
              v-if="layersStore.points.length === 0"
              class="mt-2"
              density="compact"
              type="info"
              variant="tonal"
            >
              No points available. Create at least 3 points first.
            </v-alert>

            <v-alert
              v-if="selectedPoints.length > 0 && selectedPoints.length < 3"
              class="mt-2"
              density="compact"
              type="warning"
              variant="tonal"
            >
              Select at least 3 points to create a polygon ({{ selectedPoints.length }}/3 selected)
            </v-alert>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" :disabled="selectedPoints.length < 3" @click="submitForm">
          Add Polygon
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
inject('mapContainer');
const drawing = inject('drawing') as any;

const form = ref({
  name: '',
});

const selectedPoints = ref<string[]>([]);

const isOpen = computed({
  get: () => uiStore.isModalOpen('polygonModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

function submitForm() {
  if (selectedPoints.value.length < 3) {
    uiStore.addToast('Please select at least 3 points to create a polygon', 'error');
    return;
  }

  // Get the coordinates of the selected points
  const points = selectedPoints.value
    .map((pointId) => {
      const point = layersStore.points.find((p) => p.id === pointId);
      if (point) {
        return {
          lat: point.coordinates.lat,
          lon: point.coordinates.lon,
        };
      }
      return null;
    })
    .filter((p): p is { lat: number; lon: number } => p !== null);

  if (points.length < 3) {
    uiStore.addToast('Unable to find selected points', 'error');
    return;
  }

  // Autogenerate name if empty
  const name = form.value.name.trim() || `Polygon ${layersStore.polygonCount + 1}`;

  // Draw polygon with light green color
  drawing.drawPolygon(points, name, '#90EE90');
  uiStore.addToast('Polygon added successfully!', 'success');

  closeModal();
  resetForm();
}

function closeModal() {
  uiStore.closeModal('polygonModal');
}

function resetForm() {
  form.value = {
    name: '',
  };
  selectedPoints.value = [];
}
</script>
