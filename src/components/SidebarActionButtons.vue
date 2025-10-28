<template>
  <!-- Element count badge -->
  <div v-if="totalElements > 0" class="element-count-badge mb-2">
    <span class="count-item">
      <span class="count-number">{{ layersStore.circleCount }}</span> circles
    </span>
    <span class="count-divider">•</span>
    <span class="count-item">
      <span class="count-number">{{ layersStore.lineSegmentCount }}</span> lines
    </span>
    <span class="count-divider">•</span>
    <span class="count-item">
      <span class="count-number">{{ layersStore.pointCount }}</span> points
    </span>
  </div>

  <!-- All three buttons in a row with equal width -->
  <div class="action-buttons">
    <!-- Coords Button -->
    <button class="btn-action" @click="openCoordinatesModal">🗂️ Coords</button>

    <!-- Save/Load Menu (relative positioning for dropdown) -->
    <div class="save-menu-wrapper">
      <button class="btn-action" @click="saveMenuOpen = !saveMenuOpen">💾 Save</button>

      <!-- Dropdown menu -->
      <div v-if="saveMenuOpen" class="dropdown-menu" @click.stop>
        <button class="dropdown-item" @click="openNewProjectModal">✨ New Project</button>
        <button class="dropdown-item" @click="openLoadProjectModal">📥 Load Project</button>
        <div class="dropdown-divider" />
        <button class="dropdown-item" @click="exportAsJSON">📄 Export JSON</button>
        <button class="dropdown-item" @click="importFromJSON">📋 Import JSON</button>
      </div>
    </div>

    <!-- Export GPX Button -->
    <button class="btn-action" @click="exportAsGPX">📥 GPX</button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { downloadGPX, generateCompleteGPX, getTimestamp } from '@/services/gpx';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import { useUIStore } from '@/stores/ui';

const layersStore = useLayersStore();
const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const projectsStore = useProjectsStore();

const saveMenuOpen = ref(false);

const totalElements = computed(
  () => layersStore.circleCount + layersStore.lineSegmentCount + layersStore.pointCount
);

function openCoordinatesModal() {
  saveMenuOpen.value = false;
  uiStore.openModal('coordinatesModal');
}

function openNewProjectModal() {
  saveMenuOpen.value = false;
  uiStore.openModal('newProjectModal');
}

function openLoadProjectModal() {
  saveMenuOpen.value = false;
  uiStore.openModal('loadProjectModal');
}

function exportAsGPX() {
  saveMenuOpen.value = false;
  const circles = layersStore.circles.map((c) => ({
    lat: c.center.lat,
    lon: c.center.lon,
    radius: c.radius,
    name: c.name,
  }));

  const radii = [...new Set(circles.map((c) => c.radius))];
  const lineSegments = layersStore.lineSegments;

  const gpx = generateCompleteGPX(circles, radii, 360, lineSegments, layersStore.points);

  // Use project name in filename if available
  const projectName = projectsStore.activeProject?.name || 'project';
  const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${sanitizedName}_${getTimestamp()}.gpx`;

  downloadGPX(gpx, filename);
  uiStore.addToast('GPX exported successfully!', 'success');
}

function exportAsJSON() {
  saveMenuOpen.value = false;
  const projectData = {
    circles: layersStore.circles,
    lineSegments: layersStore.lineSegments,
    points: layersStore.points,
    coordinates: coordinatesStore.savedCoordinates,
    exportedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Use project name in filename if available
  const projectName = projectsStore.activeProject?.name || 'project';
  const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${sanitizedName}_${getTimestamp()}.json`;

  link.click();
  URL.revokeObjectURL(url);
  uiStore.addToast('Project exported as JSON successfully!', 'success');
}

async function importFromJSON() {
  saveMenuOpen.value = false;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const projectData = JSON.parse(content);

      // Clear existing data
      layersStore.clearLayers();
      coordinatesStore.clearCoordinates();

      // Restore circles
      if (projectData.circles && Array.isArray(projectData.circles)) {
        for (const circle of projectData.circles) {
          layersStore.addCircle({
            id: circle.id,
            name: circle.name,
            center: circle.center,
            radius: circle.radius,
            color: circle.color,
            leafletId: circle.leafletId,
          });
        }
      }

      // Restore line segments
      if (projectData.lineSegments && Array.isArray(projectData.lineSegments)) {
        for (const line of projectData.lineSegments) {
          layersStore.addLineSegment({
            id: line.id,
            name: line.name,
            center: line.center,
            endpoint: line.endpoint,
            mode: line.mode,
            distance: line.distance,
            azimuth: line.azimuth,
            intersectionPoint: line.intersectionPoint,
            intersectionDistance: line.intersectionDistance,
            longitude: line.longitude,
            color: line.color,
            leafletId: line.leafletId,
          });
        }
      }

      // Restore points
      if (projectData.points && Array.isArray(projectData.points)) {
        for (const point of projectData.points) {
          layersStore.addPoint({
            id: point.id,
            name: point.name,
            coordinates: point.coordinates,
            elevation: point.elevation,
            color: point.color,
            leafletId: point.leafletId,
          });
        }
      }

      // Restore coordinates
      if (projectData.coordinates && Array.isArray(projectData.coordinates)) {
        for (const coord of projectData.coordinates) {
          coordinatesStore.addCoordinate(coord.name, coord.lat, coord.lon);
        }
      }

      uiStore.addToast('Project imported successfully!', 'success');
    } catch (error) {
      uiStore.addToast(
        `Error importing project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  });
  input.click();
}
</script>

<style scoped>
.element-count-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.count-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.count-number {
  font-weight: 500;
  color: #ffffff;
}

.count-divider {
  color: rgba(255, 255, 255, 0.3);
}

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
  border-radius: 4px;
  border: none;
  background: #2c2c2c;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 15px;
  width: 100%;
}

.btn-action:hover {
  background: #3c3c3c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #2c2c2c;
  border: none;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dropdown-item:last-of-type {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0;
}
</style>
