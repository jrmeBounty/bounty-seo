import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Bell, Eye, RefreshCw, Search, Shield } from "lucide-react";
import { useEffect } from "react";
import { BountyLogo } from "#/components/BountyLogo";
import { Sidebar } from "#/components/Sidebar";
import { Badge } from "#/components/ui/badge";
import { useTRPC } from "#/integrations/trpc/react";
import { authClient } from "#/lib/auth-client";
import { PermissionsProvider } from "#/lib/PermissionsContext";
import type { UserRole } from "#/lib/rbac";
import { getRoleBadgeColor, getRoleDisplayName } from "#/lib/rbac";
import { usePermissions } from "#/lib/usePermissions";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const navigate = useNavigate();

	// Auth guard — redirect to /login if not authenticated
	useEffect(() => {
		if (!sessionPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [session, sessionPending, navigate]);

	if (sessionPending) {
		return (
			<div
				className="flex h-screen items-center justify-center"
				style={{ backgroundColor: "#111111" }}
			>
				<img
					src="/BOUNTY_CART_YELLOW.svg"
					alt="Loading"
					className="h-16 w-16 animate-spin"
					style={{ animationDuration: "1.5s" }}
				/>
			</div>
		);
	}

	if (!session?.user) return null;

	// Wrap entire app layout with permissions provider
	return (
		<PermissionsProvider>
			<AppLayoutContent />
		</PermissionsProvider>
	);
}

function AppLayoutContent() {
	const { role, can, user } = usePermissions();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { mutate: syncAll, isPending: syncing } = useMutation({
		...trpc.seo.syncAll.mutationOptions(),
		onSuccess: (data) => {
			queryClient.invalidateQueries();
			alert(data.message);
		},
		onError: (err) => {
			alert(`Sync failed: ${err.message}`);
		},
	});

	const userRole = role as UserRole;
	const canSync = can("data.sync");

	return (
		<div
			className="flex h-screen overflow-hidden"
			style={{ backgroundColor: "#0A0A0A" }}
		>
			{/* ─── Sidebar ─────────────────────────────────────────────────── */}
			<Sidebar />

			{/* ─── Main area ───────────────────────────────────────────────── */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				{/* ─── Top Bar ───────────────────────────────────────────────── */}
				<header
					className="flex h-14 shrink-0 items-center gap-4 px-6 border-b"
					style={{
						backgroundColor: "#1A1A1A",
						borderColor: "#2A2A2A",
					}}
				>
					{/* Search bar */}
					<div className="flex flex-1 items-center gap-2 rounded-lg border border-[#333333] bg-[#0F0F0F] px-3 py-1.5 text-sm max-w-md">
						<Search size={14} className="shrink-0 text-gray-400" />
						<span className="text-gray-400">
							Search keywords, reviews, locations…
						</span>
					</div>

					<div className="ml-auto flex items-center gap-3">
						{/* Role badge */}
						<Badge
							className="text-xs font-semibold border"
							style={{
								backgroundColor:
									userRole === "viewer"
										? "rgba(107,114,128,0.1)"
										: "rgba(212,160,23,0.1)",
								color: getRoleBadgeColor(userRole),
								borderColor: `${getRoleBadgeColor(userRole)}40`,
							}}
						>
							{userRole === "admin" && <Shield size={12} className="mr-1" />}
							{userRole === "viewer" && <Eye size={12} className="mr-1" />}
							{getRoleDisplayName(userRole)}
						</Badge>

						{/* Read-only banner for viewers */}
						{userRole === "viewer" && (
							<span className="text-xs text-gray-400 hidden md:inline">
								Read-only access
							</span>
						)}

						{/* Refresh indicator - only for staff/admin */}
						{canSync && (
							<button
								type="button"
								disabled={syncing}
								onClick={() => syncAll()}
								className="flex items-center gap-1.5 rounded-lg border border-[#333333] bg-[#0F0F0F] px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<RefreshCw
									size={12}
									className={syncing ? "animate-spin" : ""}
								/>
								{syncing ? "Syncing..." : "Sync Data"}
							</button>
						)}

						{/* Notification bell */}
						<button
							type="button"
							className="relative rounded-lg p-2 text-gray-300 transition-colors hover:bg-[#252525] hover:text-gray-100"
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
						{user?.image ? (
							<img
								src={user.image}
								alt={user.name ?? "User"}
								className="h-7 w-7 rounded-full object-cover"
							/>
						) : (
							<div
								className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
								style={{ backgroundColor: "var(--bounty-gold)" }}
							>
								{user?.name?.charAt(0).toUpperCase() ?? "B"}
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
