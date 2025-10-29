<template>
  <!-- Navigation bar -->
  <NavigationBar />

  <!-- Fullscreen map -->
  <div id="map" :class="{ 'freehand-drawing': uiStore.freeHandDrawing.isDrawing }" />

  <!-- Sidebar -->
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <!-- Search Along Panel (when active) -->
    <SearchAlongPanelInline v-if="uiStore.searchAlongPanel.isOpen" />

    <!-- Normal sidebar content (when not in search mode) -->
    <template v-else>
      <!-- Scrollable content area -->
      <div class="sidebar-inner">
        <!-- Address search (includes title header) -->
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

  <!-- Floating help button (always visible) -->
  <button
    aria-label="Show tutorial"
    class="floating-help-btn"
    @click="uiStore.setShowTutorial(true)"
  >
    <span class="text-xl">?</span>
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
    :color="toast.type"
    :model-value="true"
    @update:model-value="uiStore.removeToast(toast.id)"
  >
    {{ toast.message }}
  </v-snackbar>

  <!-- Free hand drawing cursor tooltip -->
  <div
    v-if="cursorTooltip.visible"
    class="cursor-tooltip"
    :style="{ left: cursorTooltip.x + 'px', top: cursorTooltip.y + 'px' }"
  >
    <div class="cursor-tooltip-content">
      <div class="cursor-tooltip-row">
        <span class="cursor-tooltip-label">Distance:</span>
        <span class="cursor-tooltip-value">{{ cursorTooltip.distance }}</span>
      </div>
      <div class="cursor-tooltip-row">
        <span class="cursor-tooltip-label">Azimuth:</span>
        <span class="cursor-tooltip-value">{{ cursorTooltip.azimuth }}</span>
      </div>
    </div>
  </div>
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
import {
  calculateBearing,
  calculateDistance,
  destinationPoint,
  generateLinePointsLinear,
} from '@/services/geometry';
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

// Free hand drawing cursor tooltip
const cursorTooltip = ref<{
  visible: boolean;
  x: number;
  y: number;
  distance: string;
  azimuth: string;
}>({
  visible: false,
  x: 0,
  y: 0,
  distance: '',
  azimuth: '',
});

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

  // Setup free hand drawing mode mouse tracking
  let freeHandPreviewLayer: any = null;
  const handleMouseMove = (event: any) => {
    if (!uiStore.freeHandDrawing.isDrawing) {
      cursorTooltip.value.visible = false;
      return;
    }

    const map = mapContainer.map?.value;
    if (!map) return;

    const { lat, lng } = event.latlng;
    const { startCoord, azimuth } = uiStore.freeHandDrawing;

    // Update cursor tooltip position (offset from cursor)
    const containerPoint = event.containerPoint;
    cursorTooltip.value.x = containerPoint.x + 20;
    cursorTooltip.value.y = containerPoint.y + 20;

    // Parse start coordinates if provided, otherwise use current mouse position as start
    let startLat: number, startLon: number;
    if (startCoord && startCoord.trim() !== '') {
      const parts = startCoord.split(',').map((s: string) => Number.parseFloat(s.trim()));
      if (parts.length === 2 && !parts.some((p: number) => Number.isNaN(p))) {
        startLat = parts[0]!;
        startLon = parts[1]!;
      } else {
        // Invalid start coord, just return
        cursorTooltip.value.visible = false;
        return;
      }
    } else {
      // No start point defined yet - hide tooltip
      cursorTooltip.value.visible = false;
      return;
    }

    // Calculate distance and bearing
    const distance = calculateDistance(startLat, startLon, lat, lng);
    const bearing = calculateBearing(startLat, startLon, lat, lng);

    // Update tooltip content
    cursorTooltip.value.distance = `${distance.toFixed(3)} km`;
    cursorTooltip.value.azimuth = azimuth !== undefined ? `${azimuth.toFixed(1)}° (locked)` : `${bearing.toFixed(1)}°`;
    cursorTooltip.value.visible = true;

    let endLat: number, endLon: number;

    // If azimuth is defined, constrain the line to that azimuth
    if (azimuth !== undefined && startCoord && startCoord.trim() !== '') {
      // Calculate the endpoint at the specified azimuth
      const endpoint = destinationPoint(startLat, startLon, distance, azimuth);
      endLat = endpoint.lat;
      endLon = endpoint.lon;
    } else {
      // Free direction - endpoint is mouse position
      endLat = lat;
      endLon = lng;
    }

    // Remove previous preview layer
    if (freeHandPreviewLayer) {
      map.removeLayer(freeHandPreviewLayer);
    }

    // Draw preview line (using linear interpolation for straight line appearance)
    const L = (window as any).L;
    const linePoints = generateLinePointsLinear(startLat, startLon, endLat, endLon, 100);
    freeHandPreviewLayer = L.polyline(
      linePoints.map((p: any) => [p.lat, p.lon]),
      {
        color: '#000000',
        weight: 3,
        opacity: 0.8,
      }
    ).addTo(map);
  };

  const handleMapClick = async (event: any) => {
    if (!uiStore.freeHandDrawing.isDrawing) return;

    const map = mapContainer.map?.value;
    if (!map) return;

    const { lat, lng } = event.latlng;
    const { startCoord, azimuth, name } = uiStore.freeHandDrawing;

    // Parse start coordinates if provided
    let startLat: number, startLon: number;
    if (startCoord && startCoord.trim() !== '') {
      const parts = startCoord.split(',').map((s: string) => Number.parseFloat(s.trim()));
      if (parts.length === 2 && !parts.some((p: number) => Number.isNaN(p))) {
        startLat = parts[0]!;
        startLon = parts[1]!;
      } else {
        uiStore.addToast('Invalid start coordinates', 'error');
        uiStore.stopFreeHandDrawing();
        return;
      }
    } else {
      // If no start coord was defined, this click sets the start point
      uiStore.freeHandDrawing.startCoord = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      uiStore.addToast('Start point set. Click again to set the endpoint.', 'info');
      return;
    }

    let endLat: number, endLon: number;

    // If azimuth is defined, constrain the line to that azimuth
    if (azimuth !== undefined) {
      // Calculate distance from start to click position
      const dist = calculateDistance(startLat, startLon, lat, lng);
      // Calculate the endpoint at the specified azimuth
      const endpoint = destinationPoint(startLat, startLon, dist, azimuth);
      endLat = endpoint.lat;
      endLon = endpoint.lon;
    } else {
      // Free direction - endpoint is click position
      endLat = lat;
      endLon = lng;
    }

    // Remove preview layer
    if (freeHandPreviewLayer) {
      map.removeLayer(freeHandPreviewLayer);
      freeHandPreviewLayer = null;
    }

    // Draw the actual line
    const lineName = name || `Free Hand Line ${layersStore.lineSegmentCount + 1}`;
    drawing.drawLineSegment(
      startLat,
      startLon,
      endLat,
      endLon,
      lineName,
      'coordinate',
      undefined,
      azimuth,
      undefined,
      undefined,
      undefined
    );

    uiStore.addToast('Line segment added successfully!', 'success');
    uiStore.stopFreeHandDrawing();
  };

  // Add event listeners to the map
  if (mapContainer.map?.value) {
    mapContainer.map.value.on('mousemove', handleMouseMove);
    mapContainer.map.value.on('click', handleMapClick);
  }

  // Setup keyboard shortcuts and navigation
  const handleKeydown = (event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Global keyboard shortcuts (only when not typing in input)
    if (!isInputField && !uiStore.navigatingElement) {
      // Skip if any modifier keys are pressed (Ctrl, Meta, Alt, Shift)
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;

      // Check if any modal is open
      const isAnyModalOpen = uiStore.openModals.size > 0;

      if (!isAnyModalOpen && !hasModifier) {
        switch (event.key.toLowerCase()) {
          case 'c': {
            event.preventDefault();
            uiStore.openModal('circleModal');
            return;
          }
          case 'l': {
            event.preventDefault();
            uiStore.openModal('lineSegmentModal');
            return;
          }
          case 'p': {
            event.preventDefault();
            uiStore.openModal('pointModal');
            return;
          }
          // No default
        }
      }
    }

    // Free hand drawing mode keyboard handling
    if (uiStore.freeHandDrawing.isDrawing) {
      if (event.key === 'Escape') {
        event.preventDefault();
        uiStore.stopFreeHandDrawing();
        uiStore.addToast('Free hand drawing cancelled', 'info');
        return;
      }
    }

    // Navigation mode keyboard handling
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

  // Watch for free hand drawing mode changes to clean up preview
  watch(
    () => uiStore.freeHandDrawing.isDrawing,
    (isDrawing) => {
      if (!isDrawing && freeHandPreviewLayer && mapContainer.map?.value) {
        mapContainer.map.value.removeLayer(freeHandPreviewLayer);
        freeHandPreviewLayer = null;
      }
    }
  );

  // Cleanup on unmount
  return () => {
    unsubscribe();
    document.removeEventListener('keydown', handleKeydown);
    if (mapContainer.map?.value) {
      mapContainer.map.value.off('mousemove', handleMouseMove);
      mapContainer.map.value.off('click', handleMapClick);
      if (freeHandPreviewLayer) {
        mapContainer.map.value.removeLayer(freeHandPreviewLayer);
      }
    }
    mapContainer.destroyMap();
  };
});
</script>

<style scoped>
/* Use Vuetify theme colors via RGB */

/* Global styles for keyboard hints */
:global(.kbd-hint) {
  display: inline-block;
  padding: 2px 6px;
  margin-left: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.95);
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Fix tooltip text color */
:global(.v-tooltip > .v-overlay__content) {
  color: rgba(255, 255, 255, 0.95) !important;
}

html,
body,
:global(#app) {
  height: 100%;
  margin: 0;
  padding: 0;
  background: rgb(var(--v-theme-background));
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
  background: rgb(var(--v-theme-background));
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
  background: rgb(var(--v-theme-surface));
  opacity: 1;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  color: rgb(var(--v-theme-on-surface));
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
  padding-bottom: 80px;
  height: calc(100% - 80px);
  overflow: hidden;
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
  border-radius: 4px;
  border: none;
  background: rgb(var(--v-theme-surface-bright));
  color: rgb(var(--v-theme-on-surface));
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
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
  border-radius: 4px;
}

.sidebar-toggle:hover {
  background: rgb(var(--v-theme-surface-variant));
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
}

.sidebar-toggle:active {
  transform: translateY(-50%) scale(0.95);
}

/* Floating Help Button */
.floating-help-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1050;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.floating-help-btn:hover {
  transform: scale(1.05);
  background: rgb(var(--v-theme-primary-darken-1));
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
}

.floating-help-btn:active {
  transform: scale(0.95);
}

/* Footer */
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}

/* Status Message */
.status-message {
  padding: 12px 14px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
}

.status-message.success {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}

.status-message.error {
  background: rgba(var(--v-theme-error), 0.15);
  color: rgb(var(--v-theme-error));
}

/* Cursor change for free hand drawing */
#map.freehand-drawing {
  cursor: crosshair !important;
}

#map.freehand-drawing * {
  cursor: crosshair !important;
}

/* Cursor tooltip for free hand drawing */
.cursor-tooltip {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
}

.cursor-tooltip-content {
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  font-size: 13px;
  min-width: 160px;
}

.cursor-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0;
}

.cursor-tooltip-label {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
}

.cursor-tooltip-value {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
  font-family: monospace;
}
</style>
