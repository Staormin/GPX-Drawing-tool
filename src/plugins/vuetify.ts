/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify';
// Styles
import '@mdi/font/css/materialdesignicons.css';

import 'vuetify/styles';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0A0E27',
          surface: '#151934',
          'surface-bright': '#1E2440',
          'surface-variant': '#1E2440',
          primary: '#6366F1',
          'primary-darken-1': '#4F46E5',
          secondary: '#8B5CF6',
          'secondary-darken-1': '#7C3AED',
          accent: '#06B6D4',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          success: '#10B981',
          'on-background': '#FFFFFF',
          'on-surface': '#FFFFFF',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
      },
    },
  },
});
