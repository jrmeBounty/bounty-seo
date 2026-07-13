// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import neon from "./neon-vite-plugin.ts";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		neon,
		tailwindcss(),
		tanstackStart({
			server: {
				// @ts-expect-error – 'preset' not in declared type for this Start version
				preset: isVercel ? "vercel" : "node",
			},
		}),
		viteReact(),
	],
	// ↓ Remove noExternal: true entirely.
	// Only list packages that are GENUINELY ESM-only and fail as Node externals.
	// Leave this array empty for now — add to it only if a specific package
	// throws "ERR_REQUIRE_ESM" as an external.
	ssr: {
		noExternal: [],
	},
});
