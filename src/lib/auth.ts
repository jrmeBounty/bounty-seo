import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db/index";
import { env } from "#/lib/env";

export const auth = betterAuth({
	// Read from validated env
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,

	// Persist sessions + users in Neon Postgres via Drizzle
	database: drizzleAdapter(db, { provider: "pg" }),

	emailAndPassword: {
		enabled: true,
	},

	socialProviders: {
		// Activated automatically when env vars are present
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			scope: [
				"openid",
				"email",
				"profile",
				"https://www.googleapis.com/auth/business.manage",
			],
			accessType: "offline",
			prompt: "consent",
		},
	},

	plugins: [tanstackStartCookies()],
});
