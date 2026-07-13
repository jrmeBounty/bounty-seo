/**
 * Role-Based Access Control (RBAC)
 *
 * Defines user roles and permissions throughout the application.
 * Used by tRPC middleware and UI components.
 */

export type UserRole = "admin" | "staff" | "viewer";

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
export const roleHierarchy: Record<UserRole, number> = {
	viewer: 0, // Can only view data
	staff: 1, // Can view and manage assigned locations
	admin: 2, // Full access - can create, update, delete
};

/**
 * Permission definitions
 */
export const permissions = {
	// Location management
	"locations.view": ["viewer", "staff", "admin"],
	"locations.create": ["admin"],
	"locations.update": ["staff", "admin"],
	"locations.delete": ["admin"],

	// Keywords management
	"keywords.view": ["viewer", "staff", "admin"],
	"keywords.create": ["staff", "admin"],
	"keywords.update": ["staff", "admin"],
	"keywords.delete": ["admin"],

	// Rankings
	"rankings.view": ["viewer", "staff", "admin"],
	"rankings.check": ["staff", "admin"], // Manual rank checks

	// Reviews
	"reviews.view": ["viewer", "staff", "admin"],
	"reviews.reply": ["staff", "admin"],
	"reviews.resolve": ["staff", "admin"],
	"reviews.sync": ["staff", "admin"],

	// Citations
	"citations.view": ["viewer", "staff", "admin"],
	"citations.create": ["staff", "admin"],
	"citations.check": ["staff", "admin"],

	// Settings
	"settings.view": ["viewer", "staff", "admin"],
	"settings.update": ["admin"],

	// Website SEO
	"website.view": ["viewer", "staff", "admin"],
	"website.create": ["staff", "admin"],
	"website.update": ["staff", "admin"],

	// Data export
	"data.export": ["staff", "admin"],
	"data.sync": ["admin"],

	// Team management
	"team.view": ["viewer", "staff", "admin"],
	"team.manage": ["admin"],
} as const;

export type Permission = keyof typeof permissions;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(
	userRole: UserRole | null | undefined,
	permission: Permission,
): boolean {
	if (!userRole) return false;
	const allowedRoles = permissions[permission];
	return allowedRoles.includes(userRole);
}

/**
 * Check if a user role is at least as high as the required role
 */
export function hasMinimumRole(
	userRole: UserRole | null | undefined,
	minimumRole: UserRole,
): boolean {
	if (!userRole) return false;
	return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Check if a user is an admin
 */
export function isAdmin(userRole: UserRole | null | undefined): boolean {
	return userRole === "admin";
}

/**
 * Check if a user is a viewer (read-only)
 */
export function isViewer(userRole: UserRole | null | undefined): boolean {
	return userRole === "viewer";
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
	const names: Record<UserRole, string> = {
		admin: "Administrator",
		staff: "Staff Member",
		viewer: "Viewer",
	};
	return names[role];
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
	const colors: Record<UserRole, string> = {
		admin: "#D4A017", // Bounty Gold
		staff: "#3B82F6", // Blue
		viewer: "#6B7280", // Gray
	};
	return colors[role];
}
