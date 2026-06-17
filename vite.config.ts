import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Extension pages disallow inline scripts; modulepreload polyfill is unnecessary here
    modulePreload: false,
    target: "chrome120",
  },
});
