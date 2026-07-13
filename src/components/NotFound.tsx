import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";

/**
 * Global 404 NotFound component
 * Used when a route doesn't match any defined routes
 */
export function NotFound() {
	const router = useRouter();

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
							style={{ backgroundColor: "rgba(212, 160, 23, 0.1)" }}
						>
							<Search
								className="h-8 w-8"
								style={{ color: "var(--bounty-gold)" }}
							/>
						</div>

						{/* 404 */}
						<div
							className="mb-2 text-6xl font-black"
							style={{
								color: "var(--bounty-gold)",
								fontFamily: "Fraunces, serif",
							}}
						>
							404
						</div>

						{/* Title */}
						<h1
							className="mb-2 text-2xl font-bold"
							style={{ color: "#F3F4F6" }}
						>
							Page Not Found
						</h1>

						{/* Message */}
						<p className="mb-6 text-sm" style={{ color: "#9CA3AF" }}>
							The page you're looking for doesn't exist or has been moved.
							<br />
							Let's get you back on track.
						</p>

						{/* Actions */}
						<div className="flex gap-3">
							<Button onClick={() => router.history.back()} variant="outline">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Go Back
							</Button>
							<Link to="/">
								<Button style={{ backgroundColor: "#D4A017", color: "#000" }}>
									<Home className="mr-2 h-4 w-4" />
									Go Home
								</Button>
							</Link>
						</div>

						{/* Quick Links */}
						<div className="mt-8 w-full border-t border-gray-800 pt-6">
							<div
								className="mb-3 text-xs font-semibold uppercase tracking-wide"
								style={{ color: "#6B7280" }}
							>
								Quick Links
							</div>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<Link
									to="/"
									className="rounded-lg border border-gray-800 px-3 py-2 text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-900"
								>
									Dashboard
								</Link>
								<Link
									to="/rankings"
									className="rounded-lg border border-gray-800 px-3 py-2 text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-900"
								>
									Rankings
								</Link>
								<Link
									to="/reviews"
									className="rounded-lg border border-gray-800 px-3 py-2 text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-900"
								>
									Reviews
								</Link>
								<Link
									to="/locations"
									className="rounded-lg border border-gray-800 px-3 py-2 text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-900"
								>
									Locations
								</Link>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
