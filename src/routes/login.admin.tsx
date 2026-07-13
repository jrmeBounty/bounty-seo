import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login/admin")({
	component: AdminLoginPage,
	pendingComponent: () => (
		<div
			className="min-h-screen flex items-center justify-center"
			style={{ backgroundColor: "#0A0A0A" }}
		>
			<div className="h-16 w-16 rounded-full border-4 border-gray-700 border-t-yellow-500 animate-spin" />
		</div>
	),
	errorComponent: ({ error }) => (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
			<div className="max-w-md">
				<h1 className="text-2xl font-bold mb-4">Failed to Load Admin Login</h1>
				<p className="text-gray-400 mb-4">{String(error)}</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold"
				>
					Reload Page
				</button>
			</div>
		</div>
	),
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

function AdminLoginPage() {
	const navigate = useNavigate();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [error, setError] = useState("");

	// Redirect if already authenticated as admin/staff
	useEffect(() => {
		if (!sessionPending && session?.user) {
			const role = session.user.role as string;
			if (role === "admin" || role === "staff") {
				navigate({ to: "/" });
			} else {
				setError("This login page is for administrators and staff only.");
			}
		}
	}, [session, sessionPending, navigate]);

	const handleGoogleSignIn = async () => {
		setError("");
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/login/admin",
			});
		} catch {
			setError("Google sign-in failed. Please contact your administrator.");
		}
	};

	if (sessionPending) {
		return (
			<div
				className="min-h-screen flex flex-col items-center justify-center gap-4"
				style={{ backgroundColor: "#0A0A0A" }}
			>
				<Shield
					size={48}
					style={{ color: "#D4A017" }}
					className="animate-pulse"
				/>
				<p className="text-gray-400 text-sm">Verifying credentials...</p>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen flex items-center justify-center px-6 py-12"
			style={{ backgroundColor: "#0A0A0A" }}
		>
			<div className="w-full max-w-md space-y-8">
				{/* Header with admin branding */}
				<div className="text-center space-y-4">
					<div className="flex justify-center">
						<div
							className="h-16 w-16 rounded-2xl flex items-center justify-center"
							style={{ backgroundColor: "rgba(212,160,23,0.12)" }}
						>
							<Shield size={32} style={{ color: "#D4A017" }} />
						</div>
					</div>

					<div>
						<h1
							className="text-3xl font-black text-white"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							Administrator Login
						</h1>
						<p className="mt-2 text-sm text-gray-400">
							For Bounty Supermarket staff and administrators only
						</p>
					</div>
				</div>

				{/* Warning banner */}
				<div
					className="rounded-lg border px-4 py-3 flex items-start gap-3"
					style={{
						borderColor: "#D4A017",
						backgroundColor: "rgba(212,160,23,0.05)",
					}}
				>
					<Shield
						size={18}
						style={{ color: "#D4A017" }}
						className="shrink-0 mt-0.5"
					/>
					<p className="text-sm text-gray-300">
						This is a restricted area. Only authorized personnel with admin or
						staff credentials may proceed.
					</p>
				</div>

				{error && (
					<div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-3">
						<Shield size={16} className="shrink-0 mt-0.5 text-red-400" />
						<p className="text-sm text-red-300">{error}</p>
					</div>
				)}

				{/* Google Sign-In */}
				<Button
					type="button"
					className="w-full gap-3 h-14 font-bold text-base"
					style={{ backgroundColor: "#D4A017", color: "#000" }}
					onClick={handleGoogleSignIn}
				>
					<GoogleIcon />
					Sign in with Google
				</Button>

				<div className="text-center space-y-3 pt-4">
					<p className="text-xs text-gray-500">
						Need viewer access?{" "}
						<a
							href="/login/viewer"
							className="font-semibold hover:underline"
							style={{ color: "#D4A017" }}
						>
							Use the public login page
						</a>
					</p>
					<p className="text-xs text-gray-600">
						Bounty Supermarket Kenya · Authorized Access Only
					</p>
				</div>
			</div>
		</div>
	);
}
