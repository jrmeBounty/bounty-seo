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
	// CRITICAL: Bundle ALL packages that need to be available at runtime
	ssr: {
		// OPTION 1: Bundle everything (safest, but larger bundle)
		// noExternal: true,
		
		// OPTION 2: Explicitly list packages to bundle (current approach)
		// Don't externalize these packages - bundle them into the server code
		noExternal: [
			// ===== Core React packages =====
			"react",
			"react-dom",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			
			// ===== TanStack Core packages (CRITICAL for Vercel) =====
			// Router packages
			"@tanstack/react-router",
			"@tanstack/router-core",
			"@tanstack/router-vite-plugin",
			"@tanstack/react-router-devtools",
			"@tanstack/react-router-ssr-query",
			
			// Start framework
			"@tanstack/react-start",
			"@tanstack/start",
			
			// Query packages
			"@tanstack/react-query",
			"@tanstack/react-query-devtools",
			"@tanstack/query-core",
			
			// Table
			"@tanstack/react-table",
			"@tanstack/table-core",
			
			// Form
			"@tanstack/react-form",
			"@tanstack/form-core",
			
			// Store
			"@tanstack/react-store",
			"@tanstack/store",
			
			// Match sorter
			"@tanstack/match-sorter-utils",
			
			// AI packages (if used)
			"@tanstack/ai",
			"@tanstack/ai-react",
			"@tanstack/ai-client",
			
			// ===== tRPC packages =====
			"@trpc/client",
			"@trpc/server",
			"@trpc/tanstack-react-query",
			
			// ===== UI libraries =====
			"lucide-react",
			"recharts",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			"radix-ui",
			
			// ===== Utilities that might have ESM issues =====
			"superjson",
			"date-fns",
			"zod",
			"cheerio",
			"isomorphic-dompurify",
			"highlight.js",
			"streamdown",
			"tw-animate-css",
		],
		
		// These MUST remain external (server-side only, have native bindings)
		external: [
			"@neondatabase/serverless",
			"pg",
			"drizzle-orm",
			"drizzle-kit",
			"better-auth",
			"@sentry/tanstackstart-react",
		],
	},
});
