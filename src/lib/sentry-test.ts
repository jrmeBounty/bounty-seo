/**
 * Sentry Test Utilities
 *
 * Use these functions to test your Sentry integration
 */

import { captureException, captureMessage } from "./sentry";

/**
 * Test function to trigger a Sentry error
 * Call this from your browser console or a test button
 */
export function testSentryError() {
	try {
		throw new Error(
			"🚨 Test Sentry Error - If you see this in Sentry dashboard, it works!",
		);
	} catch (error) {
		captureException(error, {
			test: true,
			timestamp: new Date().toISOString(),
			source: "testSentryError function",
		});
		console.log(
			"✅ Test error sent to Sentry. Check your dashboard at https://sentry.io/",
		);
	}
}

/**
 * Test function to send a message to Sentry
 */
export function testSentryMessage() {
	captureMessage("📨 Test Sentry Message - Integration working!", "info");
	console.log(
		"✅ Test message sent to Sentry. Check your dashboard at https://sentry.io/",
	);
}

/**
 * Simulate a real error scenario
 */
export function simulateNetworkError() {
	try {
		// Simulate a failed API call
		throw new Error("Network request failed: Failed to fetch rankings data");
	} catch (error) {
		captureException(error, {
			endpoint: "/api/trpc/rankings.list",
			method: "GET",
			statusCode: 500,
		});
		console.error("❌ Network error captured by Sentry");
	}
}

// Make functions available in browser console during development
if (typeof window !== "undefined" && import.meta.env.DEV) {
	// Only log once per session using a flag
	const hasLogged = sessionStorage.getItem("sentry-test-logged");

	// @ts-expect-error
	window.testSentry = {
		error: testSentryError,
		message: testSentryMessage,
		networkError: simulateNetworkError,
	};

	// Only log on first load of the session
	if (!hasLogged) {
		console.log(
			"%c🔧 Sentry Test Utils Available",
			"color: #D4A017; font-weight: bold",
		);
		console.log(
			"%cType window.testSentry to see available test functions",
			"color: #9CA3AF; font-size: 11px",
		);
		sessionStorage.setItem("sentry-test-logged", "true");
	}
}
