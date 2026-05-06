import { Link } from "@tanstack/react-router";
import { BountyLogo } from "./BountyLogo";

/**
 * Minimal top bar used by demo routes and the /about page.
 * Main SEO app pages use the full Sidebar layout from _app.tsx instead.
 */
export default function Header() {
	return (
		<header
			className="sticky top-0 z-50 flex h-12 items-center gap-4 border-b px-4"
			style={{
				backgroundColor: "var(--bounty-sidebar-bg)",
				borderColor: "var(--bounty-sidebar-border)",
			}}
		>
			<Link to="/" className="flex items-center gap-2 no-underline">
				<BountyLogo size={28} />
				<span className="text-xs font-bold tracking-widest text-white">
					BOUNTY
				</span>
				<span
					className="text-xs font-bold tracking-widest"
					style={{ color: "var(--bounty-gold)" }}
				>
					SEO
				</span>
			</Link>

			<nav className="ml-4 flex items-center gap-4 text-xs text-[#6B7280]">
				<Link
					to="/"
					className="transition-colors hover:text-white no-underline"
				>
					Dashboard
				</Link>
				<span>·</span>
				<Link
					to="/rankings"
					className="transition-colors hover:text-white no-underline"
				>
					Rankings
				</Link>
				<span>·</span>
				<Link
					to="/reviews"
					className="transition-colors hover:text-white no-underline"
				>
					Reviews
				</Link>
			</nav>

			<div className="ml-auto text-[10px] text-[#4B5563]">
				Demo Routes — Development Only
			</div>
		</header>
	);
}
