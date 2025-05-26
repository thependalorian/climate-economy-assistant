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
  },
  preview: {
    port: 3000,
    host: true,
  },
});
