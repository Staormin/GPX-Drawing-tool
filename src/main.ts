/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import 'leaflet/dist/leaflet.css'

// Global layout styles for Leaflet container and dark theme
const style = document.createElement('style')
style.textContent = `
  :root {
    --bg: #0f172a;
    --panel: rgba(15, 23, 42, 0.78);
    --panel-border: rgba(148, 163, 184, 0.15);
    --text: #f1f5f9;
    --muted: #94a3b8;
    --accent: #3b82f6;
    --accent-600: #2563eb;
    --accent-700: #1d4ed8;
    --success: #10b981;
    --danger: #ef4444;
    --shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
  }

  html, body, #app {
    height: 100%;
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text);
  }

  .v-app {
    height: 100%;
    background: var(--bg);
  }
`
document.head.append(style)

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
