import type { CircleElement, LineSegmentElement } from '@/services/storage'
import { computed, ref } from 'vue'
import { calculateDistance, destinationPoint, toRadians } from '@/services/geometry'

export interface NavigationState {
  active: boolean
  elementType: 'circle' | 'lineSegment' | null
  elementId: string | null
  progress: number // For segments: 0-1 for position along path
  anglePosition: number // For circles: angle in degrees (0-360)
}

export function useNavigation () {
  const navigationState = ref<NavigationState>({
    active: false,
    elementType: null,
    elementId: null,
    progress: 0,
    anglePosition: 0,
  })

  const isNavigationActive = computed(() => navigationState.value.active)

  /**
   * Calculate movement distance based on zoom level
   * Higher zoom = smaller movement, lower zoom = larger movement
   * Multiplied by 10 for much faster navigation
   * At zoom 5: ~51200km per step
   * At zoom 10: ~1560km per step
   * At zoom 15: ~50km per step
   * At zoom 18: ~6km per step
   */
  function getNavigationMovement (zoomLevel: number): number {
    const baseDistance = Math.pow(2, 11 - zoomLevel) * 5 * 10
    return Math.max(baseDistance, 0.01) // Minimum 0.01km
  }

  /**
   * Calculate the length of a line segment in km
   */
  function calculateSegmentLength (segment: LineSegmentElement): number {
    let segmentEndpoint = segment.endpoint

    if (segment.mode === 'azimuth' && segment.distance && segment.azimuth !== undefined) {
      segmentEndpoint = destinationPoint(
        segment.center.lat,
        segment.center.lon,
        segment.distance,
        segment.azimuth,
      )
    }

    if (!segmentEndpoint) {
      return 0
    }

    return calculateDistance(
      segment.center.lat,
      segment.center.lon,
      segmentEndpoint.lat,
      segmentEndpoint.lon,
    )
  }

  /**
   * Start navigation mode for a circle or line segment
   */
  function startNavigation (
    elementType: 'circle' | 'lineSegment',
    elementId: string,
    circle?: CircleElement,
    segment?: LineSegmentElement,
  ): void {
    navigationState.value.active = true
    navigationState.value.elementType = elementType
    navigationState.value.elementId = elementId

    if (elementType === 'circle' && circle) {
      navigationState.value.anglePosition = 0
    } else if (elementType === 'lineSegment' && segment) {
      navigationState.value.progress = 0
    }
  }

  /**
   * Exit navigation mode
   */
  function exitNavigation (): void {
    navigationState.value.active = false
    navigationState.value.elementType = null
    navigationState.value.elementId = null
    navigationState.value.progress = 0
    navigationState.value.anglePosition = 0
  }

  /**
   * Navigate forward on a circle (right arrow)
   */
  function navigateCircleForward (circle: CircleElement, zoomLevel: number): void {
    const movement = getNavigationMovement(zoomLevel) // in km
    const degreesPerKm = 1 / (111 * Math.cos(toRadians(circle.center.lat)))
    const angleDelta = (movement * degreesPerKm / circle.radius) * 180 / Math.PI

    navigationState.value.anglePosition = (navigationState.value.anglePosition + angleDelta) % 360
  }

  /**
   * Navigate backward on a circle (left arrow)
   */
  function navigateCircleBackward (circle: CircleElement, zoomLevel: number): void {
    const movement = getNavigationMovement(zoomLevel) // in km
    const degreesPerKm = 1 / (111 * Math.cos(toRadians(circle.center.lat)))
    const angleDelta = (movement * degreesPerKm / circle.radius) * 180 / Math.PI

    navigationState.value.anglePosition = (navigationState.value.anglePosition - angleDelta + 360) % 360
  }

  /**
   * Navigate forward on a line segment (right arrow)
   */
  function navigateSegmentForward (segment: LineSegmentElement, zoomLevel: number): void {
    const movement = getNavigationMovement(zoomLevel)
    const segmentLength = calculateSegmentLength(segment)
    const progressDelta = movement / segmentLength

    navigationState.value.progress += progressDelta

    // Handle endpoints and direction reversal
    if (navigationState.value.progress >= 1) {
      navigationState.value.progress = 1 - (navigationState.value.progress - 1)
    } else if (navigationState.value.progress < 0) {
      navigationState.value.progress = -navigationState.value.progress
    }
  }

  /**
   * Navigate backward on a line segment (left arrow)
   */
  function navigateSegmentBackward (segment: LineSegmentElement, zoomLevel: number): void {
    const movement = getNavigationMovement(zoomLevel)
    const segmentLength = calculateSegmentLength(segment)
    const progressDelta = movement / segmentLength

    navigationState.value.progress -= progressDelta

    // Handle endpoints and direction reversal
    if (navigationState.value.progress >= 1) {
      navigationState.value.progress = 1 - (navigationState.value.progress - 1)
    } else if (navigationState.value.progress < 0) {
      navigationState.value.progress = -navigationState.value.progress
    }
  }

  /**
   * Calculate coordinates on a circle based on angle position
   */
  function getCircleNavigationCoords (circle: CircleElement): { lat: number, lon: number } {
    const radians = toRadians(navigationState.value.anglePosition)
    const degreesPerKm = 1 / (111 * Math.cos(toRadians(circle.center.lat)))
    const newLat = circle.center.lat + (circle.radius / 111) * Math.cos(radians)
    const newLon = circle.center.lon + (circle.radius * degreesPerKm) * Math.sin(radians)

    return { lat: newLat, lon: newLon }
  }

  /**
   * Calculate coordinates on a line segment based on progress
   */
  function getSegmentNavigationCoords (segment: LineSegmentElement): { lat: number, lon: number } {
    let segmentEndpoint = segment.endpoint

    if (segment.mode === 'azimuth' && segment.distance && segment.azimuth !== undefined) {
      segmentEndpoint = destinationPoint(
        segment.center.lat,
        segment.center.lon,
        segment.distance,
        segment.azimuth,
      )
    }

    if (!segmentEndpoint) {
      return { lat: segment.center.lat, lon: segment.center.lon }
    }

    // Linear interpolation between start and end points
    const progress = navigationState.value.progress
    const lat = segment.center.lat + (segmentEndpoint.lat - segment.center.lat) * progress
    const lon = segment.center.lon + (segmentEndpoint.lon - segment.center.lon) * progress

    return { lat, lon }
  }

  return {
    navigationState,
    isNavigationActive,
    startNavigation,
    exitNavigation,
    navigateCircleForward,
    navigateCircleBackward,
    navigateSegmentForward,
    navigateSegmentBackward,
    getCircleNavigationCoords,
    getSegmentNavigationCoords,
    getNavigationMovement,
  }
}
