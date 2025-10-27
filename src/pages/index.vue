<template>
  <!-- Navigation bar -->
  <NavigationBar />

  <!-- Fullscreen map -->
  <div id="map" />

  <!-- Sidebar -->
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <!-- Search Along Panel (when active) -->
    <SearchAlongPanelInline v-if="uiStore.searchAlongPanel.isOpen" />

    <!-- Normal sidebar content (when not in search mode) -->
    <template v-else>
      <!-- Scrollable content area -->
      <div class="sidebar-inner">
        <!-- Address search -->
        <SidebarAddressSearch />

        <!-- Drawing Tools -->
        <SidebarDrawingTools />

        <!-- Layers panel -->
        <SidebarLayersPanel />

        <!-- Status messages -->
        <div
          v-if="lastMessage"
          class="status-message"
          :class="{ success: lastMessageType === 'success', error: lastMessageType === 'error' }"
        >
          {{ lastMessage }}
        </div>
      </div>

      <!-- Action buttons footer - sticky at bottom -->
      <div class="sidebar-footer">
        <SidebarActionButtons />
      </div>
    </template>
  </aside>

  <!-- Sidebar toggle button -->
  <button
    :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
    :aria-pressed="sidebarOpen"
    class="sidebar-toggle"
    @click="sidebarOpen = !sidebarOpen"
  >
    {{ sidebarOpen ? '←' : '→' }}
  </button>

  <!-- Modals -->
  <CircleModal v-if="uiStore.isModalOpen('circleModal')" />
  <LineSegmentModal v-if="uiStore.isModalOpen('lineSegmentModal')" />
  <PointModal v-if="uiStore.isModalOpen('pointModal')" />
  <AddPointOnSegmentModal v-if="uiStore.isModalOpen('addPointOnSegmentModal')" />
  <CoordinatesModal v-if="uiStore.isModalOpen('coordinatesModal')" />
  <NewProjectModal v-if="uiStore.isModalOpen('newProjectModal')" />
  <LoadProjectModal v-if="uiStore.isModalOpen('loadProjectModal')" />
  <TutorialModal />

  <!-- Toast notifications -->
  <v-snackbar
    v-for="toast in uiStore.toasts"
    :key="toast.id"
    :model-value="true"
    :type="toast.type"
    @update:model-value="uiStore.removeToast(toast.id)"
  >
    {{ toast.message }}
  </v-snackbar>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref, watch } from 'vue';
import AddPointOnSegmentModal from '@/components/AddPointOnSegmentModal.vue';
import CircleModal from '@/components/CircleModal.vue';
import CoordinatesModal from '@/components/CoordinatesModal.vue';
import LineSegmentModal from '@/components/LineSegmentModal.vue';
import LoadProjectModal from '@/components/LoadProjectModal.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import NewProjectModal from '@/components/NewProjectModal.vue';
import PointModal from '@/components/PointModal.vue';
import SearchAlongPanelInline from '@/components/SearchAlongPanel.vue';
import SidebarActionButtons from '@/components/SidebarActionButtons.vue';
import SidebarAddressSearch from '@/components/SidebarAddressSearch.vue';
import SidebarDrawingTools from '@/components/SidebarDrawingTools.vue';
import SidebarLayersPanel from '@/components/SidebarLayersPanel.vue';
import TutorialModal from '@/components/TutorialModal.vue';
import { useDrawing } from '@/composables/useDrawing';
import { useMap } from '@/composables/useMap';
import { useNavigation } from '@/composables/useNavigation';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const projectsStore = useProjectsStore();
const layersStore = useLayersStore();

const mapContainer = useMap('map');
const drawing = useDrawing(mapContainer);
const navigation = useNavigation();

// Provide the map container and drawing functions to all child components
provide('mapContainer', mapContainer);
provide('drawing', drawing);

const sidebarOpen = ref(true);
watch(
  () => uiStore.sidebarOpen,
  (newValue) => {
    sidebarOpen.value = newValue;
  }
);
const lastMessage = ref<string>('');
const lastMessageType = ref<'success' | 'error'>('success');

// Auto-save on layers or coordinates change
watch(
  [
    () => layersStore.circles,
    () => layersStore.lineSegments,
    () => layersStore.points,
    () => coordinatesStore.savedCoordinates,
  ],
  () => {
    // Auto-save the active project
    if (projectsStore.activeProjectId) {
      projectsStore.autoSaveActiveProject({
        circles: layersStore.circles,
        lineSegments: layersStore.lineSegments,
        points: layersStore.points,
        savedCoordinates: coordinatesStore.savedCoordinates,
      });
    }
  },
  { deep: true }
);

// Initialize map on mount
onMounted(async () => {
  await mapContainer.initMap();

  // Check if any projects exist
  projectsStore.loadProjects();
  if (projectsStore.projectCount === 0) {
    // Prompt for new project if none exist
    uiStore.openModal('newProjectModal');
  } else if (projectsStore.activeProjectId) {
    // Load the active project
    const activeProject = projectsStore.activeProject;
    if (activeProject) {
      // Load project data
      layersStore.clearLayers();
      coordinatesStore.clearCoordinates();

      // Restore circles
      for (const circle of activeProject.data.circles) {
        drawing.drawCircle(circle.center.lat, circle.center.lon, circle.radius, circle.name);
      }

      // Restore line segments
      for (const line of activeProject.data.lineSegments) {
        if (line.mode === 'parallel') {
          drawing.drawParallel(line.longitude === undefined ? 0 : line.longitude, line.name);
        } else if (line.endpoint) {
          drawing.drawLineSegment(
            line.center.lat,
            line.center.lon,
            line.endpoint.lat,
            line.endpoint.lon,
            line.name,
            line.mode as 'coordinate' | 'azimuth' | 'intersection',
            line.distance,
            line.azimuth,
            line.intersectionPoint?.lat,
            line.intersectionPoint?.lon,
            line.intersectionDistance
          );
        }
      }

      // Restore points
      for (const point of activeProject.data.points) {
        drawing.drawPoint(point.coordinates.lat, point.coordinates.lon, point.name);
      }

      // Restore coordinates from project
      coordinatesStore.loadCoordinates(activeProject.data.savedCoordinates || []);
    }
  }

  // Setup right-click to open coordinates modal with pre-filled coordinates
  const unsubscribe = mapContainer.onMapRightClick((lat, lon) => {
    // Pre-fill the coordinates field in the modal
    const coordinatesModalForm = {
      name: '',
      coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    };

    // Store form data and open modal
    uiStore.setCoordinatesFormData(coordinatesModalForm);
    uiStore.openModal('coordinatesModal');
  });

  // Setup keyboard navigation
  const handleKeydown = (event: KeyboardEvent) => {
    if (!uiStore.navigatingElement) return;

    const { navigatingElement } = uiStore;
    if (!navigatingElement) return;

    const map = mapContainer.map?.value;
    if (!map) return;

    const elementType = navigatingElement.type;
    const elementId = navigatingElement.id;
    const zoomLevel = map.getZoom();

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault();

        if (elementType === 'circle') {
          const circle = layersStore.circles.find((c) => c.id === elementId);
          if (circle) {
            navigation.navigateCircleForward(circle, zoomLevel);
            const coords = navigation.getCircleNavigationCoords(circle);
            map.setView([coords.lat, coords.lon], zoomLevel, { animate: false });
          }
        } else if (elementType === 'lineSegment') {
          const segment = layersStore.lineSegments.find((s) => s.id === elementId);
          if (segment) {
            navigation.navigateSegmentForward(segment, zoomLevel);
            const coords = navigation.getSegmentNavigationCoords(segment);
            map.setView([coords.lat, coords.lon], zoomLevel, { animate: false });
          }
        }

        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();

        if (elementType === 'circle') {
          const circle = layersStore.circles.find((c) => c.id === elementId);
          if (circle) {
            navigation.navigateCircleBackward(circle, zoomLevel);
            const coords = navigation.getCircleNavigationCoords(circle);
            map.setView([coords.lat, coords.lon], zoomLevel, { animate: false });
          }
        } else if (elementType === 'lineSegment') {
          const segment = layersStore.lineSegments.find((s) => s.id === elementId);
          if (segment) {
            navigation.navigateSegmentBackward(segment, zoomLevel);
            const coords = navigation.getSegmentNavigationCoords(segment);
            map.setView([coords.lat, coords.lon], zoomLevel, { animate: false });
          }
        }

        break;
      }
      case 'Escape': {
        event.preventDefault();
        uiStore.stopNavigating();

        break;
      }
      // No default
    }
  };

  document.addEventListener('keydown', handleKeydown);

  // Cleanup on unmount
  return () => {
    unsubscribe();
    document.removeEventListener('keydown', handleKeydown);
    mapContainer.destroyMap();
  };
});
</script>

<style scoped>
/* CSS Variables matching POC */
:root {
  --bg: #0f172a;
  --panel: rgba(15, 23, 42, 0.78);
  --panel-border: rgba(148, 163, 184, 0.15);
  --text: #f1f5f9;
  --muted: #94a3b8;
  --accent: #3b82f6;
  --accent-600: #2563eb;
  --shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
}

html,
body,
:global(#app) {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--bg);
  overflow: hidden;
}

#map {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

:global(.leaflet-container) {
  background: #0b1020;
}

:global(.leaflet-grab),
:global(.leaflet-grab:active) {
  cursor: default !important;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  left: -640px;
  height: 100vh;
  width: 640px;
  background: var(--panel);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-right: 1px solid var(--panel-border);
  box-shadow: var(--shadow);
  z-index: 1000;
  color: var(--text);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.sidebar.open {
  left: 0;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 96px;
}

/* Toggle Button */
.sidebar-toggle {
  position: fixed;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  z-index: 1050;
  width: 40px;
  height: 80px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(2, 6, 23, 0.85);
  color: var(--text);
  font-size: 18px;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition:
    box-shadow 0.3s ease,
    background 0.3s ease,
    right 0.3s ease,
    left 0.3s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
}

.sidebar.open ~ .sidebar-toggle {
  left: 648px;
  border-radius: 12px;
}

.sidebar-toggle:hover {
  box-shadow:
    0 0 0 2px rgba(16, 185, 129, 0.35),
    var(--shadow);
  background: rgba(2, 6, 23, 0.95);
}

.sidebar-toggle:active {
  transform: translateY(-50%) scale(0.95);
}

/* Footer */
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid var(--panel-border);
  background: rgba(15, 23, 42, 0.95);
}

/* Status Message */
.status-message {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  font-size: 13px;
}

.status-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
