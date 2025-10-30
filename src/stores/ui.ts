/**
 * UI store - Manages UI state, modals, and notifications
 */

import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref } from 'vue';

export type DrawingMode = 'circle' | 'line' | 'point' | 'intersection' | 'none';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface EditingElement {
  type: 'circle' | 'lineSegment' | 'point';
  id: string;
}

export interface CreatingElement {
  type: 'circle' | 'lineSegment' | 'point';
}

export interface NavigatingElement {
  type: 'circle' | 'lineSegment';
  id: string;
}

export interface SearchAlongPanel {
  isOpen: boolean;
  elementType: 'lineSegment' | 'point' | null;
  elementId: string | null;
}

export interface FreeHandDrawing {
  isDrawing: boolean;
  startCoord: string | null;
  azimuth: number | undefined;
  name: string;
}

export const useUIStore = defineStore('ui', () => {
  // State
  const openModals = ref<Set<string>>(new Set());
  const drawingMode = ref<DrawingMode>('none');
  const toasts = ref<Toast[]>([]);
  const isLoading = ref(false);
  const selectedProjectIndex = ref<number | null>(null);
  const sidebarOpen = ref(true);
  const leftSidebarOpen = ref(false);
  const coordinatesFormData = ref<{ name: string; coordinates: string } | null>(null);
  const elementVisibility = ref<Record<string, boolean>>({});
  const editingElement = ref<EditingElement | null>(null);
  const selectedSegmentForPointCreation = ref<string | null>(null);
  const creatingElement = ref<CreatingElement | null>(null);
  const circleCenterPreFill = ref<{ lat: number; lon: number } | null>(null);
  const lineSegmentStartPreFill = ref<{ lat: number; lon: number } | null>(null);
  const lineSegmentEndPreFill = ref<{ lat: number; lon: number } | null>(null);
  const navigatingElement = ref<NavigatingElement | null>(null);
  const showTutorial = ref(false);
  const searchAlongPanel = ref<SearchAlongPanel>({
    isOpen: false,
    elementType: null,
    elementId: null,
  });
  const freeHandDrawing = ref<FreeHandDrawing>({
    isDrawing: false,
    startCoord: null,
    azimuth: undefined,
    name: '',
  });

  // Computed
  const isModalOpen = computed(() => (modalId: string) => openModals.value.has(modalId));

  const activeToastCount = computed(() => toasts.value.length);

  // Actions
  function openModal(modalId: string): void {
    openModals.value.add(modalId);
  }

  function closeModal(modalId: string): void {
    openModals.value.delete(modalId);
  }

  function closeAllModals(): void {
    openModals.value.clear();
  }

  function toggleModal(modalId: string): void {
    if (openModals.value.has(modalId)) {
      closeModal(modalId);
    } else {
      openModal(modalId);
    }
  }

  function setDrawingMode(mode: DrawingMode): void {
    drawingMode.value = mode;
  }

  function resetDrawingMode(): void {
    drawingMode.value = 'none';
  }

  function addToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    duration = 3000
  ): void {
    const id = uuidv4();
    const toast: Toast = { id, message, type, duration };
    toasts.value.push(toast);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(toastId: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== toastId);
  }

  function clearAllToasts(): void {
    toasts.value = [];
  }

  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  function setSelectedProjectIndex(index: number | null): void {
    selectedProjectIndex.value = index;
  }

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function setSidebarOpen(open: boolean): void {
    sidebarOpen.value = open;
  }

  function toggleLeftSidebar(): void {
    leftSidebarOpen.value = !leftSidebarOpen.value;
  }

  function setLeftSidebarOpen(open: boolean): void {
    leftSidebarOpen.value = open;
  }

  function setCoordinatesFormData(data: { name: string; coordinates: string } | null): void {
    coordinatesFormData.value = data;
  }

  function toggleElementVisibility(elementType: string, elementId: string): void {
    const key = `${elementType}_${elementId}`;
    elementVisibility.value[key] = !isElementVisible(elementType, elementId);
  }

  function isElementVisible(elementType: string, elementId: string): boolean {
    const key = `${elementType}_${elementId}`;
    // Default to visible if not explicitly set to false
    return elementVisibility.value[key] !== false;
  }

  function setElementVisibility(elementType: string, elementId: string, visible: boolean): void {
    const key = `${elementType}_${elementId}`;
    elementVisibility.value[key] = visible;
  }

  function startEditing(type: 'circle' | 'lineSegment' | 'point', id: string): void {
    editingElement.value = { type, id };
  }

  function stopEditing(): void {
    editingElement.value = null;
  }

  function isEditing(type: 'circle' | 'lineSegment' | 'point', id: string): boolean {
    return editingElement.value?.type === type && editingElement.value?.id === id;
  }

  function setSelectedSegmentForPointCreation(segmentId: string | null): void {
    selectedSegmentForPointCreation.value = segmentId;
  }

  function startCreating(type: 'circle' | 'lineSegment' | 'point'): void {
    creatingElement.value = { type };
  }

  function stopCreating(): void {
    creatingElement.value = null;
    circleCenterPreFill.value = null;
    lineSegmentStartPreFill.value = null;
    lineSegmentEndPreFill.value = null;
  }

  function setCircleCenter(lat: number, lon: number): void {
    circleCenterPreFill.value = { lat, lon };
  }

  function setLineSegmentStart(lat: number, lon: number): void {
    lineSegmentStartPreFill.value = { lat, lon };
  }

  function setLineSegmentEnd(lat: number, lon: number): void {
    lineSegmentEndPreFill.value = { lat, lon };
  }

  function startNavigating(type: 'circle' | 'lineSegment', id: string): void {
    navigatingElement.value = { type, id };
    sidebarOpen.value = false;
  }

  function stopNavigating(): void {
    navigatingElement.value = null;
  }

  function isNavigating(type: 'circle' | 'lineSegment', id: string): boolean {
    return navigatingElement.value?.type === type && navigatingElement.value?.id === id;
  }

  function setShowTutorial(show: boolean): void {
    showTutorial.value = show;
  }

  function openSearchAlong(elementType: 'lineSegment' | 'point', elementId: string): void {
    searchAlongPanel.value = {
      isOpen: true,
      elementType,
      elementId,
    };
  }

  function closeSearchAlong(): void {
    searchAlongPanel.value = {
      isOpen: false,
      elementType: null,
      elementId: null,
    };
  }

  function startFreeHandDrawing(
    startCoord: string | null,
    azimuth: number | undefined,
    name: string
  ): void {
    freeHandDrawing.value = {
      isDrawing: true,
      startCoord,
      azimuth,
      name,
    };
    sidebarOpen.value = false;
  }

  function stopFreeHandDrawing(): void {
    freeHandDrawing.value = {
      isDrawing: false,
      startCoord: null,
      azimuth: undefined,
      name: '',
    };
  }

  return {
    // State
    openModals,
    drawingMode,
    toasts,
    isLoading,
    selectedProjectIndex,
    sidebarOpen,
    leftSidebarOpen,
    coordinatesFormData,
    elementVisibility,
    editingElement,
    selectedSegmentForPointCreation,
    creatingElement,
    circleCenterPreFill,
    lineSegmentStartPreFill,
    lineSegmentEndPreFill,
    navigatingElement,
    showTutorial,
    searchAlongPanel,
    freeHandDrawing,

    // Computed
    isModalOpen,
    activeToastCount,

    // Actions
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,
    setDrawingMode,
    resetDrawingMode,
    addToast,
    removeToast,
    clearAllToasts,
    setLoading,
    setSelectedProjectIndex,
    toggleSidebar,
    setSidebarOpen,
    toggleLeftSidebar,
    setLeftSidebarOpen,
    setCoordinatesFormData,
    toggleElementVisibility,
    isElementVisible,
    setElementVisibility,
    startEditing,
    stopEditing,
    isEditing,
    setSelectedSegmentForPointCreation,
    startCreating,
    stopCreating,
    setCircleCenter,
    setLineSegmentStart,
    setLineSegmentEnd,
    startNavigating,
    stopNavigating,
    isNavigating,
    setShowTutorial,
    openSearchAlong,
    closeSearchAlong,
    startFreeHandDrawing,
    stopFreeHandDrawing,
  };
});
