# GeoChase

A web-based mapping application for solving geoportail treasure hunts through geographic analysis and location search.

## Features

### Drawing Tools

- **Circles**: Define search areas with center coordinates and radius (km)
- **Line Segments**: Create paths using multiple modes:
  - Two points: Connect saved coordinates
  - Azimuth: Specify bearing angle and distance
  - Intersection: Line passing through a point at specified distance
  - Parallel: Latitude lines across the map
  - Free hand: Interactive drawing with optional azimuth/distance locking
- **Points**: Mark locations on the map
- **Polygons**: Create areas from multiple points (minimum 3)
  - Select points from existing markers
  - Visual representation in light green
  - Extract center point via context menu
- **Drag & Drop**: Create lines by dragging between points in the layers panel

### Location Search

- **Address Search**: Find locations by address, city, or landmark using Geoportail and Nominatim APIs
- **Search Along Path**: Discover locations near drawn lines and points
  - Distance filter: 0.5 - 25 km radius
  - Altitude filter: Filter by elevation range
  - Name filter: Search by location name
- **Elevation Data**: Automatic altitude lookup via Open-Elevation API

### Analysis Tools

- **Bearings**: Calculate distances, azimuths, and inverse azimuths between points
  - Sortable table by name, distance, azimuth, or inverse azimuth
  - Click rows to navigate to points
- **Navigation Mode**: Move along circles and lines using arrow keys
- **Precision Mode**: Magnified lens view (2.5x) for accurate positioning
  - Press 'Z' to toggle precision mode
  - Crosshair overlay for pinpoint accuracy
  - Right-click or ESC to exit
- **Notes**: Add notes to circles, lines, points, and polygons
  - Document clues, observations, and calculations
  - Notes appear as tooltips on map hover
  - One note per element, saved with projects
- **Layer Management**: Show/hide, edit, delete shapes via context menu
  - Polygon-specific: Extract center point as coordinate

### Data Management

- **Projects**: Organize drawings into named projects with auto-save to localStorage
- **Saved Coordinates**: Right-click map to save locations with reverse geocoding
- **Export**: Projects as JSON, drawings as GPX files
- **Import**: Load JSON projects or GPX files

## Installation

```bash
npm install
npm run dev    # Development server at http://localhost:3000
npm run build  # Production build
```

## Usage

1. Right-click map to save coordinates
2. Use drawing tools to create circles, lines, points, and polygons
3. Search for locations by address or along paths
4. Analyze bearings between points
5. Navigate shapes using arrow keys
6. Export work as GPX for external apps

See in-app tutorial (help icon) for detailed instructions.

## Technology Stack

- **Frontend**: Vue 3, Vuetify 3, TypeScript
- **Mapping**: Leaflet 1.9.4, Geoportail tiles
- **APIs**: Geoportail, Overpass API, Open-Elevation, Nominatim
- **State**: Pinia 3, localStorage
- **Build**: Vite 7, ESLint, Prettier

## Project Structure

```
src/
├── components/     # Vue components
├── composables/    # Reusable logic (useMap, useDrawing)
├── pages/         # Main application view
├── services/      # Business logic (geometry, storage, APIs)
├── stores/        # Pinia state management
└── plugins/       # Vuetify, auto-imports
```

## Key Keyboard Shortcuts

- **Z**: Toggle precision mode (magnified lens view)
- **Arrow keys**: Navigate along shapes
- **ESC**: Exit navigation/drawing/precision mode
- **Right-click**: Save coordinates, close precision mode
- **ALT** (free hand): Lock azimuth
- **CTRL** (free hand): Lock distance

## License

[MIT](http://opensource.org/licenses/MIT)
