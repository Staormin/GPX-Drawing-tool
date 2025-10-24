<template>
  <div class="drawing-tools">
    <!-- Header -->
    <h3 class="sidebar-section-title">Drawing Tools</h3>

    <!-- Buttons -->
    <div class="drawing-buttons">
      <button
        class="btn-tool"
        title="Add a new circle"
        @click="openCircleModal"
      >
        🔵 Circle
      </button>
      <button
        class="btn-tool"
        title="Add a new line segment"
        @click="openLineSegmentModal"
      >
        ➖ Line
      </button>
      <button
        class="btn-tool"
        title="Add a new point"
        @click="openPointModal"
      >
        📍 Point
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()

  const openCircleModal = () => uiStore.openModal('circleModal')
  const openLineSegmentModal = () => uiStore.openModal('lineSegmentModal')
  const openPointModal = () => uiStore.openModal('pointModal')
</script>

<style scoped>
.drawing-tools {
  padding: 8px 4px;
}

.sidebar-section-title {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
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
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(148, 163, 184, 0.08);
  color: #f1f5f9;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.25s ease;
}

.btn-tool:hover {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35), 0 8px 24px rgba(0, 0, 0, 0.25);
}

.btn-tool:active {
  transform: scale(0.98);
}
</style>
