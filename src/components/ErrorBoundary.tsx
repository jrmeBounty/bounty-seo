/**
 * Enhanced Error Boundary Component
 *
 * Catches React errors gracefully and reports them to Sentry.
 * Provides user-friendly error messages and recovery options.
 */

import * as Sentry from "@sentry/tanstackstart-react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

/**
 * Production-grade error boundary with Sentry integration
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log to Sentry
		Sentry.captureException(error, {
			contexts: {
				react: {
					componentStack: errorInfo.componentStack,
				},
			},
		});

		// Call custom error handler if provided
		this.props.onError?.(error, errorInfo);

		// Update state with error details
		this.setState({
			error,
			errorInfo,
		});

		// Log to console in development
		if (process.env.NODE_ENV === "development") {
			console.error("Error Boundary caught an error:", error, errorInfo);
		}
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleReload = () => {
		window.location.reload();
	};

	handleGoHome = () => {
		window.location.href = "/";
	};

	render() {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6">
					<Card
						className="w-full max-w-2xl"
						style={{ backgroundColor: "#1A1A1A", borderColor: "#2A2A2A" }}
					>
						<CardHeader>
							<div className="flex items-start gap-4">
								<div
									className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
									style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
								>
									<AlertCircle size={24} className="text-red-400" />
								</div>
								<div className="flex-1">
									<CardTitle className="text-xl text-gray-100">
										Something went wrong
									</CardTitle>
									<CardDescription className="mt-2 text-gray-400">
										We encountered an error while loading this page. Our team has
										been notified and will investigate the issue.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Error details (dev only) */}
							{process.env.NODE_ENV === "development" &&
								this.state.error && (
									<div className="rounded-lg bg-[#252525] p-4">
										<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
											Error Details (Dev Only)
										</p>
										<pre className="overflow-x-auto text-xs text-red-400">
											{this.state.error.toString()}
										</pre>
										{this.state.errorInfo?.componentStack && (
											<pre className="mt-2 overflow-x-auto text-xs text-gray-500">
												{this.state.errorInfo.componentStack}
											</pre>
										)}
									</div>
								)}

							{/* Action buttons */}
							<div className="flex flex-wrap gap-3">
								<Button
									onClick={this.handleReset}
									className="font-semibold text-black hover:opacity-90"
									style={{ backgroundColor: "#D4A017" }}
								>
									<RefreshCw size={16} />
									Try Again
								</Button>
								<Button
									onClick={this.handleReload}
									variant="outline"
									className="border-[#2A2A2A] bg-transparent text-gray-300 hover:bg-[#252525]"
								>
									<RefreshCw size={16} />
									Reload Page
								</Button>
								<Button
									onClick={this.handleGoHome}
									variant="outline"
									className="border-[#2A2A2A] bg-transparent text-gray-300 hover:bg-[#252525]"
								>
									<Home size={16} />
									Go Home
								</Button>
							</div>

							{/* Support information */}
							<div className="rounded-lg border border-[#2A2A2A] bg-[#252525] p-4">
								<p className="text-sm text-gray-300">
									<strong>Need help?</strong>
								</p>
								<p className="mt-1 text-xs text-gray-400">
									If this issue persists, please contact the IT team at{" "}
									<a
										href="mailto:jwachira@ict.bountysupermarkets.co.ke"
										className="text-[#D4A017] hover:underline"
									>
										jwachira@ict.bountysupermarkets.co.ke
									</a>{" "}
									with details about what you were trying to do when the error
									occurred.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Hook-based error boundary for functional components
 * Use this in route files to catch errors at the page level
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			onError={(error, errorInfo) => {
				// Additional logging or analytics
				console.error("Page error:", error, errorInfo);
			}}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Compact error boundary for small components
 * Shows inline error message instead of full page
 */
export function InlineErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			fallback={
				<div
					className="rounded-lg border p-4"
					style={{
						backgroundColor: "rgba(239,68,68,0.05)",
						borderColor: "rgba(239,68,68,0.2)",
					}}
				>
					<div className="flex items-start gap-3">
						<AlertCircle size={20} className="shrink-0 text-red-400" />
						<div className="flex-1">
							<p className="text-sm font-semibold text-gray-200">
								Failed to load this section
							</p>
							<p className="mt-1 text-xs text-gray-400">
								Try refreshing the page. If the problem persists, contact
								support.
							</p>
						</div>
					</div>
				</div>
			}
		>
			{children}
		</ErrorBoundary>
	);
}
