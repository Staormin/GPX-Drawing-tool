<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    @click:outside="closeModal"
    @keydown.enter="isEditing ? updateCoordinate() : saveAndAddAsPoint()"
    @keydown.esc="closeModal"
  >
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Coordinate' : 'Save Coordinate' }}</v-card-title>
      <v-card-text>
        <!-- Input section -->
        <div>
          <v-text-field
            ref="nameInput"
            v-model="form.name"
            autofocus
            class="mb-4"
            density="compact"
            label="Coordinate Name (optional)"
            placeholder="e.g., Paris Center"
            variant="outlined"
          />

          <v-text-field
            v-model="form.coordinates"
            class="mb-4"
            density="compact"
            label="Latitude, Longitude"
            placeholder="48.8566, 2.3522"
            variant="outlined"
          />
        </div>

        <!-- Divider -->
        <v-divider class="my-6" />

        <!-- List section -->
        <div>
          <h3 class="text-subtitle2 mb-4">Saved Coordinates</h3>
          <div v-if="coordinatesStore.sortedCoordinates.length === 0" class="text-center py-6">
            <p class="text-caption">No saved coordinates yet.</p>
          </div>

          <div v-else class="d-flex flex-column gap-2" style="max-height: 300px; overflow-y: auto">
            <div
              v-for="coord in coordinatesStore.sortedCoordinates"
              :key="coord.id"
              class="d-flex justify-space-between align-center pa-3 rounded"
              style="
                background-color: rgba(var(--v-theme-on-surface), 0.05);
                border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
              "
            >
              <div class="flex-grow-1 min-width-0">
                <div class="font-weight-medium text-sm">{{ coord.name }}</div>
                <div class="text-caption" style="color: rgba(var(--v-theme-on-surface), 0.6)">
                  {{ coord.lat.toFixed(6) }}, {{ coord.lon.toFixed(6) }}
                </div>
              </div>
              <div class="d-flex gap-1 ml-2">
                <v-btn
                  color="primary"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="editCoordinate(coord.id!)"
                />
                <v-btn
                  color="error"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  @click="handleDeleteCoordinate(coord.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn v-if="isEditing" text @click="cancelEdit"> Cancel </v-btn>
        <v-btn v-if="!isEditing" text @click="closeModal"> Cancel </v-btn>
        <v-btn v-if="isEditing" color="primary" @click="updateCoordinate"> Update </v-btn>
        <v-btn v-if="!isEditing" color="primary" @click="saveCoordinate"> Save </v-btn>
        <v-btn v-if="!isEditing" color="primary" @click="saveAndAddAsPoint"> Save & Point </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, ref, watch } from 'vue';
import { getReverseGeocodeAddress } from '@/services/address';
import { useCoordinatesStore } from '@/stores/coordinates';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const coordinatesStore = useCoordinatesStore();
const drawing = inject('drawing') as any;
const isFetchingAddress = ref(false);
const nameInput = ref<any>(null);

const form = ref({
  name: '',
  coordinates: '',
});

const editingCoordinateId = ref<string | null>(null);

const isEditing = computed(() => editingCoordinateId.value !== null);

// Watch for form data from right-click
watch(
  () => uiStore.coordinatesFormData,
  (newData) => {
    if (newData) {
      form.value.name = newData.name;
      form.value.coordinates = newData.coordinates;
    }
  },
  { immediate: true, deep: true }
);

const isOpen = computed({
  get: () => uiStore.isModalOpen('coordinatesModal'),
  set: (value) => {
    if (!value) closeModal();
  },
});

// Focus the name input when modal opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    await nextTick();
    nameInput.value?.focus();
  }
});

function validateAndParseCoordinates(): { lat: number; lon: number } | null {
  if (!form.value.coordinates.trim()) {
    uiStore.addToast('Please enter latitude and longitude', 'error');
    return null;
  }

  const parts = form.value.coordinates.split(',').map((p) => p.trim());
  if (parts.length !== 2) {
    uiStore.addToast('Please enter coordinates in format: lat, lon', 'error');
    return null;
  }

  const lat = Number.parseFloat(parts[0] || '');
  const lon = Number.parseFloat(parts[1] || '');

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    uiStore.addToast('Please enter valid numeric coordinates', 'error');
    return null;
  }

  return { lat, lon };
}

async function getCoordinateName(lat: number, lon: number): Promise<string> {
  const name = form.value.name.trim();
  if (name) {
    return name;
  }

  // If name is empty, try to fetch address from reverse geocoding
  isFetchingAddress.value = true;
  try {
    const result = await getReverseGeocodeAddress(lat, lon);
    if (result.address) {
      return result.address;
    }
    // If no address found, use a generic name
    return `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  } finally {
    isFetchingAddress.value = false;
  }
}

async function saveCoordinate() {
  const coords = validateAndParseCoordinates();
  if (!coords) return;

  const name = await getCoordinateName(coords.lat, coords.lon);
  coordinatesStore.addCoordinate(name, coords.lat, coords.lon);
  uiStore.addToast('Coordinate saved successfully!', 'success');
  closeModal();
}

async function saveAndAddAsPoint() {
  const coords = validateAndParseCoordinates();
  if (!coords) return;

  const name = await getCoordinateName(coords.lat, coords.lon);

  // Save the coordinate
  coordinatesStore.addCoordinate(name, coords.lat, coords.lon);

  // Create a point with the same name
  if (drawing) {
    drawing.drawPoint(coords.lat, coords.lon, name);
    uiStore.addToast(`Coordinate saved and point "${name}" created!`, 'success');
  } else {
    uiStore.addToast(
      'Coordinate saved (but point creation failed - drawing not available)',
      'info'
    );
  }

  closeModal();
}

function editCoordinate(id: string) {
  const coord = coordinatesStore.sortedCoordinates.find((c: any) => c.id === id);
  if (coord) {
    form.value.name = coord.name;
    form.value.coordinates = `${coord.lat}, ${coord.lon}`;
    editingCoordinateId.value = id;
  }
}

async function updateCoordinate() {
  const coords = validateAndParseCoordinates();
  if (!coords || !editingCoordinateId.value) return;

  let name = form.value.name.trim();
  if (!name) {
    // If name is empty, fetch address
    name = await getCoordinateName(coords.lat, coords.lon);
  }

  coordinatesStore.updateCoordinate(editingCoordinateId.value, name, coords.lat, coords.lon);
  uiStore.addToast('Coordinate updated successfully!', 'success');
  cancelEdit();
}

function cancelEdit() {
  editingCoordinateId.value = null;
  resetForm();
}

function handleDeleteCoordinate(id: string | undefined) {
  if (!id) {
    uiStore.addToast('Invalid coordinate ID', 'error');
    return;
  }

  if (confirm('Delete this coordinate?')) {
    coordinatesStore.deleteCoordinate(id);
    uiStore.addToast('Coordinate deleted!', 'success');
  }
}

function closeModal() {
  uiStore.closeModal('coordinatesModal');
  uiStore.setCoordinatesFormData(null);
  cancelEdit();
}

function resetForm() {
  form.value = {
    name: '',
    coordinates: '',
  };
  // Also clear the stored form data
  uiStore.setCoordinatesFormData(null);
}
</script>
