<template>
  <div v-if="uiStore.navigatingElement" class="navigation-bar">
    <div class="navigation-bar-content">
      <div class="navigation-instructions">
        <span class="navigation-icon">🧭</span>
        <span class="navigation-text">
          Use <strong>← →</strong> arrow keys to navigate • Press <strong>ESC</strong> to exit
        </span>
      </div>
      <button class="navigation-exit-btn" type="button" @click="handleExitNavigation">
        Exit Navigation
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();

function handleExitNavigation(): void {
  uiStore.stopNavigating();
}
</script>

<style scoped>
.navigation-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(59, 130, 246, 0.95);
  border-bottom: 2px solid rgba(59, 130, 246, 1);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.navigation-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1200px;
  width: 100%;
}

.navigation-instructions {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.navigation-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.navigation-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.navigation-text strong {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.navigation-exit-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.navigation-exit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.navigation-exit-btn:active {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .navigation-bar-content {
    gap: 16px;
  }

  .navigation-instructions {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .navigation-text {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
