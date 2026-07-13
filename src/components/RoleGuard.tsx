/**
 * Role-Based UI Guards
 *
 * Reusable components for conditionally rendering UI based on user permissions.
 * Used throughout the app to hide/disable mutation actions for viewers.
 */

import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type { Permission } from "#/lib/rbac";
import { usePermissions } from "#/lib/usePermissions";

/**
 * Props for role guard components
 */
interface RoleGuardProps {
	children: ReactNode;
	/** Permission required to show the content */
	permission?: Permission;
	/** Required role (shorthand for common checks) */
	requireRole?: "admin" | "staff" | "viewer";
	/** Fallback content to show when permission is denied */
	fallback?: ReactNode;
	/** Show a disabled state instead of hiding */
	showDisabled?: boolean;
}

/**
 * Conditionally render children based on permissions
 *
 * @example
 * <CanAccess permission="keywords.create">
 *   <Button>Add Keyword</Button>
 * </CanAccess>
 */
export function CanAccess({
	children,
	permission,
	requireRole,
	fallback = null,
}: RoleGuardProps) {
	const { can, role } = usePermissions();

	// Check permission if provided
	if (permission && !can(permission)) {
		return <>{fallback}</>;
	}

	// Check role if provided
	if (requireRole) {
		if (requireRole === "admin" && role !== "admin") {
			return <>{fallback}</>;
		}
		if (requireRole === "staff" && !["staff", "admin"].includes(role)) {
			return <>{fallback}</>;
		}
	}

	return <>{children}</>;
}

/**
 * Disable button/input when user lacks permission
 * Wraps children and adds disabled prop + tooltip
 *
 * @example
 * <DisableIfNoAccess permission="keywords.create">
 *   <Button>Add Keyword</Button>
 * </DisableIfNoAccess>
 */
export function DisableIfNoAccess({
	children,
	permission,
	requireRole,
}: RoleGuardProps) {
	const { can, role, isViewer } = usePermissions();

	let hasAccess = true;
	let reason = "";

	// Check permission
	if (permission && !can(permission)) {
		hasAccess = false;
		reason = `Requires permission: ${permission}`;
	}

	// Check role
	if (requireRole) {
		if (requireRole === "admin" && role !== "admin") {
			hasAccess = false;
			reason = "Admin access required";
		}
		if (requireRole === "staff" && !["staff", "admin"].includes(role)) {
			hasAccess = false;
			reason = "Staff access required";
		}
	}

	// If viewer, show generic read-only message
	if (!hasAccess && isViewer) {
		reason = "Read-only access - contact admin for editing permissions";
	}

	if (hasAccess) {
		return <>{children}</>;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="cursor-not-allowed inline-block">
						{/* Clone children and add disabled prop */}
						{typeof children === "object" &&
						children !== null &&
						"type" in children ? (
							<span className="opacity-50 pointer-events-none">{children}</span>
						) : (
							<span className="opacity-50">{children}</span>
						)}
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-xs">{reason}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * Show read-only badge for viewers
 *
 * @example
 * <ViewerBanner />
 */
export function ViewerBanner() {
	const { isViewer } = usePermissions();

	if (!isViewer) return null;

	return (
		<div
			className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm"
			style={{
				backgroundColor: "rgba(107,114,128,0.05)",
				borderColor: "#6B7280",
				color: "#9CA3AF",
			}}
		>
			<Eye size={16} className="shrink-0" />
			<div className="flex-1">
				<p className="font-semibold text-gray-300">Read-Only Access</p>
				<p className="text-xs text-gray-400 mt-0.5">
					You can view all data but cannot make changes. Contact your
					administrator for editing permissions.
				</p>
			</div>
		</div>
	);
}

/**
 * Inline read-only indicator badge
 */
export function ReadOnlyBadge() {
	const { isViewer } = usePermissions();

	if (!isViewer) return null;

	return (
		<Badge
			className="text-xs font-medium"
			style={{
				backgroundColor: "rgba(107,114,128,0.1)",
				color: "#9CA3AF",
				borderColor: "#6B7280",
			}}
		>
			<Eye size={10} className="mr-1" />
			Read-Only
		</Badge>
	);
}

/**
 * Hide content from viewers, show only to staff/admin
 *
 * @example
 * <StaffOnly>
 *   <Button onClick={deleteLocation}>Delete</Button>
 * </StaffOnly>
 */
export function StaffOnly({ children }: { children: ReactNode }) {
	const { isStaffOrAdmin } = usePermissions();
	return isStaffOrAdmin ? children : null;
}

/**
 * Hide content from non-admins
 *
 * @example
 * <AdminOnly>
 *   <SettingsButton />
 * </AdminOnly>
 */
export function AdminOnly({ children }: { children: ReactNode }) {
	const { isAdmin } = usePermissions();
	return isAdmin ? children : null;
}

/**
 * Higher-order component to wrap entire pages with permission checks
 * Redirects to dashboard if permission is denied
 *
 * @example
 * export function SettingsPage() {
 *   return (
 *     <RequirePermission permission="settings.update">
 *       <SettingsContent />
 *     </RequirePermission>
 *   );
 * }
 */
export function RequirePermission({
	children,
	permission,
	requireRole,
}: RoleGuardProps) {
	const { can, role } = usePermissions();

	let hasAccess = true;

	if (permission && !can(permission)) {
		hasAccess = false;
	}

	if (requireRole) {
		if (requireRole === "admin" && role !== "admin") {
			hasAccess = false;
		}
		if (requireRole === "staff" && !["staff", "admin"].includes(role)) {
			hasAccess = false;
		}
	}

	if (!hasAccess) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
				<div
					className="mb-6 h-20 w-20 rounded-full flex items-center justify-center"
					style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
				>
					<Eye size={40} className="text-red-400" />
				</div>
				<h2 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h2>
				<p className="text-gray-400 max-w-md mb-6">
					You don't have permission to access this page. Contact your
					administrator if you believe this is an error.
				</p>
				<a
					href="/"
					className="px-4 py-2 rounded-lg font-semibold text-black hover:opacity-90 transition"
					style={{ backgroundColor: "#D4A017" }}
				>
					Return to Dashboard
				</a>
			</div>
		);
	}

	return <>{children}</>;
}
