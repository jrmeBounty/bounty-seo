/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup with Zod.
 * Fails fast if configuration is invalid, preventing runtime errors.
 */

import { z } from "zod";

const envSchema = z.object({
	// Database (Required)
	DATABASE_URL: z
		.string()
		.url("DATABASE_URL must be a valid URL")
		.startsWith(
			"postgres",
			"DATABASE_URL must be a PostgreSQL connection string",
		),

	// Auth (Required)
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
		.describe("Secret key for session encryption"),

	BETTER_AUTH_URL: z
		.string()
		.url()
		.optional()
		.default("http://localhost:3000")
		.describe("Base URL for auth callbacks"),

	// Google OAuth (Required for auth)
	GOOGLE_CLIENT_ID: z
		.string()
		.min(1, "GOOGLE_CLIENT_ID is required")
		.describe("Google OAuth Client ID"),

	GOOGLE_CLIENT_SECRET: z
		.string()
		.min(1, "GOOGLE_CLIENT_SECRET is required")
		.describe("Google OAuth Client Secret"),

	// Google APIs (Optional - used for SEO features)
	GOOGLE_MAPS_API_KEY: z
		.string()
		.optional()
		.describe("Google Maps API key for ranking checks"),

	// Monitoring (Optional)
	SENTRY_DSN: z
		.string()
		.url()
		.optional()
		.describe("Sentry DSN for error tracking"),

	// Email (Optional - for notifications)
	RESEND_API_KEY: z
		.string()
		.optional()
		.describe("Resend API key for email notifications"),

	// Node Environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Import this instead of process.env to ensure type safety
 */
export const env = (() => {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("❌ Environment variable validation failed:");
			console.error("");

			for (const issue of error.issues) {
				const path = issue.path.join(".");
				console.error(`  • ${path}: ${issue.message}`);
			}

			console.error("");
			console.error(
				"💡 Check your .env.local file and ensure all required variables are set.",
			);
			console.error("📖 See .env.example for reference.");

			// Exit in production, throw in development
			if (process.env.NODE_ENV === "production") {
				process.exit(1);
			}
			throw error;
		}
		throw error;
	}
})();

/**
 * Feature flags based on environment configuration
 */
export const features = {
	/** Google Maps ranking checks enabled */
	hasGoogleMaps: !!env.GOOGLE_MAPS_API_KEY,

	/** Sentry error tracking enabled */
	hasSentry: !!env.SENTRY_DSN,

	/** Email notifications enabled */
	hasEmail: !!env.RESEND_API_KEY,

	/** Production environment */
	isProduction: env.NODE_ENV === "production",

	/** Development environment */
	isDevelopment: env.NODE_ENV === "development",
} as const;

// Log feature flags in development (non-sensitive status only)
if (features.isDevelopment) {
	console.log("🔧 Feature flags:");
	console.log(`  Google Maps API: ${features.hasGoogleMaps ? "✅" : "❌"}`);
	console.log(`  Sentry: ${features.hasSentry ? "✅" : "❌"}`);
	console.log(`  Email: ${features.hasEmail ? "✅" : "❌"}`);
}
