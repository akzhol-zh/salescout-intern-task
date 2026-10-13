import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/reprice": "http://localhost:3000" },
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  build: { outDir: "../dist", emptyOutDir: true },
});
