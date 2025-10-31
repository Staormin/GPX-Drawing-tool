/**
 * Composable for displaying note tooltips on the map
 * Uses Leaflet's bindTooltip API to attach permanent tooltips to existing layers
 */

import type { NoteElement } from '@/services/storage';
import L from 'leaflet';
import { watch } from 'vue';
import { useLayersStore } from '@/stores/layers';
import { useUIStore } from '@/stores/ui';

const MIN_ZOOM_FOR_NOTES = 12; // Show notes only at zoom level 12 or higher

export function useNoteTooltips(mapRef: any) {
  const layersStore = useLayersStore();
  const uiStore = useUIStore();

  // Track which notes have tooltips bound
  const boundNotes = new Set<string>();

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function handleNoteClick(noteId: string) {
    uiStore.startEditing('note', noteId);
    uiStore.openModal('noteModal');
  }

  /**
   * Get the Leaflet layer for a given element
   */
  function getElementLayer(note: NoteElement): L.Layer | null {
    if (!note.linkedElementType || !note.linkedElementId || !mapRef.map?.value) {
      return null;
    }

    const leafletId = layersStore.getLeafletId(note.linkedElementType, note.linkedElementId);
    if (!leafletId) return null;

    let foundLayer: L.Layer | null = null;
    mapRef.map.value.eachLayer((layer: any) => {
      if (L.stamp(layer) === leafletId) {
        foundLayer = layer;
      }
    });

    return foundLayer;
  }

  /**
   * Bind a permanent tooltip to a layer for the given note
   */
  function bindNoteTooltip(note: NoteElement) {
    if (!mapRef.map?.value || !note.id) return;

    const layer = getElementLayer(note);
    if (!layer || !('bindTooltip' in layer)) return;

    // Don't bind if already bound
    if (boundNotes.has(note.id)) return;

    // Escape text (no truncation for full display)
    const safeTitle = escapeHtml(note.title);
    const safeContent = note.content ? escapeHtml(note.content) : '';

    // Create tooltip HTML
    const tooltipContent = `
      <div class="note-tooltip-card" data-note-id="${note.id}">
        <div class="note-tooltip-icon">📝</div>
        <div class="note-tooltip-content">
          <div class="note-tooltip-title">${safeTitle}</div>
          ${safeContent ? `<div class="note-tooltip-text">${safeContent}</div>` : ''}
        </div>
      </div>
    `;

    // Bind permanent tooltip to the layer
    (layer as any).bindTooltip(tooltipContent, {
      permanent: true,
      direction: 'right',
      className: 'note-tooltip',
      offset: [15, 0],
      interactive: true,
    });

    boundNotes.add(note.id);

    // Add click handler after tooltip is rendered
    setTimeout(() => {
      const tooltip = (layer as any).getTooltip();
      if (tooltip) {
        const tooltipElement = tooltip.getElement();
        if (tooltipElement) {
          const cardElement = tooltipElement.querySelector('.note-tooltip-card');
          if (cardElement) {
            cardElement.addEventListener('click', () => {
              handleNoteClick(note.id!);
            });
          }
        }
      }
    }, 0);
  }

  /**
   * Unbind tooltip from a layer for the given note
   */
  function unbindNoteTooltip(noteId: string) {
    if (!mapRef.map?.value) {
      boundNotes.delete(noteId);
      return;
    }

    // First, try to find the note to get its element info
    const note = layersStore.notes.find((n) => n.id === noteId);

    if (note) {
      // Note still exists - use it to find the layer
      const layer = getElementLayer(note);
      if (layer && 'unbindTooltip' in layer) {
        (layer as any).unbindTooltip();
      }
    } else {
      // Note was deleted - search all map layers for tooltips containing this noteId
      mapRef.map.value.eachLayer((layer: any) => {
        if ('getTooltip' in layer) {
          const tooltip = layer.getTooltip();
          if (tooltip) {
            const tooltipElement = tooltip.getElement();
            if (tooltipElement) {
              const cardElement = tooltipElement.querySelector(`[data-note-id="${noteId}"]`);
              if (cardElement) {
                // This layer has the tooltip for the deleted note
                layer.unbindTooltip();
              }
            }
          }
        }
      });
    }

    boundNotes.delete(noteId);
  }

  /**
   * Update all note tooltips based on current zoom level
   */
  function updateNoteTooltips() {
    if (!mapRef.map?.value) return;

    const currentZoom = mapRef.map.value.getZoom();
    const linkedNotes = layersStore.notes.filter(
      (note) => note.linkedElementType && note.linkedElementId
    );

    if (currentZoom >= MIN_ZOOM_FOR_NOTES) {
      // Show tooltips for notes at this zoom level
      for (const note of linkedNotes) {
        if (note.id && !boundNotes.has(note.id)) {
          bindNoteTooltip(note);
        }
      }

      // Remove tooltips for notes that no longer exist
      for (const noteId of boundNotes) {
        if (!linkedNotes.some((n) => n.id === noteId)) {
          unbindNoteTooltip(noteId);
        }
      }
    } else {
      // Hide all tooltips when zoomed out
      for (const noteId of Array.from(boundNotes)) {
        unbindNoteTooltip(noteId);
      }
    }
  }

  /**
   * Refresh a specific note tooltip (e.g., after editing)
   */
  function refreshNoteTooltip(noteId: string) {
    const note = layersStore.notes.find((n) => n.id === noteId);

    if (!note) {
      unbindNoteTooltip(noteId);
      return;
    }

    // Unbind and rebind to update content
    unbindNoteTooltip(noteId);

    const currentZoom = mapRef.map?.value?.getZoom();

    if (mapRef.map?.value && currentZoom && currentZoom >= MIN_ZOOM_FOR_NOTES) {
      bindNoteTooltip(note);
    }
  }

  /**
   * Clear all tooltips
   */
  function clearAllTooltips() {
    for (const noteId of Array.from(boundNotes)) {
      unbindNoteTooltip(noteId);
    }
    boundNotes.clear();
  }

  // Watch for zoom changes to show/hide tooltips based on zoom level
  if (mapRef.map?.value) {
    mapRef.map.value.on('zoomend', () => {
      updateNoteTooltips();
    });
  }

  // Watch for changes in notes (add/edit/delete)
  watch(
    () => layersStore.notes,
    () => {
      updateNoteTooltips();
    },
    { deep: true }
  );

  // Initial update
  if (mapRef.map?.value) {
    updateNoteTooltips();
  }

  return {
    updateNoteTooltips,
    refreshNoteTooltip,
    clearAllTooltips,
    bindNoteTooltip,
    unbindNoteTooltip,
  };
}
