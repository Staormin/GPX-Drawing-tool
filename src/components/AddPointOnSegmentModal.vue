<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    @click:outside="closeModal"
    @keydown.enter="submitForm"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>Add Point on Segment</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            class="mb-4"
            density="compact"
            label="Point Name (optional)"
            placeholder="e.g., Waypoint, Landmark"
            variant="outlined"
          />

          <v-select
            v-model="form.distanceFrom"
            class="mb-4"
            density="compact"
            :items="distanceFromOptions"
            label="Distance From"
            variant="outlined"
          />

          <div class="d-flex gap-2 mb-4">
            <v-text-field
              v-model.number="form.distance"
              class="flex-grow-1"
              density="compact"
              label="Distance (km)"
              min="0"
              placeholder="0.0"
              step="0.01"
              type="number"
              variant="outlined"
            />
            <v-btn class="mt-1" color="secondary" @click="calculateMidpoint"> Midpoint </v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" @click="submitForm">Add Point</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import {
  calculateDistance,
  destinationPoint,
  mercatorProject,
  mercatorUnproject,
} from '@/services/geometry';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const layersStore = useLayersStore();
const drawing = inject('drawing') as any;

const distanceFromOptions = [
  { title: 'Start', value: 'start' },
  { title: 'End', value: 'end' },
];

const form = ref({
  name: '',
  distanceFrom: 'start' as 'start' | 'end',
  distance: 0,
});

const isOpen = computed({
  get: () => uiStore.isModalOpen('addPointOnSegmentModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

const selectedSegmentId = computed(() => uiStore.selectedSegmentForPointCreation);

function getSegmentEndpoint(segment: any) {
  switch (segment.mode) {
    case 'coordinate': {
      return segment.endpoint;
    }
    case 'azimuth': {
      return destinationPoint(
        segment.center.lat,
        segment.center.lon,
        segment.distance,
        segment.azimuth
      );
    }
    case 'intersection': {
      return segment.endpoint;
    }
    // No default
  }
  return null;
}

function calculateMidpoint() {
  if (!selectedSegmentId.value) return;

  const segment = layersStore.lineSegments.find((s) => s.id === selectedSegmentId.value);
  if (!segment) return;

  const endpoint = getSegmentEndpoint(segment);
  if (!endpoint) return;

  // Calculate total haversine distance
  const totalDistance = calculateDistance(
    segment.center.lat,
    segment.center.lon,
    endpoint.lat,
    endpoint.lon
  );

  // The midpoint distance is half of total haversine distance
  // This will be placed using binary search in submitForm to ensure consistency
  form.value.distance = totalDistance / 2;
  form.value.distanceFrom = 'start';

  // Auto-name the point as "{line name} - Midpoint"
  form.value.name = `${segment.name} - Midpoint`;
}

function submitForm() {
  if (!selectedSegmentId.value) return;

  const segment = layersStore.lineSegments.find((s) => s.id === selectedSegmentId.value);
  if (!segment) {
    uiStore.addToast('Segment not found', 'error');
    return;
  }

  const endpoint = getSegmentEndpoint(segment);
  if (!endpoint) {
    uiStore.addToast('Could not calculate segment endpoint', 'error');
    return;
  }

  // Use Haversine distance for validation and display consistency
  const segmentLength = calculateDistance(
    segment.center.lat,
    segment.center.lon,
    endpoint.lat,
    endpoint.lon
  );

  if (form.value.distance > segmentLength) {
    const msg = `Distance exceeds segment length (${segmentLength.toFixed(2)} km)`;
    uiStore.addToast(msg, 'error');
    return;
  }

  if (form.value.distance < 0) {
    uiStore.addToast('Distance must be positive', 'error');
    return;
  }

  // Find point on the Web Mercator line that corresponds to the target Haversine distance
  // Use binary search in Web Mercator space to find the exact point
  const startProj = mercatorProject(segment.center.lat, segment.center.lon);
  const endProj = mercatorProject(endpoint.lat, endpoint.lon);
  const dx = endProj.x - startProj.x;
  const dy = endProj.y - startProj.y;

  let pointOnSegment;

  if (form.value.distanceFrom === 'start') {
    // Binary search to find fraction that matches target haversine distance
    let minFraction = 0;
    let maxFraction = 1;
    let targetFraction = 0.5;
    let iterations = 0;
    const maxIterations = 30;

    while (iterations < maxIterations) {
      const testProjX = startProj.x + targetFraction * dx;
      const testProjY = startProj.y + targetFraction * dy;
      const testPoint = mercatorUnproject(testProjX, testProjY);

      const testDistance = calculateDistance(
        segment.center.lat,
        segment.center.lon,
        testPoint.lat,
        testPoint.lon
      );
      const tolerance = 0.0001; // 0.1 meter tolerance

      if (Math.abs(testDistance - form.value.distance) < tolerance) {
        pointOnSegment = testPoint;
        break;
      } else if (testDistance < form.value.distance) {
        minFraction = targetFraction;
      } else {
        maxFraction = targetFraction;
      }

      targetFraction = (minFraction + maxFraction) / 2;
      iterations++;
    }

    // If we didn't converge, use the last calculated point
    if (!pointOnSegment) {
      const projX = startProj.x + targetFraction * dx;
      const projY = startProj.y + targetFraction * dy;
      pointOnSegment = mercatorUnproject(projX, projY);
    }
  } else {
    // Binary search from endpoint
    let minFraction = 0;
    let maxFraction = 1;
    let targetFraction = 0.5;
    let iterations = 0;
    const maxIterations = 30;

    while (iterations < maxIterations) {
      const testProjX = endProj.x - targetFraction * dx;
      const testProjY = endProj.y - targetFraction * dy;
      const testPoint = mercatorUnproject(testProjX, testProjY);

      const testDistance = calculateDistance(
        endpoint.lat,
        endpoint.lon,
        testPoint.lat,
        testPoint.lon
      );
      const tolerance = 0.0001; // 0.1 meter tolerance

      if (Math.abs(testDistance - form.value.distance) < tolerance) {
        pointOnSegment = testPoint;
        break;
      } else if (testDistance < form.value.distance) {
        minFraction = targetFraction;
      } else {
        maxFraction = targetFraction;
      }

      targetFraction = (minFraction + maxFraction) / 2;
      iterations++;
    }

    // If we didn't converge, use the last calculated point
    if (!pointOnSegment) {
      const projX = endProj.x - targetFraction * dx;
      const projY = endProj.y - targetFraction * dy;
      pointOnSegment = mercatorUnproject(projX, projY);
    }
  }

  const name = form.value.name.trim() || `Point ${layersStore.pointCount + 1}`;

  drawing.drawPoint(pointOnSegment.lat, pointOnSegment.lon, name);
  uiStore.addToast('Point added successfully!', 'success');
  closeModal();
}

function closeModal() {
  uiStore.closeModal('addPointOnSegmentModal');
  uiStore.setSelectedSegmentForPointCreation(null);
  form.value = {
    name: '',
    distanceFrom: 'start',
    distance: 0,
  };
}
</script>
