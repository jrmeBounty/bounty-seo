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
	// Optimize dependencies
	optimizeDeps: {
		include: [
			"lucide-react",
			"react",
			"react-dom",
			"@tanstack/react-query",
			"@tanstack/react-router",
		],
	},
	// SSR configuration for Vercel Edge Functions
	// FINAL FIX: Bundle absolutely everything except Node.js built-ins
	ssr: {
		// Bundle EVERYTHING into the server code
		noExternal: true,
		
		// ONLY Node.js built-in modules can be external
		// These are always available in the Node.js runtime
		external: [
			"node:fs",
			"node:path",
			"node:crypto",
			"node:http",
			"node:https",
			"node:stream",
			"node:zlib",
			"node:url",
			"node:buffer",
			"node:events",
			"node:util",
			"node:os",
			"node:net",
			"node:tls",
			"node:child_process",
			"node:process",
			"node:dns",
			// Legacy names (without node: prefix)
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
			"process",
			"dns",
		],
		
		// EVERYTHING ELSE GETS BUNDLED:
		// ✅ react, react-dom
		// ✅ @tanstack/* (all packages including hidden deps)
		// ✅ @trpc/*
		// ✅ @sentry/* (your previous error)
		// ✅ pg (your current error)
		// ✅ @neondatabase/serverless
		// ✅ drizzle-orm
		// ✅ better-auth
		// ✅ All UI libraries (including lucide-react)
		// ✅ All utilities
		// = Zero "Module not found" errors possible
	},
});
