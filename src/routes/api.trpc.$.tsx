import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "#/integrations/trpc/router";
import { auth } from "#/lib/auth";

async function handler({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext: () => ({ session }),
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
});
