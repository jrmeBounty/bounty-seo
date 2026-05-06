import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import neon from "./neon-vite-plugin.ts";

const isVercel = !!process.env.VERCEL;

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    neon,
    tailwindcss(),
    tanstackStart({
      server: {
        // @ts-ignore – 'preset' is not in the declared type for this Start
        // version, but the underlying server layer respects it at runtime.
        preset: isVercel ? "vercel" : "node",
      },
    }),
    viteReact(),
  ],
});

export default config;
