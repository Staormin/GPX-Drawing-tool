<template>
  <div class="drawing-tools">
    <!-- Header -->
    <h3 class="sidebar-section-title">Drawing Tools</h3>

    <!-- Buttons -->
    <div class="drawing-buttons">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <button class="btn-tool" v-bind="props" @click="openCircleModal">🔵 Circle</button>
        </template>
        <span>Add a new circle <kbd class="kbd-hint">C</kbd></span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <button class="btn-tool" v-bind="props" @click="openLineSegmentModal">➖ Line</button>
        </template>
        <span>Add a new line segment <kbd class="kbd-hint">L</kbd></span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <button class="btn-tool" v-bind="props" @click="openPointModal">📍 Point</button>
        </template>
        <span>Add a new point <kbd class="kbd-hint">P</kbd></span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();

const openCircleModal = () => uiStore.openModal('circleModal');
const openLineSegmentModal = () => uiStore.openModal('lineSegmentModal');
const openPointModal = () => uiStore.openModal('pointModal');
</script>

<style scoped>
.drawing-tools {
  padding: 8px 4px;
}

.sidebar-section-title {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 0 8px 4px;
  font-weight: 600;
}

.drawing-buttons {
  display: flex;
  gap: 8px;
}

.btn-tool {
  flex: 1;
  padding: 12px 14px;
  border-radius: 4px;
  border: none;
  background: rgb(var(--v-theme-surface-bright));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s ease;
}

.btn-tool:hover {
  background: rgb(var(--v-theme-surface-variant));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-tool:active {
  transform: scale(0.98);
}
</style>
