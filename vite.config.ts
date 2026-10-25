import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Only cache app shell (built HTML/JS/CSS/fonts/icons). Never cache or queue Supabase requests.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        // Do not cache any API / Supabase calls
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
      },
      manifest: {
        name: 'Vidya Valley Stats Machine',
        short_name: 'StatsMachine',
        description: 'Vidya Valley U-16 basketball scorekeeping app',
        theme_color: '#0B2545',
        background_color: '#F4F7FB',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
});
