<template>
  <BaseModal
    :is-open="isOpen"
    :submit-text="isEditing ? 'Update' : 'Add'"
    :title="isEditing ? 'Edit Parallel Line' : 'Add Parallel Line'"
    @close="closeModal"
    @submit="submitForm"
  >
    <v-form @submit.prevent="submitForm">
      <v-text-field
        v-model="form.name"
        class="mb-4"
        density="compact"
        label="Line Name"
        variant="outlined"
      />

      <v-select
        v-model="form.latitude"
        class="mb-4"
        clearable
        density="compact"
        item-title="label"
        item-value="value"
        :items="latitudeItems"
        label="Latitude"
        placeholder="Select a saved coordinate for latitude"
        variant="outlined"
      >
        <template #no-data>
          <v-list-item>
            <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
          </v-list-item>
        </template>
      </v-select>
    </v-form>
  </BaseModal>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import { useLineNameGeneration } from '@/composables/useLineNameGeneration';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const layersStore = useLayersStore();
const { generateParallelName } = useLineNameGeneration();
const drawing = inject('drawing') as any;

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

  // Validate latitude range
  if (form.latitude < -90 || form.latitude > 90) {
    uiStore.addToast('Latitude must be between -90 and 90 degrees', 'error');
    return;
  }

  // Auto-generate name if empty
  let name = form.name.trim();
  if (!name) {
    name = generateParallelName(form.latitude);
  }

  if (isEditing.value && uiStore.editingElement) {
    // Update existing parallel
    drawing.updateParallel(uiStore.editingElement.id, form.latitude, name);
    uiStore.addToast('Parallel line updated successfully!', 'success');
  } else {
    // Create new parallel line
    drawing.drawParallel(form.latitude, name);
    uiStore.addToast('Parallel line added successfully!', 'success');
  }

  closeModal();
}
</script>
