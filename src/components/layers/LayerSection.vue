<template>
  <div v-if="items.length > 0">
    <div class="layers-section-header" @click="$emit('toggle')">
      <span class="layers-section-title"
        >{{ title }} ({{ items.length }}{{ searchQuery ? ` of ${totalCount}` : '' }})</span
      >
      <span class="collapse-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </div>
    <div v-show="isExpanded" class="layer-items">
      <slot :items="items" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  items: any[];
  totalCount: number;
  searchQuery: string;
  isExpanded: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
.layers-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  user-select: none;
}

.layers-section-header:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

.layers-section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.collapse-icon {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: transform 0.2s;
}

.layer-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
</style>
