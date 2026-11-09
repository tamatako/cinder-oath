import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // ponytail: relative assets work for both repository Pages and custom domains.
  base: "./",
  plugins: [react()],
});
