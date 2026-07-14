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
	// COMPREHENSIVE SOLUTION: Bundle everything except server-only packages
	ssr: {
		// ===== OPTION 1: SAFEST - Bundle EVERYTHING =====
		// This ensures no package is ever missed
		noExternal: true,
		
		// Only these specific packages remain external
		// (They have native bindings or Vercel provides them)
		external: [
			// Database packages (native bindings)
			"@neondatabase/serverless",
			"pg",
			"pg-native",
			"pg-pool",
			"pg-query-stream",
			
			// ORM packages (server-only, optimized by Vercel)
			"drizzle-orm",
			"drizzle-kit",
			
			// Auth (may have native crypto dependencies)
			"better-auth",
			
			// Monitoring (large, Vercel optimizes it)
			"@sentry/tanstackstart-react",
			"@sentry/node",
			"@sentry/core",
			
			// Build tools (never needed at runtime)
			"vite",
			"@vitejs/plugin-react",
			"@tanstack/router-plugin",
			"@tanstack/devtools-vite",
			"@tailwindcss/vite",
			"biome",
			"typescript",
			"tsx",
			"vitest",
			
			// Node built-ins (always available)
			"fs",
			"path",
			"crypto",
			"http",
			"https",
			"stream",
			"zlib",
			"url",
			"buffer",
			"events",
			"util",
			"os",
			"net",
			"tls",
			"child_process",
		],
	},
});
