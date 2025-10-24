<template>
  <!-- All three buttons in a row with equal width -->
  <div class="action-buttons">
    <!-- Coords Button -->
    <button
      class="btn-action"
      @click="openCoordinatesModal"
    >
      🗂️ Coords
    </button>

    <!-- Save/Load Menu (relative positioning for dropdown) -->
    <div class="save-menu-wrapper">
      <button
        class="btn-action"
        @click="saveMenuOpen = !saveMenuOpen"
      >
        💾 Save
      </button>

      <!-- Dropdown menu -->
      <div
        v-if="saveMenuOpen"
        class="dropdown-menu"
        @click.stop
      >
        <button
          class="dropdown-item"
          @click="openNewProjectModal"
        >
          ✨ New Project
        </button>
        <button
          class="dropdown-item"
          @click="openLoadProjectModal"
        >
          📥 Load Project
        </button>
        <div class="dropdown-divider" />
        <button
          class="dropdown-item"
          @click="exportAsJSON"
        >
          📄 Export JSON
        </button>
        <button
          class="dropdown-item"
          @click="importFromJSON"
        >
          📋 Import JSON
        </button>
      </div>
    </div>

    <!-- Export GPX Button -->
    <button
      class="btn-action"
      @click="exportAsGPX"
    >
      📥 GPX
    </button>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { downloadGPX, generateCompleteGPX, getTimestamp } from '@/services/gpx'
  import { useCoordinatesStore } from '@/stores/coordinates'
  import { useLayersStore } from '@/stores/layers'
  import { useUIStore } from '@/stores/ui'

  const layersStore = useLayersStore()
  const uiStore = useUIStore()
  const coordinatesStore = useCoordinatesStore()

  const saveMenuOpen = ref(false)

  function openCoordinatesModal () {
    saveMenuOpen.value = false
    uiStore.openModal('coordinatesModal')
  }
  function openNewProjectModal () {
    saveMenuOpen.value = false
    uiStore.openModal('newProjectModal')
  }
  function openLoadProjectModal () {
    saveMenuOpen.value = false
    coordinatesStore.loadCoordinates()
    uiStore.openModal('loadProjectModal')
  }

  function exportAsGPX () {
    saveMenuOpen.value = false
    const circles = layersStore.circles.map(c => ({
      lat: c.center.lat,
      lon: c.center.lon,
      radius: c.radius,
      name: c.name,
    }))

    const radii = [...new Set(circles.map(c => c.radius))]
    const lineSegments = layersStore.lineSegments

    const gpx = generateCompleteGPX(circles, radii, 360, lineSegments, layersStore.points)
    const filename = `gpx-export_${getTimestamp()}.gpx`
    downloadGPX(gpx, filename)
    uiStore.addToast('GPX exported successfully!', 'success')
  }

  function exportAsJSON () {
    saveMenuOpen.value = false
    const projectData = {
      circles: layersStore.circles,
      lineSegments: layersStore.lineSegments,
      points: layersStore.points,
      coordinates: coordinatesStore.savedCoordinates,
      exportedAt: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `project-export_${getTimestamp()}.json`
    link.click()
    URL.revokeObjectURL(url)
    uiStore.addToast('Project exported as JSON successfully!', 'success')
  }

  async function importFromJSON () {
    saveMenuOpen.value = false
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.addEventListener('change', async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const content = await file.text()
        const projectData = JSON.parse(content)

        // Clear existing data
        layersStore.clearLayers()
        coordinatesStore.clearAllCoordinates()

        // Restore circles
        if (projectData.circles && Array.isArray(projectData.circles)) {
          for (const circle of projectData.circles) {
            layersStore.addCircle({
              name: circle.name,
              center: circle.center,
              radius: circle.radius,
            })
          }
        }

        // Restore line segments
        if (projectData.lineSegments && Array.isArray(projectData.lineSegments)) {
          for (const line of projectData.lineSegments) {
            layersStore.addLineSegment({
              name: line.name,
              center: line.center,
              endpoint: line.endpoint,
              mode: line.mode,
              distance: line.distance,
              azimuth: line.azimuth,
            })
          }
        }

        // Restore points
        if (projectData.points && Array.isArray(projectData.points)) {
          for (const point of projectData.points) {
            layersStore.addPoint({
              name: point.name,
              coordinates: point.coordinates,
            })
          }
        }

        // Restore coordinates
        if (projectData.coordinates && Array.isArray(projectData.coordinates)) {
          for (const coord of projectData.coordinates) {
            coordinatesStore.addCoordinate(coord.name, coord.lat, coord.lon)
          }
        }

        uiStore.addToast('Project imported successfully!', 'success')
      } catch (error) {
        uiStore.addToast(
          `Error importing project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error',
        )
      }
    })
    input.click()
  }
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.save-menu-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  min-width: 0;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(148, 163, 184, 0.08);
  color: #f1f5f9;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 15px;
  width: 100%;
}

.btn-action:hover {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35), 0 8px 24px rgba(0, 0, 0, 0.25);
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #f1f5f9;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.dropdown-item:last-of-type {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.dropdown-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.08);
  margin: 0;
}
</style>
