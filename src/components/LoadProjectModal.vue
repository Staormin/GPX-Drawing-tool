<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    @click:outside="closeModal"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>Load Project</v-card-title>
      <v-card-text>
        <div v-if="projectsStore.projectCount === 0" class="text-center py-8">
          <p class="text-medium-emphasis">No saved projects</p>
        </div>

        <v-list v-else>
          <v-list-item
            v-for="project in projectsStore.sortedProjects"
            :key="project.id"
            class="mb-2"
          >
            <template #default>
              <div class="w-full">
                <div class="font-weight-medium">{{ project.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  Circles: {{ project.data.circles?.length || 0 }} | Lines:
                  {{ project.data.lineSegments?.length || 0 }} | Points:
                  {{ project.data.points?.length || 0 }}
                </div>
                <div v-if="project.updatedAt" class="text-caption text-disabled">
                  {{ new Date(project.updatedAt).toLocaleString() }}
                </div>
              </div>
            </template>

            <template #append>
              <v-btn-group size="x-small">
                <v-btn
                  v-if="project.id"
                  color="primary"
                  icon="mdi-folder-open"
                  @click="loadProject(project.id)"
                />
                <v-btn
                  v-if="project.id"
                  color="error"
                  icon="mdi-delete"
                  @click="deleteProject(project.id)"
                />
              </v-btn-group>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const coordinatesStore = useCoordinatesStore();
const projectsStore = useProjectsStore();
const mapContainer = inject('mapContainer') as any;
const drawing = inject('drawing') as any;
const noteTooltipsRef = inject('noteTooltips') as any;

const isOpen = computed({
  get: () => uiStore.isModalOpen('loadProjectModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

function loadProject(projectId: string) {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (project) {
    try {
      // Clear note tooltips before clearing layers
      const noteTooltips = noteTooltipsRef?.value;
      if (noteTooltips) {
        noteTooltips.clearAllTooltips();
      }

      // Clear current map layers and store
      mapContainer.clearLayers();
      layersStore.clearLayers();
      coordinatesStore.clearCoordinates();

      // Load new layers from project
      layersStore.loadLayers(project.data);

      // Load coordinates from project
      coordinatesStore.loadCoordinates(project.data.savedCoordinates || []);

      // Redraw on map
      drawing.redrawAllElements();

      // Set this project as active so auto-save works correctly
      projectsStore.setActiveProject(projectId);

      uiStore.addToast(`Project "${project.name}" loaded successfully!`, 'success');
      closeModal();
    } catch (error) {
      console.error('Error loading project:', error);
      uiStore.addToast(
        `Failed to load project "${project.name}". Some data may be corrupted.`,
        'error',
        5000
      );

      // Revert to clean state
      mapContainer.clearLayers();
      layersStore.clearLayers();
      coordinatesStore.clearCoordinates();
    }
  }
}

function deleteProject(projectId: string) {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (project && confirm(`Are you sure you want to delete "${project.name}"?`)) {
    const index = projectsStore.projects.findIndex((p) => p.id === projectId);
    if (index !== -1) {
      projectsStore.deleteProject(index);
      uiStore.addToast('Project deleted', 'success');
    }
  }
}

function closeModal() {
  uiStore.closeModal('loadProjectModal');
}
</script>
