import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/babylon-lite-arkanoid-clone/",
  plugins: [react()],
  root: "neon-breaker-duo",
  server: {
    fs: {
      allow: [repositoryRoot],
    },
  },
});

