<template>
  <v-dialog v-model="isOpen" max-width="900px">
    <v-card>
      <v-card-title class="d-flex align-center gap-2">
        <v-icon icon="mdi-book-open-variant" />
        GeoSketch Tutorial
      </v-card-title>

      <v-card-text class="tutorial-content">
        <v-tabs v-model="activeTab">
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
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <!-- Getting Started -->
          <v-window-item value="getting-started">
            <div class="tutorial-section">
              <h3 class="mb-3">🎯 Welcome to GeoSketch</h3>
              <p class="mb-2">GeoSketch is a map-based drawing tool for creating geographic shapes and managing spatial data.</p>
              <p class="mb-3">Here's what you can do:</p>
              <ul class="tutorial-list">
                <li><strong>Draw circles, lines, and points</strong> on an interactive map</li>
                <li><strong>Save coordinates</strong> for quick access</li>
                <li><strong>Create and manage projects</strong> with multiple drawings</li>
                <li><strong>Navigate</strong> around your shapes using arrow keys</li>
                <li><strong>Export</strong> your drawings as GPX files</li>
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
                  <li><strong>Center Coordinates:</strong> Latitude, Longitude (e.g., 48.8566, 2.3522)</li>
                  <li><strong>Radius:</strong> Size in kilometers</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">➖ Line Segment</h4>
                <p class="mb-2">Draw a line with multiple modes:</p>
                <ul class="tutorial-list">
                  <li><strong>Coordinate Mode:</strong> Connect two points by their coordinates</li>
                  <li><strong>Azimuth Mode:</strong> Create a line at a specific angle and distance</li>
                  <li><strong>Intersection Mode:</strong> Find where two lines meet</li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">📍 Point</h4>
                <p>Mark specific locations on the map. Points can be saved as coordinates for reuse.</p>
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
  import { ref, watch } from 'vue'
  import { useUIStore } from '@/stores/ui'

  const uiStore = useUIStore()
  const activeTab = ref('getting-started')

  const isOpen = ref(false)

  watch(
    () => uiStore.showTutorial,
    newValue => {
      isOpen.value = newValue
    },
  )

  watch(isOpen, newValue => {
    if (!newValue) {
      uiStore.setShowTutorial(false)
    }
  })
</script>

<style scoped>
.tutorial-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 24px;
}

.tutorial-section {
  padding: 12px 0;
}

.tutorial-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.tutorial-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.tutorial-step {
  padding: 12px;
  background: rgba(59, 130, 246, 0.05);
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
}

.tutorial-list {
  margin: 8px 0;
  padding-left: 24px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}

.tutorial-list li {
  margin: 6px 0;
}

p {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
}
</style>
