<template>
  <div v-if="!isSearching" class="d-flex flex-column gap-3 pb-4">
    <!-- Text Filter -->
    <v-text-field
      clearable
      density="compact"
      :disabled="isSearching"
      :model-value="filterText"
      placeholder="Filter results by name..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      @update:model-value="$emit('update:filterText', $event)"
    />

    <!-- Include Type Filter -->
    <v-select
      chips
      clearable
      closable-chips
      density="compact"
      :disabled="isSearching"
      :items="availableIncludeTypes"
      label="Include types"
      :model-value="includedTypes"
      multiple
      variant="outlined"
      @update:model-value="$emit('update:includedTypes', $event)"
    >
      <template #selection="{ index }">
        <template v-if="index < 3 && includedTypes[index]">
          <v-chip
            class="ma-1"
            closable
            color="success"
            size="small"
            @click:close="$emit('remove-included-type', includedTypes[index]!)"
          >
            {{ includedTypes[index] }}
          </v-chip>
        </template>
        <span v-else-if="index === 3" class="text-caption text-medium-emphasis ml-1">
          +{{ includedTypes.length - 3 }} more
        </span>
      </template>
    </v-select>

    <!-- Exclude Type Filter -->
    <v-select
      chips
      clearable
      closable-chips
      density="compact"
      :disabled="isSearching"
      :items="availableExcludeTypes"
      label="Exclude types"
      :model-value="excludedTypes"
      multiple
      variant="outlined"
      @update:model-value="$emit('update:excludedTypes', $event)"
    >
      <template #selection="{ index }">
        <template v-if="index < 3 && excludedTypes[index]">
          <v-chip
            class="ma-1"
            closable
            color="error"
            size="small"
            @click:close="$emit('remove-excluded-type', excludedTypes[index]!)"
          >
            {{ excludedTypes[index] }}
          </v-chip>
        </template>
        <span v-else-if="index === 3" class="text-caption text-medium-emphasis ml-1">
          +{{ excludedTypes.length - 3 }} more
        </span>
      </template>
    </v-select>

    <!-- Distance Slider -->
    <div>
      <div class="d-flex align-center justify-space-between mb-2">
        <label class="text-subtitle-2">Search Distance</label>
        <span class="text-subtitle-2 font-weight-bold text-primary"
          >{{ liveDisplayDistance.toFixed(1) }} km</span
        >
      </div>
      <v-slider
        color="primary"
        :disabled="isSearching"
        :max="maxSearchDistance"
        :min="0.5"
        :model-value="liveDisplayDistance"
        :step="0.1"
        thumb-size="20"
        track-size="4"
        @mouseup="$emit('distance-release')"
        @touchend="$emit('distance-release')"
        @update:model-value="$emit('update:liveDisplayDistance', $event)"
      />
    </div>

    <!-- Altitude Range Slider -->
    <div>
      <div class="d-flex align-center justify-space-between mb-2">
        <label class="text-subtitle-2">Altitude Range</label>
        <span class="text-subtitle-2 font-weight-bold text-primary">
          {{ liveAltitudeRange[0].toFixed(0) }} m - {{ liveAltitudeRange[1].toFixed(0) }} m
        </span>
      </div>
      <v-range-slider
        color="primary"
        :disabled="isSearching"
        :max="altitudeMax"
        :min="altitudeMin"
        :model-value="liveAltitudeRange"
        :step="10"
        thumb-size="20"
        track-size="4"
        @mouseup="$emit('altitude-release')"
        @touchend="$emit('altitude-release')"
        @update:model-value="$emit('update:liveAltitudeRange', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  filterText: string;
  includedTypes: string[];
  excludedTypes: string[];
  availableIncludeTypes: string[];
  availableExcludeTypes: string[];
  liveDisplayDistance: number;
  maxSearchDistance: number;
  liveAltitudeRange: [number, number];
  altitudeMin: number;
  altitudeMax: number;
  isSearching: boolean;
}>();

defineEmits<{
  'update:filterText': [value: string];
  'update:includedTypes': [value: string[]];
  'update:excludedTypes': [value: string[]];
  'update:liveDisplayDistance': [value: number];
  'update:liveAltitudeRange': [value: [number, number]];
  'remove-included-type': [type: string];
  'remove-excluded-type': [type: string];
  'distance-release': [];
  'altitude-release': [];
}>();
</script>
