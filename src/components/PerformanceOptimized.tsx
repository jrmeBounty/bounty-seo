/**
 * Performance-Optimized Component Wrappers
 *
 * Reusable memoized components for common UI patterns that benefit from
 * React.memo to prevent unnecessary re-renders.
 */

import { memo, type ReactNode } from "react";

/**
 * Memoized card wrapper - prevents re-renders when parent updates
 */
export const MemoCard = memo(function MemoCard({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
});

/**
 * Memoized badge component for status indicators
 */
export const MemoStatusBadge = memo(function MemoStatusBadge({
	status,
	variant = "default",
}: {
	status: string;
	variant?: "default" | "success" | "warning" | "error";
}) {
	const variants = {
		default: "bg-gray-100 text-gray-800 border-gray-200",
		success: "bg-green-100 text-green-800 border-green-200",
		warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
		error: "bg-red-100 text-red-800 border-red-200",
	};

	return (
		<span
			className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${variants[variant]}`}
		>
			{status}
		</span>
	);
});

/**
 * Memoized position badge with color coding
 */
export const MemoPositionBadge = memo(function MemoPositionBadge({
	position,
}: {
	position: number;
}) {
	const getColor = () => {
		if (position === 1) return "text-green-600 bg-green-50 border-green-200";
		if (position <= 3) return "text-amber-600 bg-amber-50 border-amber-200";
		if (position <= 10) return "text-orange-600 bg-orange-50 border-orange-200";
		return "text-red-600 bg-red-50 border-red-200";
	};

	return (
		<span
			className={`inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full border-2 ${getColor()}`}
		>
			{position}
		</span>
	);
});

/**
 * Memoized score display with color gradient
 */
export const MemoScoreDisplay = memo(function MemoScoreDisplay({
	score,
	max = 100,
	label,
}: {
	score: number;
	max?: number;
	label?: string;
}) {
	const percentage = (score / max) * 100;
	const getColor = () => {
		if (percentage >= 80) return "#22C55E"; // Green
		if (percentage >= 60) return "#D4A017"; // Gold
		if (percentage >= 40) return "#F97316"; // Orange
		return "#EF4444"; // Red
	};

	return (
		<div className="flex items-center gap-2">
			<div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-300"
					style={{
						width: `${percentage}%`,
						backgroundColor: getColor(),
					}}
				/>
			</div>
			<span className="text-sm font-semibold" style={{ color: getColor() }}>
				{score}
				{label ? ` ${label}` : ""}
			</span>
		</div>
	);
});

/**
 * Memoized trend indicator (up/down/stable)
 */
export const MemoTrendIndicator = memo(function MemoTrendIndicator({
	trend,
	value,
}: {
	trend: "up" | "down" | "stable";
	value?: string | number;
}) {
	const config = {
		up: { icon: "↑", color: "text-green-600", bg: "bg-green-50" },
		down: { icon: "↓", color: "text-red-600", bg: "bg-red-50" },
		stable: { icon: "→", color: "text-gray-600", bg: "bg-gray-50" },
	};

	const { icon, color, bg } = config[trend];

	return (
		<span
			className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${color} ${bg}`}
		>
			<span className="text-sm">{icon}</span>
			{value && <span>{value}</span>}
		</span>
	);
});

/**
 * Memoized empty state component
 */
export const MemoEmptyState = memo(function MemoEmptyState({
	title,
	description,
	icon,
}: {
	title: string;
	description?: string;
	icon?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			{icon && <div className="mb-4 text-gray-400">{icon}</div>}
			<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
			{description && (
				<p className="mt-2 text-sm text-gray-600 max-w-sm">{description}</p>
			)}
		</div>
	);
});
