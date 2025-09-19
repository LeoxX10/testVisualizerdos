import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Escucha en todas las interfaces de red
    port: 3000,
        allowedHosts: ['facilities-administrator.gl.at.ply.gg']
  },
});