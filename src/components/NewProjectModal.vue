<template>
  <v-dialog
    v-model="isOpen"
    max-width="400px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>New Project</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="projectName"
            autofocus
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
        <v-btn color="primary" @click="submitForm">Create Project</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useCoordinatesStore } from '@/stores/coordinates'
  import { useLayersStore } from '@/stores/layers'
  import { useProjectsStore } from '@/stores/projects'
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()
  const layersStore = useLayersStore()
  const projectsStore = useProjectsStore()
  const coordinatesStore = useCoordinatesStore()

  const projectName = ref('')

  const isOpen = computed({
    get: () => uiStore.isModalOpen('newProjectModal'),
    set: value => {
      if (!value) closeModal()
    },
  })

  function submitForm () {
    if (projectName.value.trim()) {
      // Save current project if active before creating new one
      if (projectsStore.activeProjectId) {
        const currentProject = projectsStore.activeProject
        if (currentProject) {
          const layerData = layersStore.exportLayers()
          projectsStore.updateProject(
            projectsStore.projects.indexOf(currentProject),
            currentProject.name,
            {
              circles: layerData.circles,
              lineSegments: layerData.lineSegments,
              points: layerData.points,
              savedCoordinates: coordinatesStore.sortedCoordinates,
            },
          )
        }
      }

      // Create and switch to new project
      projectsStore.createAndSwitchProject(projectName.value, {
        circles: [],
        lineSegments: [],
        points: [],
        savedCoordinates: [],
      })

      // Clear the current view
      layersStore.clearLayers()
      coordinatesStore.clearAllCoordinates()

      uiStore.addToast(`Project "${projectName.value}" created!`, 'success')
      closeModal()
      projectName.value = ''
    } else {
      uiStore.addToast('Please enter a project name', 'error')
    }
  }

  function closeModal () {
    uiStore.closeModal('newProjectModal')
  }
</script>
