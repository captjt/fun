import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "./",
  publicDir: resolve(__dirname, "assets"),
  build: {
    outDir: resolve(__dirname, "../../public/games/gary-world"),
    emptyOutDir: true,
  },
});
