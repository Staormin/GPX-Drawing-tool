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

          <!-- Notes Tab -->
          <v-tab value="notes">
            <v-icon class="me-2" icon="mdi-note-text" />
            Notes
          </v-tab>

          <!-- Coordinates Tab -->
          <v-tab value="coordinates">
            <v-icon class="me-2" icon="mdi-map-marker" />
            Coordinates
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
                <h4 class="mb-2">Accessing Drawing Tools</h4>
                <p class="mb-2">All drawing tools are located in the <strong>top bar</strong>:</p>
                <ul class="tutorial-list">
                  <li>Click the buttons in the center of the top bar to open drawing modals</li>
                  <li>The top bar can be collapsed/expanded using the chevron button</li>
                  <li>Drawing tools include: Circle, Lines (multiple types), and Point</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🔵 Circle</h4>
                <p class="mb-2">Draw a circle on the map by specifying:</p>
                <ul class="tutorial-list">
                  <li>
                    <strong>Name:</strong> Give your circle a name (optional, auto-generated if
                    empty)
                  </li>
                  <li><strong>Center Coordinates:</strong> Select from your saved coordinates</li>
                  <li><strong>Radius:</strong> Size in kilometers</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">➖ Line Segment</h4>
                <p class="mb-2">Draw a line with multiple modes:</p>
                <ul class="tutorial-list">
                  <li><strong>Two Points:</strong> Connect two saved coordinates</li>
                  <li>
                    <strong>Azimuth Mode:</strong> Create a line at a specific angle (azimuth) and
                    distance
                  </li>
                  <li>
                    <strong>Intersection Mode:</strong> Draw a line passing through a point at a
                    specific distance
                  </li>
                  <li>
                    <strong>Parallel Mode:</strong> Draw a parallel line (latitude) across the map
                  </li>
                  <li>
                    <strong>Free Hand Mode:</strong> Draw lines interactively by clicking on the map
                    with optional azimuth lock
                  </li>
                  <li>
                    <strong>Drag & Drop:</strong> Drag a point to another point in the layers panel
                    to create a line between them
                  </li>
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
                  <li>
                    Use the <strong>search bar in the top bar</strong> next to the GeoChase title
                  </li>
                  <li>Type an <strong>address, city, or place name</strong></li>
                  <li>View results with their <strong>coordinates</strong> in the dropdown</li>
                  <li>Click a result to <strong>center the map</strong> on that location</li>
                  <li>Create circles or points at the selected location</li>
                </ol>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🗺️ Search Along Path</h4>
                <p class="mb-2">Find locations near your drawn lines and points:</p>
                <ol class="tutorial-list">
                  <li>Draw a <strong>line segment or point</strong> on the map</li>
                  <li>Open the <strong>Layers panel</strong> in the left sidebar</li>
                  <li>Click the <strong>⋮ menu</strong> on a line or point</li>
                  <li>Select <strong>Search Along</strong> from the menu</li>
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
              <p class="mb-3">Manage all your drawings in the left sidebar:</p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Accessing the Layers Panel</h4>
                <ul class="tutorial-list">
                  <li>The layers panel is located in the <strong>left sidebar</strong></li>
                  <li>Toggle the left sidebar using the button on the left edge of the screen</li>
                  <li>All circles, lines, and points are listed in separate sections</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Layer Actions</h4>
                <ul class="tutorial-list">
                  <li><strong>Click item:</strong> Navigate to and center on the shape</li>
                  <li><strong>Click ⋮ menu:</strong> Show options for the shape</li>
                  <li><strong>👁 Hide/Show:</strong> Toggle visibility on the map</li>
                  <li><strong>✏️ Edit:</strong> Modify the shape's properties</li>
                  <li><strong>🗑️ Delete:</strong> Remove the shape permanently</li>
                  <li>
                    <strong>🔍 Search Along:</strong> Find locations near the element (lines and
                    points)
                  </li>
                  <li>
                    <strong>🧭 Navigate:</strong> Use arrow keys to move around the shape (circles
                    and lines)
                  </li>
                  <li>
                    <strong>🧭 Bearings:</strong> View distances and azimuths to all other points
                    (points only)
                  </li>
                  <li><strong>➕ Create with:</strong> Create new shapes from a point</li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">Drag & Drop</h4>
                <p class="mb-2">Quickly create lines between points:</p>
                <ul class="tutorial-list">
                  <li><strong>Drag a point</strong> from the Points section to another point</li>
                  <li>A line will automatically be created connecting the two points</li>
                  <li>The line is named "Point A → Point B" with distance and azimuth info</li>
                  <li>This is the fastest way to connect existing points</li>
                </ul>
              </div>
            </div>
          </v-window-item>

          <!-- Notes -->
          <v-window-item value="notes">
            <div class="tutorial-section">
              <h3 class="mb-3">📝 Notes</h3>
              <p class="mb-3">
                Add notes to your drawings to document important information, observations, or clues:
              </p>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">How to Add Notes</h4>
                <ol class="tutorial-list">
                  <li>Open the <strong>Layers panel</strong> in the left sidebar</li>
                  <li>Click the <strong>⋮ menu</strong> on a circle, line, or point</li>
                  <li>Select <strong>Add note</strong> from the menu</li>
                  <li>Enter a <strong>title</strong> and <strong>content</strong> for your note</li>
                  <li>Click <strong>Save</strong> to attach the note to the element</li>
                </ol>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Managing Notes</h4>
                <ul class="tutorial-list">
                  <li>
                    <strong>View notes on map:</strong> Notes appear as tooltips when you hover over
                    elements on the map
                  </li>
                  <li>
                    <strong>Edit notes:</strong> Click the ⋮ menu and select "Edit note" to modify an
                    existing note
                  </li>
                  <li>
                    <strong>Delete notes:</strong> Click the trash icon in the note tooltip or edit the
                    note and delete it
                  </li>
                  <li><strong>One note per element:</strong> Each element can have only one note</li>
                  <li>
                    <strong>Notes are saved:</strong> Notes are stored with your project and included
                    in exports
                  </li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Use Cases</h4>
                <ul class="tutorial-list">
                  <li>Document clues or hints associated with specific locations</li>
                  <li>Record observations about terrain, landmarks, or features</li>
                  <li>Keep track of why you created a particular circle or line</li>
                  <li>Store calculations, measurements, or reference data</li>
                  <li>Add reminders or next steps for your treasure hunt investigation</li>
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
                  <li>A modal will open with the coordinates pre-filled</li>
                  <li>
                    Enter a <strong>name</strong> for the coordinate (or leave empty for
                    auto-generated address)
                  </li>
                  <li>Click <strong>Save</strong> to add it to your coordinates library</li>
                  <li>Click <strong>Save & Point</strong> to save and create a point on the map</li>
                </ol>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Managing Coordinates</h4>
                <ul class="tutorial-list">
                  <li>
                    Access the coordinates modal from the <strong>top bar</strong> (book icon)
                  </li>
                  <li>View all saved coordinates with their lat/lon values</li>
                  <li>Edit existing coordinates by clicking the pencil icon</li>
                  <li>Delete coordinates by clicking the trash icon</li>
                  <li>Coordinates are sorted by creation date (newest first)</li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">💡 Use Cases</h4>
                <ul class="tutorial-list">
                  <li>Save locations before drawing - all shapes require saved coordinates</li>
                  <li>Build a library of important locations for your treasure hunt</li>
                  <li>Quick reference points for multiple projects</li>
                  <li>Reuse coordinates across different drawings without re-entering them</li>
                  <li>Auto-generated names use reverse geocoding to find addresses</li>
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
                <h4 class="mb-2">Accessing Project Management</h4>
                <ul class="tutorial-list">
                  <li>
                    Click the <strong>save icon</strong> in the top bar to access project options
                  </li>
                  <li>A dropdown menu shows all project actions</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">Project Actions</h4>
                <ul class="tutorial-list">
                  <li><strong>New Project:</strong> Create a new empty project</li>
                  <li>
                    <strong>Load Project:</strong> Switch to another saved project from the modal
                  </li>
                  <li><strong>Export JSON:</strong> Save your project as a JSON file for backup</li>
                  <li><strong>Import JSON:</strong> Load a project from a JSON file</li>
                  <li>
                    <strong>Export GPX:</strong> Export your drawings as GPX for use in other apps
                    (download icon in top bar)
                  </li>
                </ul>
              </div>

              <div class="tutorial-step">
                <h4 class="mb-2">Features</h4>
                <ul class="tutorial-list">
                  <li>Each project stores all your drawings and coordinates separately</li>
                  <li>Projects are saved automatically to your browser's local storage</li>
                  <li>Rename or delete projects from the Load Project modal</li>
                  <li>Export as GPX to use your drawings in other mapping applications</li>
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
                  <li><strong>Z</strong> - Toggle precision mode (magnified lens view)</li>
                  <li><strong>ESC</strong> - Exit navigation mode, precision mode, or cancel free hand drawing</li>
                  <li><strong>Right-click on map</strong> - Save coordinates at that location (also closes precision mode)</li>
                  <li>
                    <strong>ALT</strong> - Hold during free hand drawing to lock azimuth (only when
                    no predefined azimuth)
                  </li>
                  <li><strong>CTRL</strong> - Hold during free hand drawing to lock distance</li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🔍 Precision Mode</h4>
                <p class="mb-2">
                  Precision mode provides a magnified view of the map for accurate positioning:
                </p>
                <ul class="tutorial-list">
                  <li>
                    <strong>Activate:</strong> Press the <strong>Z</strong> key to toggle precision mode
                  </li>
                  <li>
                    <strong>Magnified lens:</strong> A circular lens appears above your cursor showing a 2.5x magnified view
                  </li>
                  <li>
                    <strong>Crosshair:</strong> The center crosshair helps you pinpoint exact locations
                  </li>
                  <li>
                    <strong>Same zoom level:</strong> The lens shows the same map zoom level, just magnified for easier viewing
                  </li>
                  <li>
                    <strong>Deactivate:</strong> Press <strong>Z</strong> again, <strong>ESC</strong>, or <strong>right-click</strong> to exit
                  </li>
                  <li>
                    Use precision mode when placing points, drawing lines, or examining detailed map features
                  </li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🧭 Bearings Analysis</h4>
                <p class="mb-2">
                  Analyze distances and directions between points for treasure hunt navigation:
                </p>
                <ul class="tutorial-list">
                  <li>
                    <strong>Open bearings view</strong> - Click ⋮ menu on any point and select
                    "Bearings"
                  </li>
                  <li>
                    <strong>View calculations</strong> - See distance (km), azimuth (bearing to
                    point), and inverse azimuth (return bearing) for all other points
                  </li>
                  <li><strong>Sort data</strong> - Click column headers to sort by any field</li>
                  <li>
                    <strong>Navigate quickly</strong> - Click any row to close the modal and jump to
                    that point on the map
                  </li>
                  <li>
                    Use bearings to triangulate locations or verify geometric relationships between
                    points
                  </li>
                </ul>
              </div>

              <div class="tutorial-step mb-4">
                <h4 class="mb-2">🎯 Drawing Tips</h4>
                <ul class="tutorial-list">
                  <li>
                    <strong>Save coordinates first</strong> - Right-click on the map to save
                    locations before drawing shapes
                  </li>
                  <li>
                    <strong>Quick line creation</strong> - Drag a point to another point in the
                    layers panel to instantly create a line
                  </li>
                  <li>
                    <strong>Free Hand Mode</strong> - Draw lines interactively by clicking start and
                    end points:
                    <ul>
                      <li>Click on the map to set the start point</li>
                      <li>
                        Move your mouse to preview the line with real-time distance and azimuth
                      </li>
                      <li>
                        Hold <strong>ALT</strong> to lock the azimuth (direction) at the current
                        angle - useful for drawing parallel lines or maintaining specific directions
                      </li>
                      <li>
                        Hold <strong>CTRL</strong> to lock the distance at the current length -
                        useful for drawing multiple lines of the same length
                      </li>
                      <li>The floating tooltip shows whether azimuth or distance is locked</li>
                      <li>Click again to finalize the line</li>
                      <li>
                        When using predefined azimuth lock from the modal, ALT keybind is disabled
                      </li>
                    </ul>
                  </li>
                  <li>Create <strong>multiple line segments</strong> to map routes or paths</li>
                  <li>
                    Use <strong>intersection mode</strong> to draw lines passing through specific
                    points
                  </li>
                  <li>
                    Use <strong>azimuth mode</strong> with precise angles (supports 2 decimal
                    places, e.g., 45.67°) for exact positioning
                  </li>
                  <li><strong>Parallel mode</strong> draws latitude lines across the entire map</li>
                  <li>Names are auto-generated based on locations if left empty</li>
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
  background: transparent;
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
  background-color: transparent;
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
