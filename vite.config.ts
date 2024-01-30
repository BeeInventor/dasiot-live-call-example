import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "dasiot-live-call-example",
  plugins: [react()],
  server: {
    host: true,
    open: true,
    // https: true, // For local https development
    port: 3002,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
