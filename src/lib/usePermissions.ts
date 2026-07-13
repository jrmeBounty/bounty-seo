/**
 * React Hook for Permission Checks
 *
 * Provides easy access to user role and permission checking in components.
 */

import { authClient } from "#/lib/auth-client";
import type { Permission, UserRole } from "#/lib/rbac";
import { hasPermission, isAdmin, isViewer } from "#/lib/rbac";

export function usePermissions() {
	const { data: session } = authClient.useSession();
	const userRole = (session?.user?.role as UserRole) || "viewer";

	return {
		/** Current user role */
		role: userRole,

		/** Check if user has a specific permission */
		can: (permission: Permission) => hasPermission(userRole, permission),

		/** Check if user is an admin */
		isAdmin: isAdmin(userRole),

		/** Check if user is a viewer (read-only) */
		isViewer: isViewer(userRole),

		/** Check if user can perform staff-level actions */
		isStaffOrAdmin: userRole === "staff" || userRole === "admin",

		/** User session data */
		user: session?.user,
	};
}
