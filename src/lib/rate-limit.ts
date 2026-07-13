/**
 * Rate Limiting Utilities
 *
 * In-memory rate limiter for expensive operations (API calls, sync operations).
 * Uses sliding window algorithm with per-user tracking.
 *
 * NOTE: This is in-memory only. For production multi-instance deployments,
 * consider using Redis or a distributed rate limiter.
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration presets
 */
export const rateLimits = {
	/** Google Maps API calls - 10 per minute per user */
	googleMapsCheck: {
		maxRequests: 10,
		windowMs: 60 * 1000, // 1 minute
	},

	/** Review sync - 5 per hour per user */
	reviewSync: {
		maxRequests: 5,
		windowMs: 60 * 60 * 1000, // 1 hour
	},

	/** Citation check - 10 per hour per user */
	citationCheck: {
		maxRequests: 10,
		windowMs: 60 * 60 * 1000, // 1 hour
	},

	/** Sync all locations - 1 per 10 minutes per user */
	syncAll: {
		maxRequests: 1,
		windowMs: 10 * 60 * 1000, // 10 minutes
	},

	/** Website crawl - 5 per hour per user */
	websiteCrawl: {
		maxRequests: 5,
		windowMs: 60 * 60 * 1000, // 1 hour
	},

	/** Data export - 10 per hour per user */
	dataExport: {
		maxRequests: 10,
		windowMs: 60 * 60 * 1000, // 1 hour
	},
} as const;

export type RateLimitType = keyof typeof rateLimits;

/**
 * Check if a request should be rate limited
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
	userId: string,
	limitType: RateLimitType,
): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfter?: number;
} {
	const config = rateLimits[limitType];
	const key = `${userId}:${limitType}`;
	const now = Date.now();

	// Get or create rate limit entry
	let entry = rateLimitStore.get(key);

	// Reset if window has passed
	if (!entry || now > entry.resetAt) {
		entry = {
			count: 0,
			resetAt: now + config.windowMs,
		};
		rateLimitStore.set(key, entry);
	}

	// Check if limit exceeded
	if (entry.count >= config.maxRequests) {
		const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // seconds
		return {
			allowed: false,
			remaining: 0,
			resetAt: entry.resetAt,
			retryAfter,
		};
	}

	// Increment counter
	entry.count += 1;

	return {
		allowed: true,
		remaining: config.maxRequests - entry.count,
		resetAt: entry.resetAt,
	};
}

/**
 * Reset rate limit for a specific user and operation (useful for testing or admin override)
 */
export function resetRateLimit(userId: string, limitType: RateLimitType): void {
	const key = `${userId}:${limitType}`;
	rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
	userId: string,
	limitType: RateLimitType,
): { count: number; limit: number; remaining: number; resetAt: number } {
	const config = rateLimits[limitType];
	const key = `${userId}:${limitType}`;
	const now = Date.now();

	const entry = rateLimitStore.get(key);

	// If no entry or expired
	if (!entry || now > entry.resetAt) {
		return {
			count: 0,
			limit: config.maxRequests,
			remaining: config.maxRequests,
			resetAt: now + config.windowMs,
		};
	}

	return {
		count: entry.count,
		limit: config.maxRequests,
		remaining: Math.max(0, config.maxRequests - entry.count),
		resetAt: entry.resetAt,
	};
}

/**
 * Cleanup expired entries (call periodically to prevent memory leaks)
 * Run this in a background job or cron
 */
export function cleanupExpiredRateLimits(): number {
	const now = Date.now();
	let cleaned = 0;

	for (const [key, entry] of rateLimitStore.entries()) {
		if (now > entry.resetAt) {
			rateLimitStore.delete(key);
			cleaned += 1;
		}
	}

	return cleaned;
}

/**
 * Get all active rate limits (for monitoring/debugging)
 */
export function getAllRateLimits(): Array<{
	key: string;
	count: number;
	resetAt: number;
}> {
	const now = Date.now();
	const active: Array<{ key: string; count: number; resetAt: number }> = [];

	for (const [key, entry] of rateLimitStore.entries()) {
		if (now <= entry.resetAt) {
			active.push({ key, count: entry.count, resetAt: entry.resetAt });
		}
	}

	return active;
}

/**
 * tRPC middleware helper - enforces rate limiting on procedures
 */
export function createRateLimitError(retryAfter: number): Error {
	const error = new Error(
		`Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
	);
	(error as any).code = "TOO_MANY_REQUESTS";
	(error as any).retryAfter = retryAfter;
	return error;
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
	setInterval(
		() => {
			const cleaned = cleanupExpiredRateLimits();
			if (cleaned > 0) {
				console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`);
			}
		},
		5 * 60 * 1000,
	);
}
