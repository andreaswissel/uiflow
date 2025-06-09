import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173
  },
  // Enable TypeScript compilation for source files
  esbuild: {
    target: 'es2020'
  }
});
