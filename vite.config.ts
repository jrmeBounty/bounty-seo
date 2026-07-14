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
	// SSR configuration for Vercel Edge Functions
	// Bundle all dependencies that need to be available at runtime
	ssr: {
		// Don't externalize these packages - bundle them into the server code
		noExternal: [
			// Core React packages
			"react",
			"react-dom",
			// TanStack packages that need to be bundled
			"@tanstack/react-query",
			"@tanstack/react-router",
			"@tanstack/react-start",
			"@tanstack/react-table",
			"@tanstack/react-form",
			"@tanstack/react-store",
			// UI libraries
			"lucide-react",
			"recharts",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			// Utilities that might have ESM issues
			"superjson",
			"date-fns",
		],
		// These can remain external (server-side only packages)
		external: [
			"@neondatabase/serverless",
			"pg",
			"drizzle-orm",
			"better-auth",
		],
	},
});
