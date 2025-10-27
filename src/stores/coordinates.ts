/**
 * Coordinates store - Manages saved coordinates per project
 */

import type { SavedCoordinate } from '@/services/storage';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref } from 'vue';

export const useCoordinatesStore = defineStore('coordinates', () => {
  // State - coordinates are now stored in-memory per project (not global localStorage)
  const savedCoordinates = ref<SavedCoordinate[]>([]);

  // Computed
  const coordinateCount = computed(() => savedCoordinates.value.length);

  const sortedCoordinates = computed(() => {
    return [...savedCoordinates.value].toSorted(
      (a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)
    );
  });

  // Actions
  function addCoordinate(name: string, lat: number, lon: number, id?: string): SavedCoordinate {
    const coord: SavedCoordinate = {
      id: id || uuidv4(),
      name,
      lat,
      lon,
      timestamp: Date.now(),
    };
    savedCoordinates.value.push(coord);
    return coord;
  }

  function deleteCoordinate(id: string): void {
    const index = savedCoordinates.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      savedCoordinates.value.splice(index, 1);
    }
  }

  function updateCoordinate(id: string, name: string, lat: number, lon: number): void {
    const coord = savedCoordinates.value.find((c) => c.id === id);
    if (coord) {
      coord.name = name;
      coord.lat = lat;
      coord.lon = lon;
    }
  }

  function clearCoordinates(): void {
    savedCoordinates.value = [];
  }

  function loadCoordinates(coordinates: SavedCoordinate[]): void {
    savedCoordinates.value = [...coordinates];
  }

  function getCoordinate(id: string): SavedCoordinate | undefined {
    return savedCoordinates.value.find((c) => c.id === id);
  }

  return {
    // State
    savedCoordinates,

    // Computed
    coordinateCount,
    sortedCoordinates,

    // Actions
    addCoordinate,
    deleteCoordinate,
    updateCoordinate,
    clearCoordinates,
    loadCoordinates,
    getCoordinate,
  };
});
