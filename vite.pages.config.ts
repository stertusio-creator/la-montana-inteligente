import { renameSync, rmSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function flattenIndex(): Plugin {
  return {
    name: "flatten-pages-index",
    apply: "build",
    closeBundle() {
      renameSync("dist-pages/pages/index.html", "dist-pages/index.html");
      rmSync("dist-pages/pages", { recursive: true, force: true });
    },
  };
}

/** Static build for GitHub Pages at /la-montana-inteligente/. */
export default defineConfig({
  base: "/la-montana-inteligente/",
  plugins: [tailwindcss(), viteReact(), flattenIndex()],
  resolve: { tsconfigPaths: true },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      input: "pages/index.html",
    },
  },
});
