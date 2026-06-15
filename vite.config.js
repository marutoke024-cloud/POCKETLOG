import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages（プロジェクトサイト）でもサブパスで動くよう相対パス出力にする。
// HashRouter と組み合わせることで 404 を回避。
export default defineConfig({
  base: "./",
  plugins: [react()],
});
