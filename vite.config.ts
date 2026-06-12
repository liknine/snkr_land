import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/snkr_land/",
  plugins: [react()],
  build: {
    outDir: "docs",
  },
});
