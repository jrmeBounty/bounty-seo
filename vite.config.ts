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
	// ULTIMATE SOLUTION: Bundle absolutely everything except database drivers
	ssr: {
		// Bundle EVERYTHING - no exceptions except what's explicitly external
		noExternal: true,
		
		// ONLY these specific packages can remain external
		// (They have native bindings that MUST be provided by the runtime)
		external: [
			// Database drivers with native bindings - MUST be external
			"@neondatabase/serverless",
			"pg",
			"pg-native",
			"pg-pool",
			
			// Node built-ins - always available
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
		
		// REMOVED FROM EXTERNAL (will now be bundled):
		// - drizzle-orm (can be bundled)
		// - drizzle-kit (build tool, not needed at runtime anyway)
		// - better-auth (can be bundled)
		// - @sentry/tanstackstart-react (MUST be bundled - was causing your error)
		// - All build tools (not needed at runtime)
	},
});
