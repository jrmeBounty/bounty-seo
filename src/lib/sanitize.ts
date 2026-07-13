/**
 * Input Sanitization Utilities
 *
 * Sanitizes user input to prevent XSS attacks and ensure data integrity.
 * Used by tRPC middleware and form handlers.
 */

/**
 * Sanitize a string by removing potentially dangerous HTML/script tags
 */
export function sanitizeString(input: string): string {
	if (typeof input !== "string") return "";

	return (
		input
			// Remove script tags and their content
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			// Remove iframe tags
			.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
			// Remove object/embed tags
			.replace(/<(object|embed|applet)[^>]*>.*?<\/\1>/gi, "")
			// Remove event handlers (onclick, onerror, etc.)
			.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
			.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")
			// Remove javascript: protocols
			.replace(/javascript:/gi, "")
			// Remove data: protocols (can be used for XSS)
			.replace(/data:text\/html/gi, "")
			// Trim whitespace
			.trim()
	);
}

/**
 * Recursively sanitize all string values in an object
 */
export function sanitizeObject<T>(obj: T): T {
	if (obj === null || obj === undefined) return obj;

	if (typeof obj === "string") {
		return sanitizeString(obj) as T;
	}

	if (Array.isArray(obj)) {
		return obj.map(sanitizeObject) as T;
	}

	if (typeof obj === "object") {
		const sanitized: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			sanitized[key] = sanitizeObject(value);
		}
		return sanitized as T;
	}

	return obj;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
	if (typeof email !== "string") return "";

	// Basic email validation pattern
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const cleaned = email.trim().toLowerCase();

	if (!emailPattern.test(cleaned)) {
		throw new Error("Invalid email address format");
	}

	return cleaned;
}

/**
 * Sanitize URL - ensure it's a valid http/https URL
 */
export function sanitizeUrl(url: string): string {
	if (typeof url !== "string") return "";

	const cleaned = url.trim();

	// Only allow http and https protocols
	if (!cleaned.match(/^https?:\/\//i)) {
		throw new Error("URL must start with http:// or https://");
	}

	try {
		const parsed = new URL(cleaned);
		// Reject javascript: data: file: protocols
		if (!["http:", "https:"].includes(parsed.protocol)) {
			throw new Error("Invalid URL protocol");
		}
		return parsed.toString();
	} catch {
		throw new Error("Invalid URL format");
	}
}

/**
 * Sanitize phone number - remove all non-digit characters except +
 */
export function sanitizePhone(phone: string): string {
	if (typeof phone !== "string") return "";

	// Keep only digits, spaces, hyphens, parentheses, and + sign
	return phone.replace(/[^\d\s\-()+]/g, "").trim();
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(
	value: any,
	options?: { min?: number; max?: number },
): number {
	const num = Number(value);

	if (Number.isNaN(num)) {
		throw new Error("Invalid number format");
	}

	if (options?.min !== undefined && num < options.min) {
		throw new Error(`Number must be at least ${options.min}`);
	}

	if (options?.max !== undefined && num > options.max) {
		throw new Error(`Number must be at most ${options.max}`);
	}

	return num;
}

/**
 * Sanitize latitude/longitude coordinates
 */
export function sanitizeCoordinates(
	lat: any,
	lng: any,
): { lat: number; lng: number } {
	const latitude = sanitizeNumber(lat, { min: -90, max: 90 });
	const longitude = sanitizeNumber(lng, { min: -180, max: 180 });

	return { lat: latitude, lng: longitude };
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
	if (typeof text !== "string") return "";

	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"/": "&#x2F;",
	};

	return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize filename - remove path traversal attempts and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
	if (typeof filename !== "string") return "";

	return (
		filename
			// Remove path traversal attempts
			.replace(/\.\./g, "")
			// Remove path separators
			.replace(/[/\\]/g, "")
			// Remove null bytes
			.replace(/\0/g, "")
			// Limit to safe characters
			.replace(/[^a-zA-Z0-9._-]/g, "_")
			.trim()
			.slice(0, 255)
	); // Limit length
}

/**
 * tRPC middleware helper - sanitizes all input before reaching the procedure
 */
export function createSanitizationMiddleware() {
	return {
		sanitizeInput: (input: any) => {
			// Don't sanitize if input is undefined or null
			if (input === undefined || input === null) return input;

			// For objects and arrays, recursively sanitize
			if (typeof input === "object") {
				return sanitizeObject(input);
			}

			// For primitives, return as-is (numbers, booleans)
			return input;
		},
	};
}
