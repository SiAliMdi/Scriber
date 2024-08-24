import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dotenv from 'dotenv';

// https://vitejs.dev/config/

dotenv.config({ path: '.env.local' });
const host = process.env.FRONTEND_HOST;
const port = Number(process.env.FRONTEND_PORT);

export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
})
