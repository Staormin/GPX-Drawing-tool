<template>
  <div
    class="layer-item"
    :class="{
      'layer-item-hidden': !isVisible,
      'drag-over': isDragOver,
    }"
    :draggable="draggable"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @dragenter.prevent
    @dragleave="$emit('dragleave', $event)"
    @drop.prevent="$emit('drop', $event)"
    @click="$emit('click', $event)"
  >
    <div class="layer-item-info">
      <div class="layer-item-name">{{ name }}</div>
      <div class="layer-item-type">{{ subtitle }}</div>
    </div>
    <div class="layer-item-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  name: string;
  subtitle: string;
  isVisible: boolean;
  isDragOver?: boolean;
  draggable?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
  dragstart: [event: DragEvent];
  dragend: [event: DragEvent];
  dragover: [event: DragEvent];
  dragleave: [event: DragEvent];
  drop: [event: DragEvent];
}>();
</script>

<style scoped>
.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.layer-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  border-color: rgba(var(--v-theme-on-surface), 0.12);
}

.layer-item-hidden {
  opacity: 0.4;
}

.layer-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-item-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.87);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-item-type {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Drag and drop styles */
.layer-item[draggable='true'] {
  cursor: pointer;
}

.layer-item.drag-over {
  background: rgba(var(--v-theme-primary), 0.15) !important;
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  border-radius: 4px;
  padding-left: 4px;
  padding-right: 4px;
}
</style>
