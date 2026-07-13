/**
 * Permission-Aware Button Component
 *
 * A button that automatically disables itself and shows a tooltip when the user
 * lacks the required permission. Use this instead of regular Button for mutation actions.
 */

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type { Permission } from "#/lib/rbac";
import { usePermissions } from "#/lib/usePermissions";

interface PermissionAwareButtonProps
	extends ComponentPropsWithoutRef<typeof Button> {
	/** Permission required to enable this button */
	permission?: Permission;
	/** Role requirement (shorthand) */
	requireRole?: "admin" | "staff";
	/** Custom tooltip message when disabled due to permissions */
	deniedMessage?: string;
}

/**
 * Button that automatically disables when user lacks permission
 *
 * @example
 * <PermissionAwareButton permission="keywords.create" onClick={handleAdd}>
 *   Add Keyword
 * </PermissionAwareButton>
 */
export const PermissionAwareButton = forwardRef<
	HTMLButtonElement,
	PermissionAwareButtonProps
>(function PermissionAwareButton(
	{ permission, requireRole, deniedMessage, disabled, children, ...props },
	ref,
) {
	const { can, role, isViewer } = usePermissions();

	let hasAccess = true;
	let reason = deniedMessage || "";

	// Check permission
	if (permission && !can(permission)) {
		hasAccess = false;
		if (!reason) {
			reason = isViewer
				? "Read-only access - contact admin for editing permissions"
				: `Requires permission: ${permission}`;
		}
	}

	// Check role
	if (requireRole && !hasAccess) {
		if (requireRole === "admin" && role !== "admin") {
			hasAccess = false;
			if (!reason) reason = "Admin access required";
		}
		if (requireRole === "staff" && !["staff", "admin"].includes(role)) {
			hasAccess = false;
			if (!reason) reason = "Staff access required";
		}
	}

	// If access granted or button is already disabled, render normally
	if (hasAccess || disabled) {
		return (
			<Button ref={ref} disabled={disabled} {...props}>
				{children}
			</Button>
		);
	}

	// No access - disable and show tooltip
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-block">
						<Button ref={ref} disabled={true} {...props}>
							{children}
						</Button>
					</span>
				</TooltipTrigger>
				<TooltipContent side="top" className="max-w-xs">
					<p className="text-xs">{reason}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});
