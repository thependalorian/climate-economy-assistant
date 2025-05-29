import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    strictPort: true, // Exit if port 3000 is already in use
    hmr: {
      port: 3000,
      host: 'localhost', // HMR should still use localhost
    },
    cors: true, // Enable CORS for external domain access
  },
  preview: {
    port: 3000,
    host: true,
    cors: true,
  },
  define: {
    // Ensure environment variables are available
    'process.env.VITE_APP_URL': JSON.stringify(process.env.VITE_APP_URL || 'http://localhost:3000'),
  },
});
