import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login/viewer")({
	component: ViewerLoginPage,
});

function GoogleIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
			/>
			<path
				fill="#34A853"
				d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
			/>
			<path
				fill="#FBBC05"
				d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.14z"
			/>
			<path
				fill="#EA4335"
				d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.56-2.56A8 8 0 0 0 1.83 5.43L4.5 7.5a4.77 4.77 0 0 1 4.48-3.92z"
			/>
		</svg>
	);
}

function ViewerLoginPage() {
	const [error, setError] = useState("");

	const handleGoogleSignIn = async () => {
		setError("");
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch {
			setError(
				"Google sign-in failed. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured.",
			);
		}
	};

	return (
		<div className="min-h-screen flex" style={{ backgroundColor: "#F8F9FA" }}>
			{/* Left panel — branding */}
			<div
				className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
				style={{ backgroundColor: "#111111" }}
			>
				{/* Decorative gold accent */}
				<div
					className="absolute inset-x-0 top-0 h-1"
					style={{ backgroundColor: "#D4A017" }}
				/>

				<div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<img
							src="/BOUNTY_CART_YELLOW.svg"
							alt="Bounty Supermarket"
							className="h-16 w-16 rounded-lg object-cover"
						/>
						<div className="text-left">
							<p
								className="text-2xl font-black text-white leading-none"
								style={{ fontFamily: "Fraunces, serif" }}
							>
								Bounty
							</p>
							<p className="text-sm font-semibold" style={{ color: "#D4A017" }}>
								Supermarket
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<h2
							className="text-3xl font-black text-white"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							SEO Dashboard
						</h2>
						<p className="text-gray-400 text-sm leading-relaxed">
							View real-time Google Maps rankings, customer reviews, and
							citation reports for all Bounty Supermarket locations.
						</p>
					</div>

					{/* Viewer info banner */}
					<div
						className="rounded-lg border px-4 py-3 w-full text-left"
						style={{
							borderColor: "#6B7280",
							backgroundColor: "rgba(107,114,128,0.1)",
						}}
					>
						<div className="flex items-start gap-2.5">
							<Eye size={18} className="shrink-0 mt-0.5 text-gray-400" />
							<div className="space-y-1">
								<p className="text-sm font-semibold text-gray-300">
									Viewer Access
								</p>
								<p className="text-xs text-gray-400 leading-relaxed">
									You'll have read-only access to view SEO data, rankings, and
									reports. No editing capabilities.
								</p>
							</div>
						</div>
					</div>

					{/* Feature bullets */}
					<ul className="space-y-3 text-left w-full">
						{[
							"View Google Maps ranking positions",
							"Monitor customer reviews & ratings",
							"Track citation consistency",
							"Export reports and data",
						].map((feat) => (
							<li key={feat} className="flex items-start gap-2.5">
								<span
									className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
									style={{ backgroundColor: "#6B7280", color: "#fff" }}
								>
									✓
								</span>
								<span className="text-gray-300 text-sm">{feat}</span>
							</li>
						))}
					</ul>

					<p
						className="text-xs font-semibold tracking-widest uppercase mt-4"
						style={{ color: "#D4A017" }}
					>
						"Great Savings Everyday"
					</p>
				</div>
			</div>

			{/* Right panel — form */}
			<div className="theme-light flex flex-1 items-center justify-center px-6 py-12">
				<div className="w-full max-w-sm space-y-6">
					{/* Mobile logo */}
					<div className="flex lg:hidden items-center justify-center gap-2 mb-6">
						<img
							src="/BOUNTY_CART_YELLOW.svg"
							alt="Bounty"
							className="h-8 w-8 rounded object-cover"
						/>
						<span
							className="text-xl font-black text-foreground"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							Bounty Tracker
						</span>
					</div>

					<div>
						<h1
							className="text-2xl font-bold text-foreground"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							Welcome
						</h1>
						<p className="mt-1 text-sm text-gray-600">
							Sign in with your Google account to access the SEO dashboard
						</p>
					</div>

					{error && (
						<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
							<Eye size={15} className="shrink-0 mt-0.5 text-red-500" />
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{/* Google Sign-In */}
					<Button
						type="button"
						className="w-full gap-3 h-12 font-semibold text-black hover:opacity-90"
						style={{ backgroundColor: "#D4A017" }}
						onClick={handleGoogleSignIn}
					>
						<GoogleIcon />
						Continue with Google
					</Button>

					<p className="text-center text-xs text-gray-400 pt-4">
						Bounty Supermarket Kenya · SEO Viewer Portal
					</p>
				</div>
			</div>
		</div>
	);
}
