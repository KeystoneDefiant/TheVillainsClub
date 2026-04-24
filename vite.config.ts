import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE?.trim() || "./";

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
