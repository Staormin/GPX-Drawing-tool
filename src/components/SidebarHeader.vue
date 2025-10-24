<template>
  <div class="sidebar-header">
    <img alt="GeoSketch Logo" class="logo-image" src="@/assets/logo.png">
    <div class="logo-text">
      <h1 class="app-title">GeoSketch</h1>
      <p class="app-subtitle">Map Drawing Tool</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.logo-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #f1f5f9;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 12px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.2;
}
</style>
