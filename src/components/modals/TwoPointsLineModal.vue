<template>
  <BaseModal
    :is-open="isOpen"
    :submit-text="isEditing ? 'Update' : 'Add'"
    :title="isEditing ? 'Edit Line (Two Points)' : 'Add Line (Two Points)'"
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
  </BaseModal>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, watch } from 'vue';
import BaseModal from '@/components/shared/BaseModal.vue';
import CoordinateSelector from '@/components/shared/CoordinateSelector.vue';
import { useCoordinateItems } from '@/composables/useCoordinateItems';
import { useLineNameGeneration } from '@/composables/useLineNameGeneration';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const { coordinateItems } = useCoordinateItems();
const { generateTwoPointsName } = useLineNameGeneration();
const drawing = inject('drawing') as any;

const isOpen = computed(() => uiStore.isModalOpen('twoPointsLineModal'));
const isEditing = computed(() => !!uiStore.editingElement);

const form = reactive({
  name: '',
  startCoord: null as string | null,
  endCoord: null as string | null,
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

async function submitForm() {
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

  // Auto-generate name if empty
  let name = form.name.trim();
  if (!name) {
    name = await generateTwoPointsName(startLat, startLon, endLat, endLon);
  }

  if (isEditing.value && uiStore.editingElement) {
    layersStore.updateLineSegment(uiStore.editingElement.id, {
      name,
      center: { lat: startLat, lon: startLon },
      endpoint: { lat: endLat, lon: endLon },
      mode: 'coordinate',
    });
    uiStore.addToast('Line updated successfully!', 'success');
  } else {
    // Create new two-points line
    drawing.drawLineSegment(
      startLat,
      startLon,
      endLat,
      endLon,
      name,
      'coordinate',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    uiStore.addToast('Line added successfully!', 'success');
  }

  closeModal();
}
</script>
