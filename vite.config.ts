import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

 // https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // 配置开发服务器
  server: {
     host: "::",
     port: 8080,
  },
  // 配置使用的插件
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // 配置路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));