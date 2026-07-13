import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { RateLimitType } from "#/lib/rate-limit";
import { checkRateLimit } from "#/lib/rate-limit";
import type { Permission, UserRole } from "#/lib/rbac";
import { hasPermission } from "#/lib/rbac";
import { sanitizeObject } from "#/lib/sanitize";

export interface TRPCContext {
	session: {
		session: any;
		user: {
			id: string;
			email: string;
			name: string;
			role: UserRole;
			[key: string]: any;
		};
	} | null;
}

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

/**
 * Input sanitization middleware
 * Sanitizes all user input to prevent XSS attacks
 */
const sanitizeMiddleware = t.middleware(({ next, input }) => {
	// Sanitize all string inputs recursively
	const sanitizedInput = input ? sanitizeObject(input) : input;

	return next({
		input: sanitizedInput,
	});
});

export const createTRPCRouter = t.router;

/**
 * Public procedure - no authentication required, but input is sanitized
 */
export const publicProcedure = t.procedure.use(sanitizeMiddleware);

/**
 * Protected procedure - requires authentication and sanitizes input
 */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.session.user,
		},
	});
});

/**
 * Admin-only procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (ctx.user.role !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You must be an administrator to perform this action",
		});
	}
	return next({ ctx });
});

/**
 * Staff-or-higher procedure - requires staff or admin role
 */
export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
	const allowedRoles: UserRole[] = ["staff", "admin"];
	if (!allowedRoles.includes(ctx.user.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"You must be a staff member or administrator to perform this action",
		});
	}
	return next({ ctx });
});

/**
 * Permission-based procedure - requires specific permission
 * @param permission - The required permission
 */
export function requirePermission(permission: Permission) {
	return protectedProcedure.use(({ ctx, next }) => {
		if (!hasPermission(ctx.user.role, permission)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `You don't have permission to: ${permission}`,
			});
		}
		return next({ ctx });
	});
}

/**
 * Rate-limited procedure - enforces rate limiting based on operation type
 * @param limitType - The type of rate limit to apply
 */
export function rateLimitedProcedure(limitType: RateLimitType) {
	return protectedProcedure.use(({ ctx, next }) => {
		const result = checkRateLimit(ctx.user.id, limitType);

		if (!result.allowed) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
			});
		}

		// Add rate limit info to context for logging/debugging
		return next({
			ctx: {
				...ctx,
				rateLimit: {
					remaining: result.remaining,
					resetAt: result.resetAt,
				},
			},
		});
	});
}
