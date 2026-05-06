/**
 * build-vercel.mjs
 *
 * Assembles the Vercel Build Output API v3 (.vercel/output) structure from
 * the TanStack Start vite build output (dist/).
 *
 * Structure produced:
 *   .vercel/output/
 *     config.json                          → routing rules
 *     static/                             → copy of dist/client/ (served by Vercel CDN)
 *     functions/
 *       index.func/
 *         .vc-config.json                 → declares Node.js 22.x runtime
 *         index.mjs                       → thin adapter: Web Request → server.fetch → Web Response
 *         dist/server/                    → copy of dist/server/ (the actual SSR bundle)
 */

import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distClient = resolve(root, "dist/client");
const distServer = resolve(root, "dist/server");
const outDir = resolve(root, ".vercel/output");
const staticDir = resolve(outDir, "static");
const funcDir = resolve(outDir, "functions/index.func");

// ── 1. Clean previous output ─────────────────────────────────────────────────
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

// ── 2. Vercel config — routing table ────────────────────────────────────────
//   • Serve /assets/* directly from the CDN (long-lived cache).
//   • Try the filesystem for other static files (favicon, robots.txt, etc.).
//   • Fall back to the SSR function for everything else.
const config = {
  version: 3,
  routes: [
    {
      src: "/assets/(.*)",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index" },
  ],
};
await writeFile(resolve(outDir, "config.json"), JSON.stringify(config, null, 2));
console.log("✓ .vercel/output/config.json");

// ── 3. Static assets (dist/client → .vercel/output/static) ──────────────────
await cp(distClient, staticDir, { recursive: true });
console.log("✓ .vercel/output/static  (copied from dist/client)");

// ── 4. Serverless function ────────────────────────────────────────────────────
await mkdir(funcDir, { recursive: true });

// 4a. Copy the SSR bundle so relative imports (./assets/…) stay intact
await cp(distServer, resolve(funcDir, "dist/server"), { recursive: true });
console.log("✓ .vercel/output/functions/index.func/dist/server  (copied from dist/server)");

// 4b. Runtime config — Node.js 22.x serverless function
const vcConfig = {
  runtime: "nodejs22.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: false,
};
await writeFile(
  resolve(funcDir, ".vc-config.json"),
  JSON.stringify(vcConfig, null, 2),
);
console.log("✓ .vercel/output/functions/index.func/.vc-config.json");

// 4c. Write a minimal package.json so Node.js treats the function as ESM
const funcPackageJson = {
  type: "module",
};
await writeFile(
  resolve(funcDir, "package.json"),
  JSON.stringify(funcPackageJson, null, 2),
);
console.log("✓ .vercel/output/functions/index.func/package.json");

// 4d. Adapter — bridges Vercel's Node http.IncomingMessage to the TanStack
//     Start Web fetch handler exported from dist/server/server.js.
const adapterCode = `
import serverEntry from "./dist/server/server.js";

/**
 * Converts a Node.js IncomingMessage to a Web Platform Request.
 */
async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  const url = new URL(req.url, \`\${protocol}://\${host}\`);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : null;

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(", ") : v;
  }

  return new Request(url.href, {
    method: req.method,
    headers,
    body: body && body.length ? body : undefined,
    // Required when body is a stream/buffer on Node 18+
    duplex: body && body.length ? "half" : undefined,
  });
}

/**
 * Vercel Node.js serverless function entry point.
 */
export default async function handler(req, res) {
  try {
    const request = await toWebRequest(req);
    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    res.statusMessage = response.statusText || "";

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
  } catch (err) {
    console.error("[SSR] Unhandled error:", err);
    res.statusCode = 500;
    res.write("Internal Server Error");
  } finally {
    res.end();
  }
}
`.trimStart();

await writeFile(resolve(funcDir, "index.mjs"), adapterCode);
console.log("✓ .vercel/output/functions/index.func/index.mjs  (adapter written)");

console.log("\n🎉  Vercel Build Output API v3 structure ready at .vercel/output\n");
