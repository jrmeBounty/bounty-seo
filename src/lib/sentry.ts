import * as Sentry from "@sentry/tanstackstart-react";

/**
 * Wrap a server function with Sentry tracing
 * Use this for all createServerFn implementations
 */
export function withSentryServerSpan<T>(
	spanName: string,
	fn: () => Promise<T>,
): Promise<T> {
	return Sentry.startSpan({ name: spanName }, async () => {
		try {
			return await fn();
		} catch (error) {
			Sentry.captureException(error);
			throw error;
		}
	});
}

/**
 * Manually capture an exception to Sentry
 */
export function captureException(
	error: unknown,
	context?: Record<string, any>,
) {
	if (context) {
		Sentry.setContext("additional", context);
	}
	Sentry.captureException(error);
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(
	message: string,
	level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info",
) {
	Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
	id: string;
	email?: string;
	username?: string;
}) {
	Sentry.setUser(user);
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
	Sentry.setUser(null);
}
