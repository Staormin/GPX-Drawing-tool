<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showCountdown" class="countdown-overlay">
        <Transition mode="out-in" name="scale">
          <div :key="countdown" class="countdown-number">
            {{ countdown }}
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();

const showCountdown = computed(() => uiStore.animationState.countdown > 0);
const countdown = computed(() => uiStore.animationState.countdown);
</script>

<style scoped>
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  pointer-events: none;
}

.countdown-number {
  color: white;
  font-size: 200px;
  font-weight: bold;
  line-height: 1;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.5s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(1.5);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
