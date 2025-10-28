<template>
  <v-dialog v-model="isOpen" max-width="900px">
    <v-card class="tutorial-card">
      <v-card-title class="tutorial-title d-flex align-center gap-2">
        <v-icon icon="mdi-book-open-variant" />
        GeoChase Tutorial
      </v-card-title>

      <v-card-text class="tutorial-content">
        <v-tabs v-model="activeTab" class="tutorial-tabs">
          <!-- Getting Started Tab -->
          <v-tab value="getting-started">
            <v-icon class="me-2" icon="mdi-rocket" />
            Getting Started
          </v-tab>

          <!-- Drawing Tab -->
          <v-tab value="drawing">
            <v-icon class="me-2" icon="mdi-pencil" />
            Drawing Tools
          </v-tab>

          <!-- Search Tab -->
          <v-tab value="search">
            <v-icon class="me-2" icon="mdi-magnify" />
            Search & Explore
          </v-tab>

          <!-- Navigation Tab -->
          <v-tab value="navigation">
            <v-icon class="me-2" icon="mdi-navigation" />
            Navigation
          </v-tab>

          <!-- Layers Tab -->
          <v-tab value="layers">
            <v-icon class="me-2" icon="mdi-layers" />
            Layers
          </v-tab>

          <!-- Coordinates Tab -->
          <v-tab value="coordinates">
            <v-icon class="me-2" icon="mdi-map-marker" />
            Saved Coordinates
          </v-tab>

          <!-- Projects Tab -->
          <v-tab value="projects">
            <v-icon class="me-2" icon="mdi-folder" />
            Projects
          </v-tab>

          <!-- Elevation Tab -->
          <v-tab value="elevation">
            <v-icon class="me-2" icon="mdi-mountain" />
            Elevation Data
          </v-tab>

          <!-- Tips Tab -->
          <v-tab value="tips">
            <v-icon class="me-2" icon="mdi-lightbulb" />
            Tips & Tricks
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <!-- Getting Started -->
          <v-window-item value="getting-started">
            <div class="tutorial-section">
              <h3 class="mb-3">🎯 Welcome to GeoChase</h3>
              <p class="mb-2">
                GeoChase is a powerful treasure hunt solver designed to help you discover locations,
                analyze clues, and find hidden treasures using advanced geographic mapping and
                location search tools.
              </p>
              <p class="mb-3">Here's what you can do to solve treasure hunts:</p>
              <ul class="tutorial-list">
                <li><strong>Draw circles, lines, and points</strong> on an interactive map</li>
                <li><strong>Search for locations</strong> by address and explore nearby places</li>
                <li>
                  <strong>Find locations along paths</strong> with distance and altitude filters
                </li>
                <li><strong>View elevation data</strong> for coordinates and search results</li>
                <li><strong>Save coordinates</strong> for quick access across projects</li>
                <li><strong>Create and manage projects</strong> with multiple drawings</li>
                <li><strong>Navigate</strong> around your shapes using arrow keys</li>
                <li><strong>Export as GPX</strong> for use in other mapping applications</li>
              </ul>
            </div>
          </v-window-item>

          <!-- Drawing Tools -->
          <v-window-item value="drawing">
            <div class="tutorial-section">
              <h3 class="mb-3">🔧 Drawing Tools</h3>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🔵 Circle</h4>
                <p class="mb-2">Draw a circle on the map by specifying:</p>
                <ul class="tutorial-list">
                  <li><strong>Name:</strong> Give your circle a name</li>
                  <li>
                    <strong>Center Coordinates:</strong> Latitude, Longitude (e.g., 48.8566, 2.3522)
                  </li>
                  <li><strong>Radius:</strong> Size in kilometers</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">➖ Line Segment</h4>
                <p class="mb-2">Draw a line with multiple modes:</p>
                <ul class="tutorial-list">
                  <li><strong>Coordinate Mode:</strong> Connect two points by their coordinates</li>
                  <li>
                    <strong>Azimuth Mode:</strong> Create a line at a specific angle and distance
                  </li>
                  <li><strong>Intersection Mode:</strong> Find where two lines meet</li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">📍 Point</h4>
                <p>
                  Mark specific locations on the map. Points can be saved as coordinates for reuse.
                </p>
              </div>
            </div>
          </v-window-item>

          <!-- Search & Explore -->
          <v-window-item value="search">
            <div class="tutorial-section">
              <h3 class="mb-3">🔍 Search & Explore</h3>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🏘️ Address Search</h4>
                <p class="mb-2">Find locations by address and explore nearby places:</p>
                <ol class="tutorial-list">
                  <li>Click the <strong>search icon</strong> in the sidebar</li>
                  <li>Type an <strong>address, city, or place name</strong></li>
                  <li>View results with their <strong>coordinates and elevation</strong></li>
                  <li>Click a result to <strong>center the map</strong> on that location</li>
                  <li>Create circles or points at the selected location</li>
                </ol>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🗺️ Search Along Path</h4>
                <p class="mb-2">Find locations near your drawn lines and points:</p>
                <ol class="tutorial-list">
                  <li>Draw a <strong>line segment or point</strong> on the map</li>
                  <li>Click the <strong>search icon</strong> on the layer action menu</li>
                  <li>Adjust the <strong>search distance</strong> with the slider (0.5 - 25 km)</li>
                  <li>Filter results by <strong>altitude range</strong> for elevation analysis</li>
                  <li>Filter by <strong>name</strong> to find specific locations</li>
                  <li>Click results to <strong>mark them on the map</strong></li>
                </ol>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Tips</h4>
                <ul class="tutorial-list">
                  <li>Search results include automatic elevation data</li>
                  <li>Use altitude filtering to find locations at specific elevations</li>
                  <li>Results are filtered by location type (place, amenity, etc.)</li>
                  <li>Click the name filter field to search across all results</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Navigation -->
          <v-window-item value="navigation">
            <div class="tutorial-section">
              <h3 class="mb-3">🧭 Navigate Around Shapes</h3>
              <p class="mb-3">Use arrow keys to move around circles and line segments:</p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">How to Navigate</h4>
                <ol class="tutorial-list">
                  <li>Open the <strong>Layers</strong> panel</li>
                  <li>Click the <strong>⋮ (menu)</strong> button on a circle or line</li>
                  <li>Select <strong>Navigate</strong></li>
                  <li>Use <strong>← →</strong> arrow keys to move</li>
                  <li>Press <strong>ESC</strong> to exit navigation</li>
                </ol>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Tips</h4>
                <ul class="tutorial-list">
                  <li>Speed adjusts automatically based on zoom level</li>
                  <li>Higher zoom = smaller movements, lower zoom = larger movements</li>
                  <li>The sidebar hides during navigation for a clearer view</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Layers -->
          <v-window-item value="layers">
            <div class="tutorial-section">
              <h3 class="mb-3">📚 Layers Panel</h3>
              <p class="mb-3">Manage all your drawings in one place:</p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Layer Actions</h4>
                <ul class="tutorial-list">
                  <li><strong>Click item:</strong> Navigate to and center on the shape</li>
                  <li><strong>Click ⋮ menu:</strong> Show options for the shape</li>
                  <li><strong>👁 Hide/Show:</strong> Toggle visibility on the map</li>
                  <li><strong>✏️ Edit:</strong> Modify the shape's properties</li>
                  <li><strong>🗑️ Delete:</strong> Remove the shape permanently</li>
                  <li><strong>➕ Create with:</strong> Create new shapes from a point</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Coordinates -->
          <v-window-item value="coordinates">
            <div class="tutorial-section">
              <h3 class="mb-3">📌 Saved Coordinates</h3>
              <p class="mb-3">Save frequently-used locations for quick access:</p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">How to Save Coordinates</h4>
                <ol class="tutorial-list">
                  <li><strong>Right-click on the map</strong> to save a location</li>
                  <li>Enter a <strong>name</strong> for the coordinate</li>
                  <li>Use saved coordinates in drawing tools via the <strong>📍 picker</strong></li>
                </ol>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Use Cases</h4>
                <ul class="tutorial-list">
                  <li>Save your home office or frequently visited locations</li>
                  <li>Quick reference points for multiple projects</li>
                  <li>Reuse coordinates across different drawings</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Projects -->
          <v-window-item value="projects">
            <div class="tutorial-section">
              <h3 class="mb-3">🗂️ Projects</h3>
              <p class="mb-3">Organize your work into separate projects:</p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Project Management</h4>
                <ul class="tutorial-list">
                  <li><strong>💾 Save:</strong> Save current project (auto-saves)</li>
                  <li><strong>📁 Load:</strong> Switch between saved projects</li>
                  <li><strong>📥 Import/Export:</strong> Share or backup as GPX files</li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">Features</h4>
                <ul class="tutorial-list">
                  <li>Each project stores all your drawings separately</li>
                  <li>Projects are saved automatically to your browser</li>
                  <li>Export as GPX for use in other mapping applications</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Elevation Data -->
          <v-window-item value="elevation">
            <div class="tutorial-section">
              <h3 class="mb-3">⛰️ Elevation Data</h3>
              <p class="mb-3">
                GeoChase automatically fetches elevation information for all locations:
              </p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Where Elevation Data is Available</h4>
                <ul class="tutorial-list">
                  <li>
                    <strong>Address search results</strong> - Shows elevation for each location
                  </li>
                  <li>
                    <strong>Search along path results</strong> - Includes elevation in location
                    details
                  </li>
                  <li>
                    <strong>Saved coordinates</strong> - Elevation data displayed in the coordinates
                    panel
                  </li>
                  <li>
                    <strong>Search filters</strong> - Filter locations by altitude range (min/max
                    elevation)
                  </li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">📊 Using Elevation in Search</h4>
                <p class="mb-2">When searching along paths, you can filter by altitude:</p>
                <ol class="tutorial-list">
                  <li>Open the search results panel for a path</li>
                  <li>Use the <strong>Altitude Range slider</strong> to set min/max elevation</li>
                  <li>Results will be <strong>filtered to match your altitude range</strong></li>
                  <li>The slider shows the actual min/max elevation of all results</li>
                  <li>
                    Combine with <strong>distance filter</strong> for powerful location analysis
                  </li>
                </ol>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Tips</h4>
                <ul class="tutorial-list">
                  <li>Elevation is measured in meters above sea level</li>
                  <li>Data comes from the Open-Elevation API (globally available)</li>
                  <li>Use altitude filtering to find locations at specific elevations</li>
                  <li>Combine search distance + altitude for advanced location discovery</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Tips & Tricks -->
          <v-window-item value="tips">
            <div class="tutorial-section">
              <h3 class="mb-3">💡 Tips & Tricks</h3>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">⌨️ Keyboard Shortcuts</h4>
                <ul class="tutorial-list">
                  <li>
                    <strong>Arrow Keys (← →)</strong> - Navigate along circles/lines during
                    navigation mode
                  </li>
                  <li><strong>ESC</strong> - Exit navigation mode</li>
                  <li><strong>Right-click on map</strong> - Save coordinates at that location</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🎯 Drawing Tips</h4>
                <ul class="tutorial-list">
                  <li>
                    Use <strong>saved coordinates</strong> to quickly reference frequently-used
                    points
                  </li>
                  <li>Create <strong>multiple line segments</strong> to map routes or paths</li>
                  <li>Use <strong>intersection mode</strong> to find where paths cross</li>
                  <li>
                    Combine <strong>azimuth mode</strong> with specific angles and distances for
                    precise positioning
                  </li>
                  <li>Color code your shapes for better organization in complex projects</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🔍 Search Workflow</h4>
                <ul class="tutorial-list">
                  <li>Start with <strong>address search</strong> to locate general areas</li>
                  <li>Draw a <strong>line or point</strong> at your location of interest</li>
                  <li>Use <strong>"Search Along Path"</strong> to find nearby locations</li>
                  <li>
                    Filter by <strong>altitude</strong> if you're looking for specific terrain
                    elevation
                  </li>
                  <li>Mark interesting findings as new <strong>circles or points</strong></li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">📦 Project Management</h4>
                <ul class="tutorial-list">
                  <li>Save projects frequently during work</li>
                  <li>Use <strong>descriptive project names</strong> for easy identification</li>
                  <li>Export as GPX to share with others or use in other applications</li>
                  <li>Import GPX files from other sources to extend your work</li>
                </ul>
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="isOpen = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const activeTab = ref('getting-started');

const isOpen = ref(false);

watch(
  () => uiStore.showTutorial,
  (newValue) => {
    isOpen.value = newValue;
  }
);

watch(isOpen, (newValue) => {
  if (!newValue) {
    uiStore.setShowTutorial(false);
  }
});
</script>

<style scoped>
.tutorial-card {
  background-color: #1e293b;
}

.tutorial-title {
  background-color: #0f172a;
  color: #ffffff;
}

.tutorial-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 24px;
  background-color: #1e293b;
}

.tutorial-tabs {
  background-color: #1e293b;
}

.tutorial-section {
  padding: 12px 0;
}

.tutorial-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
}

.tutorial-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #e0e7ff;
}

.tutorial-step {
  padding: 12px;
  background: rgba(var(--v-theme-primary), 0.15);
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
}

.tutorial-list {
  margin: 8px 0;
  padding-left: 24px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
}

.tutorial-list li {
  margin: 6px 0;
  color: #ffffff;
}

.tutorial-list strong {
  color: #e0e7ff;
  font-weight: 600;
}

p {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.v-tab) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.v-tab--selected) {
  color: #ffffff;
}

:deep(.v-window) {
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-icon) {
  color: #94a3b8;
}

:deep(.v-tab--selected .v-icon) {
  color: #3b82f6;
}

:deep(.v-card-actions) {
  background-color: #0f172a;
}

:deep(.v-btn) {
  color: #ffffff;
}
</style>
