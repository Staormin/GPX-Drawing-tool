/**
 * Layers store - Manages drawing layers (circles, lines, points)
 */

import type {
  CircleElement,
  LineSegmentElement,
  NoteElement,
  PointElement,
} from '@/services/storage';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useLayersStore = defineStore('layers', () => {
  // State
  const circles = ref<CircleElement[]>([]);
  const lineSegments = ref<LineSegmentElement[]>([]);
  const points = ref<PointElement[]>([]);
  const notes = ref<NoteElement[]>([]);

  // Map of Leaflet layer IDs for removal
  const leafletIdMap = ref<Map<string, number>>(new Map());

  // Computed
  const isEmpty = computed(
    () => circles.value.length === 0 && lineSegments.value.length === 0 && points.value.length === 0
  );

  const totalCount = computed(
    () => circles.value.length + lineSegments.value.length + points.value.length
  );

  const circleCount = computed(() => circles.value.length);

  const lineSegmentCount = computed(() => lineSegments.value.length);

  const pointCount = computed(() => points.value.length);

  // Sorted layers by creation date (newest first)
  const sortedCircles = computed(() => {
    return circles.value.toSorted((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime; // Newest first
    });
  });

  const sortedLineSegments = computed(() => {
    return lineSegments.value.toSorted((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime; // Newest first
    });
  });

  const sortedPoints = computed(() => {
    return points.value.toSorted((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime; // Newest first
    });
  });

  const noteCount = computed(() => notes.value.length);

  const sortedNotes = computed(() => {
    return notes.value.toSorted((a, b) => {
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      return bTime - aTime; // Most recently updated first
    });
  });

  // Actions
  function addCircle(circle: CircleElement): void {
    // Add timestamp if not present
    if (!circle.createdAt) {
      circle.createdAt = Date.now();
    }
    circles.value.push(circle);
  }

  function updateCircle(id: string | undefined, circle: Partial<CircleElement>): void {
    const index = circles.value.findIndex((c) => c.id === id);
    if (index !== -1 && circles.value[index]) {
      circles.value[index] = { ...circles.value[index], ...circle };
    }
  }

  function deleteCircle(id: string | undefined): void {
    const index = circles.value.findIndex((c) => c.id === id);
    if (index !== -1 && circles.value[index]) {
      const circle = circles.value[index];
      if (circle && circle.leafletId !== undefined) {
        leafletIdMap.value.delete(`circle_${id}`);
      }
      circles.value.splice(index, 1);
    }
  }

  function addLineSegment(segment: LineSegmentElement): void {
    // Add timestamp if not present
    if (!segment.createdAt) {
      segment.createdAt = Date.now();
    }
    lineSegments.value.push(segment);
  }

  function updateLineSegment(id: string | undefined, segment: Partial<LineSegmentElement>): void {
    const index = lineSegments.value.findIndex((s) => s.id === id);
    if (index !== -1 && lineSegments.value[index]) {
      lineSegments.value[index] = {
        ...lineSegments.value[index],
        ...segment,
      } as LineSegmentElement;
    }
  }

  function deleteLineSegment(id: string | undefined): void {
    const index = lineSegments.value.findIndex((s) => s.id === id);
    if (index !== -1 && lineSegments.value[index]) {
      const segment = lineSegments.value[index];
      if (segment && segment.leafletId !== undefined) {
        leafletIdMap.value.delete(`lineSegment_${id}`);
      }
      lineSegments.value.splice(index, 1);
    }
  }

  function addPoint(point: PointElement): void {
    // Add timestamp if not present
    if (!point.createdAt) {
      point.createdAt = Date.now();
    }
    points.value.push(point);
  }

  function updatePoint(id: string | undefined, point: Partial<PointElement>): void {
    const index = points.value.findIndex((p) => p.id === id);
    if (index !== -1 && points.value[index]) {
      points.value[index] = { ...points.value[index], ...point } as PointElement;
    }
  }

  function deletePoint(id: string | undefined): void {
    const index = points.value.findIndex((p) => p.id === id);
    if (index !== -1 && points.value[index]) {
      const point = points.value[index];
      if (point && point.leafletId !== undefined) {
        leafletIdMap.value.delete(`point_${id}`);
      }
      points.value.splice(index, 1);
    }
  }

  /**
   * Helper function to get element by type and id
   */
  function getElement(
    elementType: 'circle' | 'lineSegment' | 'point',
    elementId: string
  ): CircleElement | LineSegmentElement | PointElement | undefined {
    switch (elementType) {
      case 'circle': {
        return circles.value.find((c) => c.id === elementId);
      }
      case 'lineSegment': {
        return lineSegments.value.find((s) => s.id === elementId);
      }
      case 'point': {
        return points.value.find((p) => p.id === elementId);
      }
      default: {
        return undefined;
      }
    }
  }

  function addNote(note: NoteElement): void {
    if (!note.createdAt) {
      note.createdAt = Date.now();
    }
    if (!note.updatedAt) {
      note.updatedAt = Date.now();
    }

    // Maintain bidirectional link: set element.noteId
    if (note.linkedElementType && note.linkedElementId && note.id) {
      const element = getElement(note.linkedElementType, note.linkedElementId);
      if (element) {
        // Check if element already has a note (enforce one-to-one)
        if (element.noteId && element.noteId !== note.id) {
          console.warn(
            `Element ${note.linkedElementId} already has a note. Replacing with new note.`
          );
        }
        element.noteId = note.id;
      }
    }

    notes.value.push(note);
  }

  function updateNote(id: string | undefined, note: Partial<NoteElement>): void {
    const index = notes.value.findIndex((n) => n.id === id);
    if (index !== -1 && notes.value[index]) {
      const oldNote = notes.value[index];
      const updatedNote = {
        ...oldNote,
        ...note,
        updatedAt: Date.now(),
      } as NoteElement;

      // Handle element linking changes
      const oldElementId = oldNote.linkedElementId;
      const oldElementType = oldNote.linkedElementType;
      const newElementId = updatedNote.linkedElementId;
      const newElementType = updatedNote.linkedElementType;

      // If element link changed, update both old and new elements
      if (oldElementId !== newElementId || oldElementType !== newElementType) {
        // Clear old element's noteId
        if (oldElementType && oldElementId) {
          const oldElement = getElement(oldElementType, oldElementId);
          if (oldElement && oldElement.noteId === id) {
            oldElement.noteId = undefined;
          }
        }

        // Set new element's noteId
        if (newElementType && newElementId && updatedNote.id) {
          const newElement = getElement(newElementType, newElementId);
          if (newElement) {
            if (newElement.noteId && newElement.noteId !== updatedNote.id) {
              console.warn(
                `Element ${newElementId} already has a note. Replacing with updated note.`
              );
            }
            newElement.noteId = updatedNote.id;
          }
        }
      }

      notes.value[index] = updatedNote;
    }
  }

  function deleteNote(id: string | undefined): void {
    const index = notes.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      const note = notes.value[index];

      // Clear the linked element's noteId
      if (note && note.linkedElementType && note.linkedElementId) {
        const element = getElement(note.linkedElementType, note.linkedElementId);
        if (element && element.noteId === id) {
          element.noteId = undefined;
        }
      }

      notes.value.splice(index, 1);
    }
  }

  function storeLeafletId(
    elementType: string,
    elementId: string | undefined,
    leafletId: number
  ): void {
    const key = `${elementType}_${elementId}`;
    leafletIdMap.value.set(key, leafletId);
  }

  function getLeafletId(elementType: string, elementId: string | undefined): number | undefined {
    const key = `${elementType}_${elementId}`;
    return leafletIdMap.value.get(key);
  }

  function clearLayers(): void {
    circles.value = [];
    lineSegments.value = [];
    points.value = [];
    notes.value = [];
    leafletIdMap.value.clear();
  }

  /**
   * Validate and sanitize element data before loading
   */
  function validateCircle(circle: any): circle is CircleElement {
    return (
      circle &&
      typeof circle.id === 'string' &&
      typeof circle.name === 'string' &&
      circle.center &&
      typeof circle.center.lat === 'number' &&
      typeof circle.center.lon === 'number' &&
      typeof circle.radius === 'number' &&
      !Number.isNaN(circle.center.lat) &&
      !Number.isNaN(circle.center.lon) &&
      !Number.isNaN(circle.radius) &&
      circle.radius > 0
    );
  }

  function validateLineSegment(segment: any): segment is LineSegmentElement {
    if (
      !segment ||
      typeof segment.id !== 'string' ||
      typeof segment.name !== 'string' ||
      !segment.center ||
      typeof segment.center.lat !== 'number' ||
      typeof segment.center.lon !== 'number' ||
      !segment.mode
    ) {
      return false;
    }

    // Special validation for parallel lines
    if (segment.mode === 'parallel') {
      return typeof segment.longitude === 'number' && !Number.isNaN(segment.longitude);
    }

    // Regular line segments need endpoint
    return (
      segment.endpoint &&
      typeof segment.endpoint.lat === 'number' &&
      typeof segment.endpoint.lon === 'number' &&
      !Number.isNaN(segment.endpoint.lat) &&
      !Number.isNaN(segment.endpoint.lon)
    );
  }

  function validatePoint(point: any): point is PointElement {
    return (
      point &&
      typeof point.id === 'string' &&
      typeof point.name === 'string' &&
      point.coordinates &&
      typeof point.coordinates.lat === 'number' &&
      typeof point.coordinates.lon === 'number' &&
      !Number.isNaN(point.coordinates.lat) &&
      !Number.isNaN(point.coordinates.lon)
    );
  }

  function validateNote(note: any): note is NoteElement {
    return (
      note &&
      typeof note.id === 'string' &&
      typeof note.title === 'string' &&
      typeof note.content === 'string'
    );
  }

  function loadLayers(data: {
    circles: CircleElement[];
    lineSegments: LineSegmentElement[];
    points: PointElement[];
    notes?: NoteElement[];
  }): void {
    clearLayers();

    // Validate and filter data before loading
    const validCircles = (data.circles || []).filter((circle) => {
      const isValid = validateCircle(circle);
      if (!isValid) {
        console.warn('Invalid circle data detected and skipped:', circle);
      }
      return isValid;
    });

    const validLineSegments = (data.lineSegments || []).filter((segment) => {
      const isValid = validateLineSegment(segment);
      if (!isValid) {
        console.warn('Invalid line segment data detected and skipped:', segment);
      }
      return isValid;
    });

    const validPoints = (data.points || []).filter((point) => {
      const isValid = validatePoint(point);
      if (!isValid) {
        console.warn('Invalid point data detected and skipped:', point);
      }
      return isValid;
    });

    const validNotes = (data.notes || []).filter((note) => {
      const isValid = validateNote(note);
      if (!isValid) {
        console.warn('Invalid note data detected and skipped:', note);
      }
      return isValid;
    });

    circles.value = [...validCircles];
    lineSegments.value = [...validLineSegments];
    points.value = [...validPoints];
    notes.value = [...validNotes];
  }

  function exportLayers() {
    return {
      circles: circles.value,
      lineSegments: lineSegments.value,
      points: points.value,
      notes: notes.value,
    };
  }

  return {
    // State
    circles,
    lineSegments,
    points,
    notes,
    leafletIdMap,

    // Computed
    isEmpty,
    totalCount,
    circleCount,
    lineSegmentCount,
    pointCount,
    noteCount,
    sortedCircles,
    sortedLineSegments,
    sortedPoints,
    sortedNotes,

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
    addNote,
    updateNote,
    deleteNote,
    storeLeafletId,
    getLeafletId,
    clearLayers,
    loadLayers,
    exportLayers,
  };
});
