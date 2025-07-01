import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "build",
  target: "esnext",
  splitting: false,
  sourcemap: true,
  minify: false,
});
