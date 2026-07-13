/**
 * Permissions Context Provider
 *
 * Makes user permissions available globally throughout the app.
 * Wraps the app root to provide permissions to all components.
 */

import { createContext, type ReactNode, useContext } from "react";
import { authClient } from "#/lib/auth-client";
import type { Permission, UserRole } from "#/lib/rbac";
import { hasPermission, isAdmin, isViewer } from "#/lib/rbac";

interface PermissionsContextValue {
	role: UserRole;
	can: (permission: Permission) => boolean;
	isAdmin: boolean;
	isViewer: boolean;
	isStaffOrAdmin: boolean;
	user: any;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Provider component - wrap your app with this
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
	const { data: session } = authClient.useSession();
	const userRole = (session?.user?.role as UserRole) || "viewer";

	const value: PermissionsContextValue = {
		role: userRole,
		can: (permission: Permission) => hasPermission(userRole, permission),
		isAdmin: isAdmin(userRole),
		isViewer: isViewer(userRole),
		isStaffOrAdmin: userRole === "staff" || userRole === "admin",
		user: session?.user,
	};

	return (
		<PermissionsContext.Provider value={value}>
			{children}
		</PermissionsContext.Provider>
	);
}

/**
 * Hook to access permissions context
 * Use this instead of usePermissions hook if context provider is available
 */
export function usePermissionsContext() {
	const context = useContext(PermissionsContext);
	if (!context) {
		throw new Error(
			"usePermissionsContext must be used within PermissionsProvider. " +
				"Did you forget to wrap your app with <PermissionsProvider>?",
		);
	}
	return context;
}
