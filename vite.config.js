import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/v4\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.origin.includes('supabase.co') || (url.origin.includes('mapbox.com') && !url.pathname.startsWith('/v4/')),
            handler: 'NetworkOnly', // Do not cache API calls
          }
        ],
      },
      manifest: {
        name: 'AXiM Weather',
        short_name: 'AXiM',
        description: 'AXiM Weather application',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    historyApiFallback: true,
  },
   build: {
    outDir: 'dist',
    sourcemap: true
  },
});
