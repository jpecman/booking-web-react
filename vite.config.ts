import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to your REST API during development.
      // Change the target to your API's base URL.
      "/api": {
        target: "https://localhost:7107",
        changeOrigin: true,
        secure: false,  // self-signed certifikát na backendu
      },
    },
  },
});
