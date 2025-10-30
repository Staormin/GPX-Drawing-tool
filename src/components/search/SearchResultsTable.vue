<template>
  <div v-if="filteredResults.length > 0 || isFiltering" class="d-flex flex-column gap-2">
    <div class="position-relative" style="min-height: 100px; overflow-x: auto">
      <!-- Loading overlay -->
      <div
        v-if="isFiltering"
        class="position-absolute d-flex align-center justify-center rounded"
        style="inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 10"
      >
        <div class="d-flex flex-column align-center gap-2">
          <v-progress-circular color="primary" indeterminate size="32" width="3" />
          <div class="text-caption text-disabled">Filtering...</div>
        </div>
      </div>

      <!-- Results table -->
      <table style="min-width: 100%; border-collapse: collapse">
        <thead>
          <tr
            style="
              border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.12);
              background-color: rgba(var(--v-theme-on-surface), 0.05);
            "
          >
            <th
              class="cursor-pointer"
              style="padding: 8px; text-align: left; width: 45%; min-width: 120px"
              @click="$emit('toggle-sort', 'name')"
            >
              <div class="text-xs font-medium text-slate-700 d-flex align-center gap-1">
                Name
                <v-icon
                  v-if="sortBy === 'name'"
                  :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                  size="16"
                />
              </div>
            </th>
            <th
              class="cursor-pointer"
              style="padding: 8px; text-align: right; width: 27%; min-width: 70px"
              @click="$emit('toggle-sort', 'distance')"
            >
              <div class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1">
                Distance
                <v-icon
                  v-if="sortBy === 'distance'"
                  :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                  size="16"
                />
              </div>
            </th>
            <th
              class="cursor-pointer"
              style="padding: 8px; text-align: right; width: 28%; min-width: 70px"
              @click="$emit('toggle-sort', 'elevation')"
            >
              <div class="text-xs font-medium text-slate-700 d-flex align-center justify-end gap-1">
                Elevation
                <v-icon
                  v-if="sortBy === 'elevation'"
                  :icon="sortAsc ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
                  size="16"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(result, index) in filteredResults"
            :key="`${result.main}-${index}`"
            class="cursor-pointer"
            style="
              border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
              transition: background-color 0.2s;
            "
            @click="$emit('result-click', result)"
            @mouseenter="
              (e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(var(--v-theme-primary), 0.15)')
            "
            @mouseleave="
              (e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            "
          >
            <td style="padding: 8px; width: 45%; min-width: 120px">
              <div
                class="font-medium text-sm text-truncate"
                style="
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  max-width: 100%;
                "
                :title="result.main.length > 35 ? result.main : ''"
              >
                {{ result.main.length > 35 ? result.main.substring(0, 35) + '...' : result.main }}
              </div>
              <div class="d-flex align-center gap-1">
                <div class="text-xs text-slate-600 text-truncate" :title="result.type || 'N/A'">
                  {{ result.type || 'N/A' }}
                </div>
                <v-btn
                  v-if="!includedTypes.includes(result.type || 'N/A')"
                  color="success"
                  icon="mdi-plus"
                  size="x-small"
                  variant="text"
                  @click.stop="$emit('add-included-type', result.type || 'N/A')"
                />
                <v-btn
                  v-if="!excludedTypes.includes(result.type || 'N/A')"
                  color="error"
                  icon="mdi-minus"
                  size="x-small"
                  variant="text"
                  @click.stop="$emit('add-excluded-type', result.type || 'N/A')"
                />
              </div>
            </td>
            <td
              style="
                padding: 8px;
                text-align: right;
                width: 27%;
                min-width: 70px;
                white-space: nowrap;
              "
            >
              <div class="text-sm font-medium">{{ getResultDistance(result).toFixed(1) }} km</div>
            </td>
            <td
              style="
                padding: 8px;
                text-align: right;
                width: 28%;
                min-width: 70px;
                white-space: nowrap;
              "
            >
              <div class="text-sm font-medium">
                {{ result.elevation ? `${result.elevation} m` : 'N/A' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="text-caption text-disabled text-center py-8 px-4">
    <v-icon class="mb-2" icon="mdi-magnify" size="24" />
    <div>No results match your filter.</div>
  </div>
</template>

<script lang="ts" setup>
import type { AddressSearchResult } from '@/services/geoportail';
import { haversineDistance } from '@/services/geoportail';

const props = defineProps<{
  filteredResults: AddressSearchResult[];
  isFiltering: boolean;
  sortBy: 'name' | 'type' | 'elevation' | 'distance';
  sortAsc: boolean;
  includedTypes: string[];
  excludedTypes: string[];
  pathPoints: Array<{ lat: number; lon: number }>;
}>();

defineEmits<{
  'toggle-sort': [column: 'name' | 'type' | 'elevation' | 'distance'];
  'result-click': [result: AddressSearchResult];
  'add-included-type': [type: string];
  'add-excluded-type': [type: string];
}>();

function getResultDistance(result: AddressSearchResult): number {
  if (props.pathPoints.length === 0) return 0;
  return haversineDistance(result.coordinates, props.pathPoints[0]!);
}
</script>
