<template>
  <v-menu
    v-model="showResults"
    :close-on-content-click="false"
    location="bottom"
    max-height="400"
    :open-on-click="false"
  >
    <template #activator="{ props: menuProps }">
      <div v-bind="menuProps">
        <v-text-field
          v-model="addressSearchInput"
          bg-color="surface-bright"
          class="my-0"
          clearable
          density="compact"
          hide-details
          :loading="addressSearchLoading"
          placeholder="Search address..."
          prepend-inner-icon="mdi-magnify"
          variant="solo"
        />
      </div>
    </template>

    <v-card v-if="addressSearchResults.length > 0" elevation="24">
      <v-list class="pa-0" density="compact">
        <v-list-item
          v-for="(result, idx) in addressSearchResults"
          :key="idx"
          @click="onAddressSelect(result.coordinates)"
        >
          <template #prepend>
            <v-icon icon="mdi-map-marker" size="small" />
          </template>
          <v-list-item-title class="text-sm font-weight-medium">
            {{ result.main }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-xs">
            {{ result.secondary }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
import type { MapContainer } from '@/composables/useMap';
import { inject, ref, watch } from 'vue';
import { type AddressSearchResult, searchAddress } from '@/services/geoportail';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const mapContainer = inject<MapContainer>('mapContainer');

const selectedAddress = ref<any>(null);
const addressSearchResults = ref<AddressSearchResult[]>([]);
const addressSearchLoading = ref(false);
const addressSearchInput = ref<string>('');
const showResults = ref(false);
let addressSearchTimeout: ReturnType<typeof setTimeout> | null = null;

async function onAddressSearch(query: string) {
  if (addressSearchTimeout) {
    clearTimeout(addressSearchTimeout);
  }

  if (!query || !query.trim()) {
    addressSearchResults.value = [];
    showResults.value = false;
    return;
  }

  addressSearchLoading.value = true;
  addressSearchTimeout = setTimeout(async () => {
    try {
      const results = await searchAddress(query);
      addressSearchResults.value = results;
      showResults.value = results.length > 0;
    } catch (error) {
      console.error('Error searching addresses:', error);
      uiStore.addToast('Error searching addresses', 'error');
      showResults.value = false;
    } finally {
      addressSearchLoading.value = false;
    }
  }, 300);
}

function onAddressSelect(coordinates: any) {
  if (coordinates && coordinates.lat && coordinates.lon && mapContainer) {
    mapContainer.setCenter(coordinates.lat, coordinates.lon, 13);
    selectedAddress.value = null;
    addressSearchResults.value = [];
    showResults.value = false;
    addressSearchInput.value = '';
  }
}
watch(addressSearchInput, (newVal) => {
  onAddressSearch(newVal);
});
</script>

<style scoped>
.geochase-title-header {
  position: relative;
  padding: 12px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.geochase-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
  flex-grow: 1;
}
</style>
