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
        colors: {
          background: '#121212',
          surface: '#1e1e1e',
          primary: '#2196F3',
          secondary: '#90CAF9',
          accent: '#03DAC6',
          error: '#CF6679',
          warning: '#FFA726',
          info: '#64B5F6',
          success: '#81C784',
        },
      },
    },
  },
});
