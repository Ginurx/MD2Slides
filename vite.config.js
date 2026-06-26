import path from "node:path";
import { defineConfig } from "vite";
import { createSlidesPlugin, resolveDeckOptions } from "./src/node/slidesPlugin.js";

const deckOptions = resolveDeckOptions({
  rootDir: process.cwd(),
  sourcePath: process.env.MD2SLIDES_SOURCE,
  title: process.env.MD2SLIDES_TITLE,
  outDir: process.env.MD2SLIDES_OUT_DIR
});

export default defineConfig({
  base: "./",
  plugins: [createSlidesPlugin(deckOptions)],
  build: {
    outDir: deckOptions.outDir,
    emptyOutDir: true
  },
  server: {
    fs: {
      allow: [process.cwd(), path.dirname(deckOptions.sourcePath)]
    },
    open: process.env.MD2SLIDES_OPEN !== "0"
  }
});
