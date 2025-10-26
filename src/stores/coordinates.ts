/**
 * Coordinates store - Manages saved coordinates
 */

import type { SavedCoordinate } from '@/services/storage'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as storage from '@/services/storage'

export const useCoordinatesStore = defineStore('coordinates', () => {
  // State
  const savedCoordinates = ref<SavedCoordinate[]>([])

  // Computed
  const coordinateCount = computed(() => savedCoordinates.value.length)

  const sortedCoordinates = computed(() => {
    return [...savedCoordinates.value].toSorted((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
  })

  // Actions
  function loadCoordinates (): void {
    savedCoordinates.value = storage.getSavedCoordinates()
  }

  function addCoordinate (name: string, lat: number, lon: number, id?: string): SavedCoordinate {
    const coord = id
      ? { id, name, lat, lon, timestamp: Date.now() }
      : storage.saveCoordinate(name, lat, lon)

    // If we have a custom ID, we need to save it directly
    if (id) {
      const coordinates = storage.getSavedCoordinates()
      coordinates.push(coord)
      storage.saveCoordinates(coordinates)
    }

    loadCoordinates()
    return coord
  }

  function deleteCoordinate (id: string): void {
    storage.deleteCoordinate(id)
    loadCoordinates()
  }

  function updateCoordinate (id: string, name: string, lat: number, lon: number): void {
    storage.updateCoordinate(id, name, lat, lon)
    loadCoordinates()
  }

  function clearAllCoordinates (): void {
    storage.clearAllCoordinates()
    savedCoordinates.value = []
  }

  function getCoordinate (id: string): SavedCoordinate | undefined {
    return savedCoordinates.value.find(c => c.id === id)
  }

  // Initialize on store creation
  loadCoordinates()

  return {
    // State
    savedCoordinates,

    // Computed
    coordinateCount,
    sortedCoordinates,

    // Actions
    loadCoordinates,
    addCoordinate,
    deleteCoordinate,
    updateCoordinate,
    clearAllCoordinates,
    getCoordinate,
  }
})
