import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Minimal Vite config without Base44
export default defineConfig({
  logLevel: "error", // only show errors
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
