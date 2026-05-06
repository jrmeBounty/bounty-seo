import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Bell, RefreshCw, Search } from "lucide-react";
import { useEffect } from "react";
import { BountyLogo } from "#/components/BountyLogo";
import { Sidebar } from "#/components/Sidebar";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const navigate = useNavigate();

	// Auth guard — redirect to /login if not authenticated
	// (isPending = still loading session; we wait before redirecting)
	useEffect(() => {
		if (!sessionPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [session, sessionPending, navigate]);

	return (
		<div className="flex h-screen overflow-hidden bg-[var(--bounty-content-bg)]">
			{/* ─── Sidebar ─────────────────────────────────────────────────── */}
			<Sidebar />

			{/* ─── Main area ───────────────────────────────────────────────── */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				{/* ─── Top Bar ───────────────────────────────────────────────── */}
				<header
					className="flex h-14 shrink-0 items-center gap-4 px-6"
					style={{
						backgroundColor: "var(--bounty-topbar-bg)",
						borderBottom: "1px solid var(--bounty-topbar-border)",
					}}
				>
					{/* Search bar */}
					<div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--bounty-topbar-border)] bg-[#F9FAFB] px-3 py-1.5 text-sm text-[#6B7280] max-w-md">
						<Search size={14} className="shrink-0 text-[#9CA3AF]" />
						<span className="text-[#9CA3AF]">
							Search keywords, reviews, locations…
						</span>
					</div>

					<div className="ml-auto flex items-center gap-3">
						{/* Refresh indicator */}
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-lg border border-[var(--bounty-topbar-border)] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6]"
						>
							<RefreshCw size={12} />
							Sync Data
						</button>

						{/* Notification bell */}
						<button
							type="button"
							className="relative rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111111]"
						>
							<Bell size={16} />
							{/* Unread dot */}
							<span
								className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
								style={{ backgroundColor: "var(--bounty-gold)" }}
							/>
						</button>

						{/* Bounty logo (brand mark) */}
						<BountyLogo size={28} />

						{/* User avatar */}
						{session?.user?.image ? (
							<img
								src={session.user.image}
								alt={session.user.name ?? "User"}
								className="h-7 w-7 rounded-full object-cover"
							/>
						) : (
							<div
								className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
								style={{ backgroundColor: "var(--bounty-gold)" }}
							>
								{session?.user?.name?.charAt(0).toUpperCase() ?? "B"}
							</div>
						)}
					</div>
				</header>

				{/* ─── Page content ──────────────────────────────────────────── */}
				<main className="flex-1 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
