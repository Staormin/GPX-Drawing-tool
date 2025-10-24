<template>
  <v-card class="overflow-y-auto" style="max-height: 300px" variant="flat">
    <v-card-title class="text-caption font-weight-bold text-uppercase py-2 px-3">
      Saved Coordinates
    </v-card-title>
    <v-card-text class="pa-2">
      <div v-if="coordinatesStore.coordinateCount === 0" class="text-center py-3">
        <p class="text-caption text-medium-emphasis">
          Right-click on the map to save coordinates
        </p>
      </div>

      <v-list v-else class="pa-0 bg-transparent" density="compact">
        <v-list-item
          v-for="coord in coordinatesStore.sortedCoordinates"
          :key="coord.id"
          density="compact"
        >
          <template #default>
            <div class="text-xs">
              <div class="font-weight-medium">{{ coord.name }}</div>
              <div class="text-caption text-disabled">
                {{ coord.lat.toFixed(6) }}, {{ coord.lon.toFixed(6) }}
              </div>
            </div>
          </template>
          <template #append>
            <v-btn
              density="compact"
              icon="mdi-delete"
              size="x-small"
              variant="text"
              @click="coordinatesStore.deleteCoordinate(coord.id!)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { useCoordinatesStore } from '@/stores/coordinates'

  const coordinatesStore = useCoordinatesStore()
</script>
