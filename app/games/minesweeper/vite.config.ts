import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "../../public/games/minesweeper"),
    emptyOutDir: true,
  },
});
