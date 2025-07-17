import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@chakra-ui/react",
          ],
        },
      },
    },
  },
  server: {
    port: "8080",
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "@variables": "/src/styles/_variables.scss",
      "@globals": "/src/styles/_globals.scss",
      "@apiConfig": "/src/api.config.js",
      "@config": "/src/config.js",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@variables' as *;`,
      },
    },
  },
});
