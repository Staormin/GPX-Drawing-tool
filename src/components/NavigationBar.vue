<template>
  <!-- Navigation Mode -->
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

  <!-- Free Hand Drawing Mode -->
  <div v-else-if="uiStore.freeHandDrawing.isDrawing" class="navigation-bar">
    <div class="navigation-bar-content">
      <div class="navigation-instructions">
        <span class="navigation-icon">✏️</span>
        <span class="navigation-text">
          <template v-if="!uiStore.freeHandDrawing.startCoord">
            Click to set start point
          </template>
          <template v-else>
            Move mouse to set endpoint • Click to confirm
          </template>
          • Press <strong>ESC</strong> to cancel
        </span>
      </div>
      <button class="navigation-exit-btn" type="button" @click="handleExitFreeHand">
        Cancel Drawing
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

function handleExitFreeHand(): void {
  uiStore.stopFreeHandDrawing();
}
</script>

<style scoped>
.navigation-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgb(var(--v-theme-primary));
  border-bottom: none;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.navigation-exit-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.navigation-exit-btn:active {
  background: rgba(255, 255, 255, 0.3);
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
