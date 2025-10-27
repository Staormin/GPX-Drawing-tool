<template>
  <v-dialog
    v-model="isOpen"
    max-width="400px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>Save Project</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="projectName"
            class="mb-4"
            density="compact"
            label="Project Name"
            placeholder="e.g., My Project"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const projectsStore = useProjectsStore();

const projectName = ref('');

const isOpen = computed({
  get: () => uiStore.isModalOpen('saveProjectModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

function submitForm() {
  if (projectName.value.trim()) {
    const layerData = layersStore.exportLayers();
    projectsStore.saveProject(projectName.value, {
      circles: layerData.circles,
      lineSegments: layerData.lineSegments,
      points: layerData.points,
      savedCoordinates: [],
    });
    uiStore.addToast('Project saved successfully!', 'success');
    closeModal();
    projectName.value = '';
  } else {
    uiStore.addToast('Please enter a project name', 'error');
  }
}

function closeModal() {
  uiStore.closeModal('saveProjectModal');
}
</script>
