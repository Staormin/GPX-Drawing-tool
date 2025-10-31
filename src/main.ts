/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue';

// Plugins
import { registerPlugins } from '@/plugins';

// Components
import App from './App.vue';

// Styles
import 'unfonts.css';
import 'leaflet/dist/leaflet.css';
import './styles/vuetify-vars.css';

// Global layout styles for Leaflet container and dark theme
const style = document.createElement('style');
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

  /* Hide scrollbars while keeping scrolling functionality */
  ::-webkit-scrollbar {
    display: none;
  }

  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Make placeholder text more visible */
  input::placeholder,
  textarea::placeholder,
  .v-field input::placeholder,
  .v-field textarea::placeholder {
    opacity: 0.5 !important;
    color: rgba(var(--v-theme-on-surface), 0.5) !important;
  }

  /* Note tooltips on map */
  .note-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .note-tooltip::before {
    display: none !important;
  }

  .note-tooltip-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    max-width: 400px;
    min-width: 200px;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .note-tooltip-card:hover {
    transform: scale(1.02);
  }

  .note-tooltip-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .note-tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .note-tooltip-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
  }

  .note-tooltip-text {
    font-size: 12px;
    color: var(--text);
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.5;
    white-space: pre-wrap;
  }
`;
document.head.append(style);

const app = createApp(App);

registerPlugins(app);

app.mount('#app');
