<template>
  <v-dialog v-model="isOpen" max-width="600px" @click:outside="closeModal" @keydown.esc="closeModal">
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Parallel Line' : 'Add Parallel Line' }}</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            label="Line Name"
            density="compact"
            variant="outlined"
            class="mb-4"
          />

          <v-select
            v-model="form.latitude"
            :items="latitudeItems"
            label="Latitude"
            placeholder="Select a saved coordinate for latitude"
            clearable
            density="compact"
            item-title="label"
            item-value="value"
            variant="outlined"
            class="mb-4"
          >
            <template #no-data>
              <v-list-item>
                <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
              </v-list-item>
            </template>
          </v-select>
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
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const layersStore = useLayersStore();

const isOpen = computed(() => uiStore.isModalOpen('parallelLineModal'));
const isEditing = computed(() => !!uiStore.editingElement);

const form = reactive({
  name: '',
  latitude: null as number | null,
});

const latitudeItems = computed(() => {
  return coordinatesStore.savedCoordinates.map((coord) => ({
    label: `${coord.name} (${coord.lat.toFixed(6)})`,
    value: coord.lat,
  }));
});

watch(isOpen, (newVal) => {
  if (newVal) {
    if (isEditing.value && uiStore.editingElement) {
      const element = layersStore.lineSegments.find((l) => l.id === uiStore.editingElement?.id);
      if (element && element.longitude !== undefined) {
        form.name = element.name;
        form.latitude = element.longitude; // Note: this stores latitude in longitude field
      }
    } else {
      form.name = '';
      form.latitude = null;
    }
  }
});

function closeModal() {
  uiStore.closeModal('parallelLineModal');
  uiStore.stopEditing();
}

function submitForm() {
  if (form.latitude === null) {
    uiStore.addToast('Please select a latitude', 'error');
    return;
  }

  if (isEditing.value && uiStore.editingElement) {
    layersStore.updateLineSegment(uiStore.editingElement.id, {
      name: form.name,
      mode: 'parallel',
      longitude: form.latitude,
    });
    uiStore.addToast('Parallel line updated successfully!', 'success');
  } else {
    uiStore.addToast('Parallel line added successfully!', 'success');
  }

  closeModal();
}
</script>
