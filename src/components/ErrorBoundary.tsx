import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";

interface ErrorBoundaryProps {
	error: Error;
	reset: () => void;
	fullPage?: boolean;
}

/**
 * Global ErrorBoundary component for displaying error states
 * Used by TanStack Router for route-level error boundaries
 *
 * @param error - The error object thrown
 * @param reset - Function to reset the error boundary and retry
 * @param fullPage - Whether to render as a full-page error (default: true)
 */
export function ErrorBoundary({
	error,
	reset,
	fullPage = true,
}: ErrorBoundaryProps) {
	const errorMessage = error?.message || "An unexpected error occurred";
	const isDevelopment = import.meta.env.DEV;

	// Full-page error display (for root route errors)
	if (fullPage) {
		return (
			<div
				className="flex min-h-screen items-center justify-center p-6"
				style={{ backgroundColor: "#0A0A0A" }}
			>
				<Card
					className="w-full max-w-2xl"
					style={{ backgroundColor: "#1A1A1A", borderColor: "#2A2A2A" }}
				>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center text-center">
							{/* Icon */}
							<div
								className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
								style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
							>
								<AlertTriangle className="h-8 w-8 text-red-500" />
							</div>

							{/* Title */}
							<h1
								className="mb-2 text-2xl font-bold"
								style={{ color: "#F3F4F6" }}
							>
								Something went wrong
							</h1>

							{/* Message */}
							<p className="mb-6 text-sm" style={{ color: "#9CA3AF" }}>
								We encountered an error while loading this page. Please try
								refreshing or go back to the home page.
							</p>

							{/* Error details (dev only) */}
							{isDevelopment && (
								<Card
									className="mb-6 w-full"
									style={{
										backgroundColor: "#111111",
										borderColor: "#EF4444",
									}}
								>
									<CardContent className="p-4">
										<div className="text-left">
											<div
												className="mb-2 text-xs font-semibold uppercase tracking-wide"
												style={{ color: "#EF4444" }}
											>
												Error Details (Dev Only)
											</div>
											<pre
												className="overflow-x-auto text-xs"
												style={{
													color: "#F3F4F6",
													whiteSpace: "pre-wrap",
													wordBreak: "break-word",
												}}
											>
												{errorMessage}
											</pre>
											{error?.stack && (
												<details className="mt-3">
													<summary
														className="cursor-pointer text-xs font-medium"
														style={{ color: "#9CA3AF" }}
													>
														Stack Trace
													</summary>
													<pre
														className="mt-2 overflow-x-auto text-xs"
														style={{
															color: "#6B7280",
															whiteSpace: "pre-wrap",
															wordBreak: "break-word",
														}}
													>
														{error.stack}
													</pre>
												</details>
											)}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Actions */}
							<div className="flex gap-3">
								<Button
									onClick={reset}
									style={{ backgroundColor: "#D4A017", color: "#000" }}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Try Again
								</Button>
								<Button
									variant="outline"
									onClick={() => (window.location.href = "/")}
								>
									<Home className="mr-2 h-4 w-4" />
									Go Home
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Inline error display (for component-level errors)
	return (
		<Card
			className="m-4"
			style={{
				backgroundColor: "#1A1A1A",
				borderColor: "#EF4444",
			}}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
					<div className="flex-1">
						<div className="mb-1 text-sm font-semibold text-red-500">
							Error Loading Component
						</div>
						<div className="mb-3 text-xs text-gray-400">{errorMessage}</div>
						<Button
							size="sm"
							onClick={reset}
							style={{ backgroundColor: "#D4A017", color: "#000" }}
						>
							<RefreshCw className="mr-2 h-3 w-3" />
							Retry
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
