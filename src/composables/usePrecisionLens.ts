/**
 * Composable for precision lens mode
 * Shows a magnified view of the map area under the cursor when activated
 */

import L from 'leaflet';
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface PrecisionLensOptions {
  lensSize?: number; // Diameter of the lens in pixels
  offsetY?: number; // Vertical offset above cursor
  magnification?: number; // Magnification factor (e.g., 2 = 2x larger)
}

export function usePrecisionLens(mapRef: any, options: PrecisionLensOptions = {}) {
  const { lensSize = 200, offsetY = -220, magnification = 2.5 } = options;

  const isActive = ref(false);
  const lensElement = ref<HTMLElement | null>(null);
  const lensMap = ref<L.Map | null>(null);
  const currentMousePos = ref<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Create the lens DOM element and mini map
   */
  function createLens() {
    if (lensElement.value || !mapRef.map?.value) return;

    // Create lens container
    const lens = document.createElement('div');
    lens.className = 'precision-lens';
    lens.style.cssText = `
      position: fixed;
      width: ${lensSize}px;
      height: ${lensSize}px;
      border-radius: 50%;
      border: 3px solid var(--accent);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5), 0 10px 30px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
      display: none;
      background: var(--bg);
    `;

    // Create crosshair in center
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      pointer-events: none;
      z-index: 10001;
    `;
    crosshair.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0.8"/>
        <line x1="10" y1="2" x2="10" y2="8" stroke="var(--accent)" stroke-width="1.5" opacity="0.8"/>
        <line x1="10" y1="12" x2="10" y2="18" stroke="var(--accent)" stroke-width="1.5" opacity="0.8"/>
        <line x1="2" y1="10" x2="8" y2="10" stroke="var(--accent)" stroke-width="1.5" opacity="0.8"/>
        <line x1="12" y1="10" x2="18" y2="10" stroke="var(--accent)" stroke-width="1.5" opacity="0.8"/>
        <circle cx="10" cy="10" r="1.5" fill="var(--accent)"/>
      </svg>
    `;

    // Create map container inside lens
    // Make it smaller than the lens, then scale it up to create magnification effect
    const scaledSize = lensSize / magnification;
    const mapContainer = document.createElement('div');
    mapContainer.className = 'precision-lens-map';
    mapContainer.style.cssText = `
      width: ${scaledSize}px;
      height: ${scaledSize}px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(${magnification});
      transform-origin: center center;
    `;

    lens.append(mapContainer);
    lens.append(crosshair);
    document.body.append(lens);

    lensElement.value = lens;

    // Initialize mini map
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
    const miniMap = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    // Copy tile layer from main map
    const mainMap = mapRef.map.value;
    mainMap.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        const tileUrl = (layer as any)._url;
        L.tileLayer(tileUrl, {
          ...layer.options,
        }).addTo(miniMap);
      }
    });

    lensMap.value = miniMap;

    // Invalidate size after DOM is ready to ensure proper rendering
    setTimeout(() => {
      miniMap.invalidateSize();
    }, 0);
  }

  /**
   * Update lens position and map view
   */
  function updateLens(mouseEvent: MouseEvent) {
    if (!isActive.value || !lensElement.value || !lensMap.value || !mapRef.map?.value) {
      return;
    }

    currentMousePos.value = { x: mouseEvent.clientX, y: mouseEvent.clientY };

    // Position lens above cursor
    const x = mouseEvent.clientX - lensSize / 2;
    const y = mouseEvent.clientY + offsetY;

    lensElement.value.style.left = `${x}px`;
    lensElement.value.style.top = `${y}px`;
    lensElement.value.style.display = 'block';

    // Get lat/lng at cursor position on main map
    const mainMap = mapRef.map.value;
    const mapContainer = mainMap.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    const point = L.point(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);
    const latlng = mainMap.containerPointToLatLng(point);

    // Update mini map view with same zoom level
    const currentZoom = mainMap.getZoom();
    lensMap.value.setView(latlng, currentZoom, { animate: false });
  }

  /**
   * Activate precision mode
   */
  function activate() {
    if (isActive.value) return;

    createLens();
    isActive.value = true;

    // Add mouse move listener
    if (mapRef.map?.value) {
      const mapContainer = mapRef.map.value.getContainer();
      mapContainer.addEventListener('mousemove', updateLens);
    }
  }

  /**
   * Deactivate precision mode
   */
  function deactivate() {
    if (!isActive.value) return;

    isActive.value = false;

    // Hide lens
    if (lensElement.value) {
      lensElement.value.style.display = 'none';
    }

    // Remove mouse move listener
    if (mapRef.map?.value) {
      const mapContainer = mapRef.map.value.getContainer();
      mapContainer.removeEventListener('mousemove', updateLens);
    }
  }

  /**
   * Toggle precision mode
   */
  function toggle() {
    if (isActive.value) {
      deactivate();
    } else {
      activate();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(event: KeyboardEvent) {
    // 'Z' key for precision mode
    if (event.key === 'z' || event.key === 'Z') {
      // Don't activate if typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      event.preventDefault();
      toggle();
    }

    // Escape key to deactivate
    if (event.key === 'Escape' && isActive.value) {
      event.preventDefault();
      deactivate();
    }
  }

  /**
   * Handle right-click to close precision mode
   */
  function handleContextMenu(event: MouseEvent) {
    if (isActive.value) {
      event.preventDefault();
      deactivate();
    }
  }

  /**
   * Cleanup
   */
  function cleanup() {
    deactivate();

    if (lensMap.value) {
      lensMap.value.remove();
      lensMap.value = null;
    }

    if (lensElement.value) {
      lensElement.value.remove();
      lensElement.value = null;
    }

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('contextmenu', handleContextMenu);
  }

  // Setup
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
  });

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    isActive,
    activate,
    deactivate,
    toggle,
  };
}
