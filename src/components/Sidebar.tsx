import { Link, useLocation } from "@tanstack/react-router";
import {
	BarChart3,
	LayoutDashboard,
	Link2,
	LogOut,
	MapPin,
	Settings,
	Star,
	TrendingUp,
} from "lucide-react";
import { authClient } from "#/lib/auth-client";
import { BountyLogo } from "./BountyLogo";

const NAV_ITEMS = [
	{
		href: "/" as const,
		label: "Dashboard",
		icon: LayoutDashboard,
		exact: true,
	},
	{
		href: "/rankings" as const,
		label: "Rankings",
		icon: TrendingUp,
		exact: false,
	},
	{
		href: "/reviews" as const,
		label: "Reviews",
		icon: Star,
		exact: false,
	},
	{
		href: "/citations" as const,
		label: "Citations",
		icon: Link2,
		exact: false,
	},
	{
		href: "/locations" as const,
		label: "Locations",
		icon: MapPin,
		exact: false,
	},
	{
		href: "/website" as const,
		label: "Website SEO",
		icon: BarChart3,
		exact: false,
	},
	{
		href: "/settings" as const,
		label: "Settings",
		icon: Settings,
		exact: false,
	},
] as const;

export function Sidebar() {
	const location = useLocation();
	const { data: session } = authClient.useSession();

	return (
		<aside
			className="flex h-screen w-60 shrink-0 flex-col overflow-hidden"
			style={{
				backgroundColor: "var(--bounty-sidebar-bg)",
				borderRight: "1px solid var(--bounty-sidebar-border)",
			}}
		>
			{/* ─── Brand Header ──────────────────────────────────────────────── */}
			<div
				className="flex items-center gap-3 px-4 py-5"
				style={{ borderBottom: "1px solid var(--bounty-sidebar-border)" }}
			>
				<BountyLogo size={40} />
				<div className="flex min-w-0 flex-col leading-none">
					<span className="text-sm font-extrabold tracking-widest text-white">
						BOUNTY
					</span>
					<span
						className="text-xs font-bold tracking-widest"
						style={{ color: "var(--bounty-gold)" }}
					>
						SUPERMARKET
					</span>
					<span className="mt-0.5 text-[10px] tracking-wide text-[#9CA3AF]">
						SEO Tracker
					</span>
				</div>
			</div>

			{/* ─── Navigation ────────────────────────────────────────────────── */}
			<nav className="flex-1 overflow-y-auto px-2 py-4">
				<ul className="space-y-0.5">
					{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
						const isActive = exact
							? location.pathname === href
							: location.pathname === href ||
								location.pathname.startsWith(`${href}/`);

						return (
							<li key={href}>
								<Link
									to={href}
									className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
									style={
										isActive
											? {
													backgroundColor: "var(--bounty-gold-muted)",
													color: "var(--bounty-gold)",
													borderLeft: "3px solid var(--bounty-gold)",
													paddingLeft: "9px",
												}
											: {
													color: "var(--bounty-sidebar-text)",
													borderLeft: "3px solid transparent",
													paddingLeft: "9px",
												}
									}
									activeProps={{}}
								>
									<Icon
										size={16}
										className="shrink-0"
										style={
											isActive
												? { color: "var(--bounty-gold)" }
												: { color: "var(--bounty-sidebar-text)" }
										}
									/>
									{label}
								</Link>
							</li>
						);
					})}
				</ul>

				{/* ─── Section Divider ─────────────────────────────────────────── */}
				<div
					className="mx-3 my-4 h-px"
					style={{ backgroundColor: "var(--bounty-sidebar-border)" }}
				/>

				{/* ─── Analytics Quick-links ───────────────────────────────────── */}
				<p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#8B95A3]">
					Quick Stats
				</p>
				<div className="space-y-1 px-2">
					{[
						{
							label: "Avg. Position",
							value: "2.4",
							trend: "↑",
							color: "#22C55E",
						},
						{
							label: "Reviews (30d)",
							value: "+18",
							trend: "↑",
							color: "#22C55E",
						},
						{
							label: "Citation Score",
							value: "82%",
							trend: "",
							color: "var(--bounty-gold)",
						},
					].map(({ label, value, trend, color }) => (
						<div
							key={label}
							className="flex items-center justify-between rounded-md px-2 py-1.5"
							style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
						>
							<span className="text-[11px] text-[#A1A8B3]">{label}</span>
							<span className="text-xs font-semibold" style={{ color }}>
								{trend} {value}
							</span>
						</div>
					))}
				</div>
			</nav>

			{/* ─── User Section ──────────────────────────────────────────────── */}
			<div
				className="p-3"
				style={{ borderTop: "1px solid var(--bounty-sidebar-border)" }}
			>
				{session?.user ? (
					<div className="flex items-center gap-2 rounded-lg p-2">
						{session.user.image ? (
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
								{(session.user.name ?? "U").charAt(0).toUpperCase()}
							</div>
						)}
						<div className="min-w-0 flex-1">
							<p className="truncate text-xs font-medium text-white">
								{session.user.name ?? "User"}
							</p>
							<p className="truncate text-[10px] text-[#6B7280]">
								{/*{session.user.email}*/}
								SEO Manager
							</p>
						</div>
						<button
							type="button"
							onClick={() => authClient.signOut()}
							className="text-[#6B7280] transition-colors hover:text-[#EF4444]"
							title="Sign out"
						>
							<LogOut size={14} />
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2 rounded-lg p-2">
						<div
							className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
							style={{ backgroundColor: "var(--bounty-gold)" }}
						>
							B
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-[10px] text-[#9CA3AF]">
								{session.user.email}
							</p>
							<p className="truncate text-[10px] text-[#9CA3AF]">SEO Manager</p>
						</div>
						<BarChart3 size={14} style={{ color: "var(--bounty-gold)" }} />
					</div>
				)}
			</div>
		</aside>
	);
}
