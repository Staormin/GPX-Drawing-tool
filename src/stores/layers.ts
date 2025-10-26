/**
 * Layers store - Manages drawing layers (circles, lines, points)
 */

import type { CircleElement, LineSegmentElement, PointElement } from '@/services/storage'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLayersStore = defineStore('layers', () => {
  // State
  const circles = ref<CircleElement[]>([])
  const lineSegments = ref<LineSegmentElement[]>([])
  const points = ref<PointElement[]>([])

  // Map of Leaflet layer IDs for removal
  const leafletIdMap = ref<Map<string, number>>(new Map())

  // Computed
  const isEmpty = computed(() => circles.value.length === 0 && lineSegments.value.length === 0 && points.value.length === 0)

  const totalCount = computed(() => circles.value.length + lineSegments.value.length + points.value.length)

  const circleCount = computed(() => circles.value.length)

  const lineSegmentCount = computed(() => lineSegments.value.length)

  const pointCount = computed(() => points.value.length)

  // Actions
  function addCircle (circle: CircleElement): void {
    circles.value.push(circle)
  }

  function updateCircle (id: string | undefined, circle: Partial<CircleElement>): void {
    const index = circles.value.findIndex(c => c.id === id)
    if (index !== -1 && circles.value[index]) {
      circles.value[index] = { ...circles.value[index], ...circle }
    }
  }

  function deleteCircle (id: string | undefined): void {
    const index = circles.value.findIndex(c => c.id === id)
    if (index !== -1 && circles.value[index]) {
      const circle = circles.value[index]
      if (circle && circle.leafletId !== undefined) {
        leafletIdMap.value.delete(`circle_${id}`)
      }
      circles.value.splice(index, 1)
    }
  }

  function addLineSegment (segment: LineSegmentElement): void {
    lineSegments.value.push(segment)
  }

  function updateLineSegment (id: string | undefined, segment: Partial<LineSegmentElement>): void {
    const index = lineSegments.value.findIndex(s => s.id === id)
    if (index !== -1 && lineSegments.value[index]) {
      lineSegments.value[index] = { ...lineSegments.value[index], ...segment } as LineSegmentElement
    }
  }

  function deleteLineSegment (id: string | undefined): void {
    const index = lineSegments.value.findIndex(s => s.id === id)
    if (index !== -1 && lineSegments.value[index]) {
      const segment = lineSegments.value[index]
      if (segment && segment.leafletId !== undefined) {
        leafletIdMap.value.delete(`lineSegment_${id}`)
      }
      lineSegments.value.splice(index, 1)
    }
  }

  function addPoint (point: PointElement): void {
    points.value.push(point)
  }

  function updatePoint (id: string | undefined, point: Partial<PointElement>): void {
    const index = points.value.findIndex(p => p.id === id)
    if (index !== -1 && points.value[index]) {
      points.value[index] = { ...points.value[index], ...point } as PointElement
    }
  }

  function deletePoint (id: string | undefined): void {
    const index = points.value.findIndex(p => p.id === id)
    if (index !== -1 && points.value[index]) {
      const point = points.value[index]
      if (point && point.leafletId !== undefined) {
        leafletIdMap.value.delete(`point_${id}`)
      }
      points.value.splice(index, 1)
    }
  }

  function storeLeafletId (elementType: string, elementId: string | undefined, leafletId: number): void {
    const key = `${elementType}_${elementId}`
    leafletIdMap.value.set(key, leafletId)
  }

  function getLeafletId (elementType: string, elementId: string | undefined): number | undefined {
    const key = `${elementType}_${elementId}`
    return leafletIdMap.value.get(key)
  }

  function clearLayers (): void {
    circles.value = []
    lineSegments.value = []
    points.value = []
    leafletIdMap.value.clear()
  }

  function loadLayers (data: {
    circles: CircleElement[]
    lineSegments: LineSegmentElement[]
    points: PointElement[]
  }): void {
    clearLayers()
    // Use spread operator instead of structuredClone to avoid DataCloneError
    // Data from storage is already plain JSON, no need for deep cloning
    circles.value = [...(data.circles || [])]
    lineSegments.value = [...(data.lineSegments || [])]
    points.value = [...(data.points || [])]
  }

  function exportLayers () {
    return {
      circles: circles.value,
      lineSegments: lineSegments.value,
      points: points.value,
    }
  }

  return {
    // State
    circles,
    lineSegments,
    points,
    leafletIdMap,

    // Computed
    isEmpty,
    totalCount,
    circleCount,
    lineSegmentCount,
    pointCount,

    // Actions
    addCircle,
    updateCircle,
    deleteCircle,
    addLineSegment,
    updateLineSegment,
    deleteLineSegment,
    addPoint,
    updatePoint,
    deletePoint,
    storeLeafletId,
    getLeafletId,
    clearLayers,
    loadLayers,
    exportLayers,
  }
})
