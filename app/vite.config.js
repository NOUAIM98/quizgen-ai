import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
});
