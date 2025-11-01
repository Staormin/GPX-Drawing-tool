<template>
  <v-menu v-model="isOpen" :close-on-content-click="false" location="bottom">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        class="ml-2"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
      />
    </template>

    <v-list density="compact">
      <!-- Visibility toggle -->
      <v-list-item @click="handleToggleVisibility">
        <template #prepend>
          <v-icon :icon="isVisible ? 'mdi-eye' : 'mdi-eye-off'" size="small" />
        </template>
        <v-list-item-title>{{ isVisible ? 'Hide' : 'Show' }}</v-list-item-title>
      </v-list-item>

      <!-- Navigate (only for circles and line segments) -->
      <v-list-item v-if="['circle', 'lineSegment'].includes(elementType)" @click="handleNavigate">
        <template #prepend>
          <v-icon icon="mdi-navigation" size="small" />
        </template>
        <v-list-item-title>Navigate</v-list-item-title>
      </v-list-item>

      <!-- Add point on segment (only for line segments) -->
      <v-list-item v-if="elementType === 'lineSegment'" @click="handleAddPointOnSegment">
        <template #prepend>
          <v-icon icon="mdi-plus" size="small" />
        </template>
        <v-list-item-title>Add point on</v-list-item-title>
      </v-list-item>

      <!-- Location near (only for line segments and points) -->
      <v-list-item
        v-if="['lineSegment', 'point'].includes(elementType)"
        @click="handleLocationNear"
      >
        <template #prepend>
          <v-icon icon="mdi-magnify" size="small" />
        </template>
        <v-list-item-title>Location near</v-list-item-title>
      </v-list-item>

      <!-- Bearings (only for points) -->
      <v-list-item v-if="elementType === 'point'" @click="handleBearings">
        <template #prepend>
          <v-icon icon="mdi-compass" size="small" />
        </template>
        <v-list-item-title>Bearings</v-list-item-title>
      </v-list-item>

      <!-- Add as coordinate (only for points without existing coordinate) -->
      <v-list-item
        v-if="elementType === 'point' && !hasCoordinateAtLocation"
        @click="handleAddAsCoordinate"
      >
        <template #prepend>
          <v-icon icon="mdi-plus" size="small" />
        </template>
        <v-list-item-title>Add as coordinate</v-list-item-title>
      </v-list-item>

      <!-- Create with (only for points) -->
      <v-menu v-if="elementType === 'point'" location="end">
        <template #activator="{ props: menuProps }">
          <v-list-item v-bind="menuProps">
            <template #prepend>
              <v-icon icon="mdi-plus-circle" size="small" />
            </template>
            <v-list-item-title>Create with</v-list-item-title>
            <template #append>
              <v-icon icon="mdi-chevron-right" size="small" />
            </template>
          </v-list-item>
        </template>

        <v-list density="compact">
          <!-- Create circle -->
          <v-list-item @click="handleCreateCircle">
            <template #prepend>
              <v-icon icon="mdi-circle" size="small" />
            </template>
            <v-list-item-title>Circle</v-list-item-title>
          </v-list-item>

          <!-- Create line segment submenu -->
          <v-menu location="end">
            <template #activator="{ props: lineMenuProps }">
              <v-list-item v-bind="lineMenuProps">
                <template #prepend>
                  <v-icon icon="mdi-minus" size="small" />
                </template>
                <v-list-item-title>Line segment</v-list-item-title>
                <template #append>
                  <v-icon icon="mdi-chevron-right" size="small" />
                </template>
              </v-list-item>
            </template>

            <v-list density="compact">
              <v-list-item @click="handleCreateLineAsStart">
                <template #prepend>
                  <v-icon icon="mdi-circle-small" size="small" />
                </template>
                <v-list-item-title>As start point</v-list-item-title>
              </v-list-item>

              <v-list-item @click="handleCreateLineAsEnd">
                <template #prepend>
                  <v-icon icon="mdi-circle-small" size="small" />
                </template>
                <v-list-item-title>As end point</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list>
      </v-menu>

      <!-- Add center as point (only for polygons) -->
      <v-list-item v-if="elementType === 'polygon'" @click="handleAddCenterAsPoint">
        <template #prepend>
          <v-icon icon="mdi-image-filter-center-focus" size="small" />
        </template>
        <v-list-item-title>Add center as point</v-list-item-title>
      </v-list-item>

      <!-- Add/Edit note -->
      <v-list-item @click="handleAddNote">
        <template #prepend>
          <v-icon :icon="hasNote ? 'mdi-note-edit' : 'mdi-note-plus'" size="small" />
        </template>
        <v-list-item-title>{{ hasNote ? 'Edit note' : 'Add note' }}</v-list-item-title>
      </v-list-item>

      <!-- Edit -->
      <v-list-item @click="handleEdit">
        <template #prepend>
          <v-icon icon="mdi-pencil" size="small" />
        </template>
        <v-list-item-title>Edit</v-list-item-title>
      </v-list-item>

      <!-- Delete -->
      <v-list-item class="text-error" @click="handleDelete">
        <template #prepend>
          <v-icon color="error" icon="mdi-delete" size="small" />
        </template>
        <v-list-item-title>Delete</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import type { CircleElement, LineSegmentElement, PointElement } from '@/services/storage';
import { computed, inject, ref } from 'vue';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

interface Props {
  elementType: 'circle' | 'lineSegment' | 'point' | 'polygon';
  elementId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [element: CircleElement | LineSegmentElement | PointElement];
  delete: [elementType: string, elementId: string];
}>();

const isOpen = ref(false);
const uiStore = useUIStore();
const layersStore = useLayersStore();
const coordinatesStore = useCoordinatesStore();
const drawing = inject('drawing') as any;

const isVisible = computed(() => uiStore.isElementVisible(props.elementType, props.elementId));

const hasCoordinateAtLocation = computed(() => {
  if (props.elementType !== 'point') return false;
  const point = layersStore.points.find((p) => p.id === props.elementId);
  if (!point) return false;
  return coordinatesStore.savedCoordinates.some(
    (c) => c.lat === point.coordinates.lat && c.lon === point.coordinates.lon
  );
});

const hasNote = computed(() => {
  const element = getElement();
  return element?.noteId !== undefined;
});

function getElement() {
  switch (props.elementType) {
    case 'circle': {
      return layersStore.circles.find((c) => c.id === props.elementId);
    }
    case 'lineSegment': {
      return layersStore.lineSegments.find((s) => s.id === props.elementId);
    }
    case 'point': {
      return layersStore.points.find((p) => p.id === props.elementId);
    }
  }
}

function handleToggleVisibility() {
  uiStore.toggleElementVisibility(props.elementType, props.elementId);
  const element = getElement();
  if (element) {
    const isNowVisible = uiStore.isElementVisible(props.elementType, props.elementId);
    // Update the map visibility through the drawing composable
    drawing.updateElementVisibility(props.elementType, props.elementId, isNowVisible);
    uiStore.addToast(`${element.name} is now ${isNowVisible ? 'visible' : 'hidden'}`, 'success');
  }
  isOpen.value = false;
}

function handleNavigate() {
  const element = getElement();
  if (!element) return;

  const elementType = props.elementType as 'circle' | 'lineSegment' | 'point';
  if (elementType === 'circle' || elementType === 'lineSegment') {
    uiStore.startNavigating(elementType, props.elementId);
  }
  isOpen.value = false;
}

function handleAddPointOnSegment() {
  if (props.elementType !== 'lineSegment') return;

  // Get reference to the AddPointOnSegmentModal and call its openModal function
  // We need to emit an event or use a different approach since we can't directly reference the modal
  // The best approach is to use UIStore to track which segment to open the modal for
  uiStore.openModal('addPointOnSegmentModal');
  uiStore.setSelectedSegmentForPointCreation(props.elementId);
  isOpen.value = false;
}

function handleAddAsCoordinate() {
  if (props.elementType !== 'point') return;

  const point = layersStore.points.find((p) => p.id === props.elementId);
  if (!point) {
    uiStore.addToast('Point not found', 'error');
    return;
  }

  coordinatesStore.addCoordinate(point.name, point.coordinates.lat, point.coordinates.lon);
  uiStore.addToast(`"${point.name}" added to saved coordinates`, 'success');
  isOpen.value = false;
}

function handleEdit() {
  const element = getElement();
  if (!element) return;

  emit('edit', element);
  isOpen.value = false;
}

function handleAddCenterAsPoint() {
  if (props.elementType !== 'polygon') return;

  const polygon = layersStore.polygons.find((p) => p.id === props.elementId);
  if (!polygon) {
    uiStore.addToast('Polygon not found', 'error');
    return;
  }

  // Calculate polygon center
  const sumLat = polygon.points.reduce((sum, p) => sum + p.lat, 0);
  const sumLon = polygon.points.reduce((sum, p) => sum + p.lon, 0);
  const centerLat = sumLat / polygon.points.length;
  const centerLon = sumLon / polygon.points.length;

  // Create point at center
  if (drawing) {
    const pointName = `${polygon.name} Center`;
    drawing.drawPoint(centerLat, centerLon, pointName);

    // Also save as coordinate
    coordinatesStore.addCoordinate(pointName, centerLat, centerLon);

    uiStore.addToast('Center added as point and coordinate', 'success');
  }

  isOpen.value = false;
}

function handleDelete() {
  const element = getElement();
  if (!element) {
    uiStore.addToast('Element not found', 'error');
    return;
  }

  if (confirm(`Are you sure you want to delete "${element.name}"?`)) {
    emit('delete', props.elementType, props.elementId);
    uiStore.addToast(`${element.name} deleted`, 'success');
    isOpen.value = false;
  }
}

function handleCreateCircle() {
  if (props.elementType !== 'point') return;

  const point = layersStore.points.find((p) => p.id === props.elementId);
  if (!point) {
    uiStore.addToast('Point not found', 'error');
    return;
  }

  // Open circle modal with pre-filled center from point coordinates
  uiStore.startCreating('circle');
  uiStore.setCircleCenter(point.coordinates.lat, point.coordinates.lon);
  uiStore.openModal('circleModal');
  isOpen.value = false;
}

function handleCreateLineAsStart() {
  if (props.elementType !== 'point') return;

  const point = layersStore.points.find((p) => p.id === props.elementId);
  if (!point) {
    uiStore.addToast('Point not found', 'error');
    return;
  }

  // Open line segment modal with pre-filled start point
  uiStore.startCreating('lineSegment');
  uiStore.setLineSegmentStart(point.coordinates.lat, point.coordinates.lon);
  uiStore.openModal('lineSegmentModal');
  isOpen.value = false;
}

function handleCreateLineAsEnd() {
  if (props.elementType !== 'point') return;

  const point = layersStore.points.find((p) => p.id === props.elementId);
  if (!point) {
    uiStore.addToast('Point not found', 'error');
    return;
  }

  // Open line segment modal with pre-filled end point
  uiStore.startCreating('lineSegment');
  uiStore.setLineSegmentEnd(point.coordinates.lat, point.coordinates.lon);
  uiStore.openModal('lineSegmentModal');
  isOpen.value = false;
}

function handleLocationNear() {
  const elementType = props.elementType as 'lineSegment' | 'point';
  if (!['lineSegment', 'point'].includes(elementType)) return;

  const element = getElement();
  if (!element) {
    uiStore.addToast('Element not found', 'error');
    return;
  }

  uiStore.openSearchAlong(elementType, props.elementId);
  isOpen.value = false;
}

function handleBearings() {
  if (props.elementType !== 'point') return;

  const element = getElement();
  if (!element) {
    uiStore.addToast('Point not found', 'error');
    return;
  }

  uiStore.openBearings(props.elementId);
  isOpen.value = false;
}

function handleAddNote() {
  const element = getElement();

  if (element?.noteId) {
    // Element already has a note - edit it
    const note = layersStore.notes.find((n) => n.id === element.noteId);
    if (note) {
      uiStore.startEditing('note', note.id);
      uiStore.openModal('noteModal');
    } else {
      // Note ID exists but note not found - create new one
      uiStore.setNotePreFill(props.elementType, props.elementId);
      uiStore.openModal('noteModal');
    }
  } else {
    // No note exists - create new one
    uiStore.setNotePreFill(props.elementType, props.elementId);
    uiStore.openModal('noteModal');
  }

  isOpen.value = false;
}
</script>
