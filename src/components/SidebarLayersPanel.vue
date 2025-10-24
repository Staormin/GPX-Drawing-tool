<template>
  <div class="layers-panel">
    <!-- Title -->
    <h3 class="layers-panel-title">Layers</h3>

    <!-- Empty state -->
    <div v-if="layersStore.isEmpty" class="layers-empty">
      <p>No elements added yet. Use the buttons above to add circles, line segments, or points.</p>
    </div>

    <!-- Layers list -->
    <div v-else class="layers-list">
      <!-- Circles -->
      <div v-if="layersStore.circleCount > 0">
        <p class="layers-section-title">Circles ({{ layersStore.circleCount }})</p>
        <div class="layer-items">
          <div
            v-for="circle in layersStore.circles"
            :key="circle.id"
            class="layer-item"
            :class="{ 'layer-item-hidden': circle.id && !uiStore.isElementVisible('circle', circle.id) }"
          >
            <div class="layer-item-info" @click="handleGoTo('circle', circle)">
              <div class="layer-item-name">{{ circle.name }}</div>
              <div class="layer-item-type">{{ circle.radius }}km radius</div>
            </div>
            <div class="layer-item-actions">
              <LayerContextMenu
                v-if="circle.id"
                :element-id="circle.id"
                element-type="circle"
                @delete="handleDeleteElement"
                @edit="handleEditCircle(circle)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Line segments -->
      <div v-if="layersStore.lineSegmentCount > 0">
        <p class="layers-section-title">Lines ({{ layersStore.lineSegmentCount }})</p>
        <div class="layer-items">
          <div
            v-for="line in layersStore.lineSegments"
            :key="line.id"
            class="layer-item"
            :class="{ 'layer-item-hidden': line.id && !uiStore.isElementVisible('lineSegment', line.id) }"
          >
            <div class="layer-item-info" @click="handleGoTo('lineSegment', line)">
              <div class="layer-item-name">{{ line.name }}</div>
              <div class="layer-item-type">Line segment • {{ getLineInfo(line) }}</div>
            </div>
            <div class="layer-item-actions">
              <LayerContextMenu
                v-if="line.id"
                :element-id="line.id"
                element-type="lineSegment"
                @delete="handleDeleteElement"
                @edit="handleEditLineSegment(line)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Points -->
      <div v-if="layersStore.pointCount > 0">
        <p class="layers-section-title">Points ({{ layersStore.pointCount }})</p>
        <div class="layer-items">
          <div
            v-for="point in layersStore.points"
            :key="point.id"
            class="layer-item"
            :class="{ 'layer-item-hidden': point.id && !uiStore.isElementVisible('point', point.id) }"
          >
            <div class="layer-item-info" @click="handleGoTo('point', point)">
              <div class="layer-item-name">{{ point.name }}</div>
              <div class="layer-item-type">Point</div>
            </div>
            <div class="layer-item-actions">
              <LayerContextMenu
                v-if="point.id"
                :element-id="point.id"
                element-type="point"
                @delete="handleDeleteElement"
                @edit="handleEditPoint(point)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CircleElement, LineSegmentElement, PointElement } from '@/services/storage'
  import { inject } from 'vue'
  import LayerContextMenu from '@/components/LayerContextMenu.vue'
  import { calculateBearing, calculateDistance, destinationPoint } from '@/services/geometry'
  import { useLayersStore } from '@/stores/layers'
  import { useUIStore } from '@/stores/ui'

  const layersStore = useLayersStore()
  const uiStore = useUIStore()
  const drawing = inject('drawing') as any
  const mapContainer = inject('mapContainer') as any

  function getLineInfo (line: LineSegmentElement) {
    // Special handling for parallel mode
    if (line.mode === 'parallel') {
      return `parallel • ${line.longitude}°`
    }

    // Calculate segment length using haversine formula for display
    if (!line.endpoint) {
      return `${line.mode} • (incomplete)`
    }

    let endpoint = line.endpoint
    if (line.mode === 'azimuth' && line.distance && line.azimuth !== undefined) {
      endpoint = destinationPoint(line.center.lat, line.center.lon, line.distance, line.azimuth)
    }

    const segmentLength = calculateDistance(line.center.lat, line.center.lon, endpoint.lat, endpoint.lon)
    const azimuth = calculateBearing(line.center.lat, line.center.lon, endpoint.lat, endpoint.lon)
    const modeLabel = line.mode === 'coordinate' ? 'coordinate' : (line.mode === 'azimuth' ? 'azimuth' : 'intersection')

    return `${modeLabel} • ${azimuth.toFixed(1)}° • ${segmentLength.toFixed(2)} km`
  }

  function handleEditCircle (circle: CircleElement) {
    if (circle.id) {
      uiStore.startEditing('circle', circle.id)
      uiStore.openModal('circleModal')
    }
  }

  function handleEditLineSegment (line: LineSegmentElement) {
    if (line.id) {
      uiStore.startEditing('lineSegment', line.id)
      uiStore.openModal('lineSegmentModal')
    }
  }

  function handleEditPoint (point: PointElement) {
    if (point.id) {
      uiStore.startEditing('point', point.id)
      uiStore.openModal('pointModal')
    }
  }

  function handleDeleteElement (elementType: string, elementId: string) {
    // Use the drawing composable to delete from both map and store
    drawing.deleteElement(elementType, elementId)
  }

  function handleGoTo (elementType: string, element: CircleElement | LineSegmentElement | PointElement) {
    let lat: number
    let lon: number
    let zoom: number

    if (elementType === 'circle') {
      const circle = element as CircleElement
      lat = circle.center.lat
      lon = circle.center.lon
      // Calculate zoom based on radius: 13 - log2(radius/2)
      zoom = Math.max(2, Math.min(18, 13 - Math.log2(circle.radius / 2)))
    } else if (elementType === 'lineSegment') {
      const segment = element as LineSegmentElement
      if (segment.mode === 'parallel') {
        // For parallel, center on the parallel's latitude
        lat = segment.longitude || 0
        lon = 0
        zoom = 3
      } else if (segment.endpoint) {
        // Center on segment midpoint
        lat = (segment.center.lat + segment.endpoint.lat) / 2
        lon = (segment.center.lon + segment.endpoint.lon) / 2
        zoom = 13
      } else {
        // Fallback to segment start
        lat = segment.center.lat
        lon = segment.center.lon
        zoom = 13
      }
    } else {
      const point = element as PointElement
      lat = point.coordinates.lat
      lon = point.coordinates.lon
      zoom = 13
    }

    mapContainer.setCenter(lat, lon, zoom)
    uiStore.addToast(`Going to ${element.name}`, 'info')
  }
</script>

<style scoped>
.layers-panel {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.layers-panel-title {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.layers-empty {
  padding: 30px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.layers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layers-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin: 8px 0 4px 0;
}

.layer-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.layer-item {
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-item:hover {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  padding-left: 4px;
  padding-right: 4px;
}

.layer-item-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.layer-item-name {
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.layer-item-type {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.layer-item-actions {
  display: flex;
  gap: 6px;
  margin-left: 10px;
}

.layer-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #94a3b8;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-weight: 500;
}

.layer-action-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.layer-action-btn.delete:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.layer-action-btn.add:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.layer-item-hidden {
  opacity: 0.5;
}

.layer-item-hidden .layer-item-name {
  text-decoration: line-through;
}
</style>
