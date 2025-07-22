import { defineConfig } from "vite";
import ssrgPlugin from "vite-plugin-ssr-ssg";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ssrgPlugin({
      mode: "ssg", // Static Site Generation only
      generate: {
        routes: ["/", "/query", "/upload"],
        minify: true,
        fallback: "index.html"
      }
    }),
  ],
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
      "@": "/src",
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
