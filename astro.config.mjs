import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  integrations: [tailwind()],
  server: {
    port: 4321,
    host: true,
  },
  build: {
    outDir: "./dist",
  },
});
