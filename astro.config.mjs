// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import serviceWorker from "./scripts/astro-service-worker.mjs";

export default defineConfig({
  site: "https://pharmarevision.vercel.app",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [react(), serviceWorker()],
  vite: {
    plugins: [tailwindcss()],
  },
});
