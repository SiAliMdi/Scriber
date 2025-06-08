import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";

// https://vitejs.dev/config/

dotenv.config({ path: ".env.local" });
const host = process.env.FRONTEND_HOST;
const port = Number(process.env.FRONTEND_PORT);

export default defineConfig({
  // import postcss from 'vite-plugin-postcss';
  plugins: [react()],
  server: {
    host,
    port,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          "react-vendor": [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-toast",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
            "@radix-ui/react-slot",
          ],
          "table-vendor": ["@tanstack/react-table"],
          utils: ["axios", "clsx", "lodash", "jsonrepair"],
          editor: ["json-edit-react"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    reportCompressedSize: true, // Report compressed size in the build report
    sourcemap: false, 
  },
});
