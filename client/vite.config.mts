import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig(async () => {
  const [{ default: react }, { default: tailwindcss }] = await Promise.all([
    import("@vitejs/plugin-react"),
    import("@tailwindcss/vite"),
  ]);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
