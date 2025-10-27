# GeoChase

A powerful, interactive geoportail-based treasure hunt solver for discovering locations, analyzing geographic challenges, and managing spatial data with advanced search and elevation capabilities.

## 🎯 Overview

GeoChase is a web application that helps you solve location-based treasure hunts and geographic puzzles by allowing you to:

- **Draw geographic shapes** (circles, lines, points) to map out challenge areas
- **Search for locations** by address and discover nearby places of interest
- **Find hidden locations** along paths with distance and altitude filtering
- **View elevation data** to analyze terrain and find clues
- **Organize challenges** into projects for multi-step treasure hunts
- **Export findings as GPX** files for navigation apps and sharing

Perfect for solving geocaching challenges, treasure hunt expeditions, geographic puzzles, location-based exploration, and outdoor adventure planning.

## ✨ Key Features

### 🔧 Challenge Mapping Tools

- **Search Radius**: Draw perfect circles to define search areas and challenge zones
- **Path Analysis**: Create lines with multiple modes to analyze clue paths:
  - **Coordinate Mode**: Connect waypoints by their exact coordinates
  - **Azimuth Mode**: Calculate bearings and distances from known locations
  - **Intersection Mode**: Find where clue paths converge
- **Waypoint Marking**: Mark specific locations and clue points
- **Color Coding**: Organize different treasure hunts and challenge types

### 🔍 Treasure Discovery

- **Location Search**: Find clues by address, city, or landmark name
- **Path Exploration**: Discover hidden locations near challenge paths
  - Adjustable search radius (0.5 - 25 km)
  - Filter by elevation (find altitude-specific clues)
  - Filter by location type (POIs, landmarks, amenities)
- **Elevation Analysis**: Automatic terrain data for each location

### 🗺️ Spatial Analysis

- **Navigation Mode**: Move along circles and line segments using arrow keys
- **Elevation Data**: View and filter by altitude for terrain analysis
- **Distance Calculations**: Calculate distances between points and lines
- **Buffer Visualization**: See search zones on the map

### 💾 Project Management

- **Save/Load Projects**: Organize work into separate geographic projects
- **Auto-save**: Projects are automatically saved to browser storage
- **Import/Export**: Share projects as JSON or GPX files
- **Multi-project Support**: Switch between different projects seamlessly

### 📌 Coordinate Management

- **Save Coordinates**: Right-click on the map to save locations
- **Reusable Coordinates**: Quick access across all drawing tools
- **Coordinate Display**: View saved coordinates with elevation data
- **Named Locations**: Give meaningful names to frequently-used places

### 🏘️ Map Integration

- **Interactive Map**: Leaflet-based map with French Geoportail tiles
- **Multiple Search Sources**: OSM Nominatim and Overpass API integration
- **Elevation API**: Open-Elevation API for altitude data
- **Zoom-Responsive Navigation**: Movement speed adjusts based on zoom level

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server (available at http://localhost:3000)
npm run dev

# Build for production
npm run build
```

### Using GeoSketch

1. **Click on drawing tools** in the sidebar to start creating shapes
2. **Use the search feature** to find locations by address
3. **Draw on the map** to create circles, lines, and points
4. **Right-click on the map** to save coordinates
5. **Explore locations** using the search-along-path feature
6. **Save your project** to persist your work
7. **Export as GPX** to use in other applications

For detailed instructions, open the **Tutorial** (help icon) within the application.

## 🛠️ Technology Stack

### Frontend

- **Vue 3**: Modern reactive UI framework
- **Vuetify 3**: Material Design component library
- **TypeScript**: Static type checking for robust code
- **Leaflet 1.9**: Interactive mapping library

### State Management

- **Pinia 3**: Vue state management
- **Browser Storage**: LocalStorage for project persistence

### Mapping & Geospatial

- **Leaflet**: Map rendering
- **Geoportail API**: French map tiles and address search
- **Overpass API**: Location discovery from OpenStreetMap
- **Open-Elevation API**: Global elevation data
- **Turf.js**: Geospatial analysis library

### Build & Development

- **Vite 7**: Fast build tool and dev server
- **ESLint**: Code quality and linting
- **Prettier**: Code formatting
- **vue-tsc**: Vue component type checking

## 📊 Use Cases

- **Treasure Hunt Solving**: Systematically solve multi-location treasure hunts
- **Geocaching**: Find cache locations using search tools and clue mapping
- **Urban Exploration**: Discover interesting locations based on clues
- **Rally Navigation**: Plan routes and find checkpoints with precision
- **Geoportail Challenges**: Solve location-based puzzles from Geoportail treasure hunts
- **Route Planning**: Analyze clue paths and waypoints with elevation data
- **Findings Sharing**: Export discovered locations as GPX for navigation apps

## 📈 Architecture

```
src/
├── components/          # Vue components (modals, panels, search)
├── composables/         # Reusable logic (map, drawing, navigation)
├── pages/              # Page-level components (main map view)
├── services/           # Business logic (geometry, storage, API)
├── stores/             # Pinia state management
├── styles/             # Global SCSS styling
└── plugins/            # Vue plugins (Vuetify, auto-imports)
```

### Key Modules

- **Geometry Service**: Vincenty formulas, distance calculations, coordinate transformations
- **Geoportail Service**: Map tiles, address search, location discovery
- **Storage Service**: Project persistence, coordinate management, GPX export
- **Drawing Composable**: Circle, line, and point rendering
- **Map Composable**: Leaflet integration and event handling

## 🎨 User Interface

- **Sidebar**: Drawing tools, search, coordinates, layers management
- **Main Map**: Interactive Leaflet map for visualization
- **Layers Panel**: Manage all drawn shapes (visibility, editing, deletion)
- **Search Results**: Filter and explore location discoveries
- **Tutorial Modal**: Comprehensive in-app documentation

## 📝 Features in Detail

### Drawing Workflows

1. **Circle Creation**: Specify center, name, and radius
2. **Line Drawing**: Choose mode (coordinates, azimuth, or intersection)
3. **Point Marking**: Quick location marking on the map
4. **Layer Management**: Edit, hide, or delete shapes

### Search Workflows

1. **Address Search**: Type location → view results with elevation
2. **Path Search**: Draw shape → find nearby locations
3. **Altitude Filtering**: Narrow results by elevation range
4. **Result Selection**: Click to mark on map or use for drawing

### Project Workflows

1. **New Project**: Start fresh work
2. **Save Project**: Auto-saves to browser
3. **Load Project**: Switch between saved projects
4. **Export/Import**: Share as GPX or JSON

## 🔗 External APIs

- **Geoportail**: French government mapping and address search
- **Overpass API**: OpenStreetMap location queries
- **Open-Elevation**: Global elevation data lookup
- **Nominatim**: OSM address geocoding

## 💾 Data Storage

- **Browser LocalStorage**: Projects stored locally (no server required)
- **Export Formats**: GPX files for compatibility with other tools
- **Automatic Saving**: Projects auto-save to browser storage
- **No Account Required**: All data stays on your device

## 🎓 Learning Resources

- **In-app Tutorial**: Open the help icon (?) for comprehensive documentation
- **Interactive Map**: Learn by exploring the interface
- **Keyboard Shortcuts**: Arrow keys for navigation, ESC to exit modes

## 📋 System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for map tiles and location services
- No additional software required

## 🤝 Contributing

This is a personal project focused on geographic data exploration and mapping.

## 📑 License

[MIT](http://opensource.org/licenses/MIT)

## 🙏 Acknowledgments

Built with modern web technologies including:

- [Vue 3](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [Leaflet](https://leafletjs.com/)
- [Turf.js](https://turfjs.org/)
- [Geoportail IGN](https://www.geoportail.gouv.fr/)
- [Overpass API](https://overpass-api.de/)
- [Open-Elevation](https://www.open-elevation.com/)
