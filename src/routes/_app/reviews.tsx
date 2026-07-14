// TEMPORARY FIX: Reviews page disabled due to Star icon bundling issue
// TO RE-ENABLE: Delete this file and restore from git history
// Command: git checkout HEAD~1 -- src/routes/_app/reviews.tsx

import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/_app/reviews")({
	component: ReviewsPageDisabled,
});

function ReviewsPageDisabled() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A" }}>
			<Card className="w-full max-w-2xl" style={{ backgroundColor: "#1A1A1A", borderColor: "#2A2A2A" }}>
				<CardHeader>
					<div className="flex items-center gap-4">
						<div 
							className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
							style={{ backgroundColor: "rgba(212,160,23,0.1)" }}
						>
							<Construction size={32} style={{ color: "#D4A017" }} />
						</div>
						<div>
							<CardTitle className="text-2xl text-gray-100">
								Reviews Page Under Maintenance
							</CardTitle>
							<p className="mt-2 text-sm text-gray-400">
								This page is temporarily disabled while we fix a technical issue.
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="rounded-lg border border-[#2A2A2A] bg-[#252525] p-4">
							<p className="text-sm text-gray-300">
								<strong>Status:</strong> Under development
							</p>
							<p className="mt-2 text-sm text-gray-400">
								The reviews management functionality is being optimized and will be available soon.
							</p>
						</div>
						
						<div className="rounded-lg border border-[#2A2A2A] bg-[#252525] p-4">
							<p className="text-sm text-gray-300">
								<strong>Available Features:</strong>
							</p>
							<ul className="mt-2 space-y-1 text-sm text-gray-400">
								<li>✅ Dashboard — View overall SEO health</li>
								<li>✅ Rankings — Track keyword positions</li>
								<li>✅ Citations — Manage directory listings</li>
								<li>✅ Locations — Manage branch information</li>
								<li>✅ Website SEO — Analyze bountybasket.online</li>
							</ul>
						</div>

						<div className="rounded-lg border border-blue-800/30 bg-blue-900/10 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
								For Developers
							</p>
							<p className="mt-2 text-sm text-gray-400">
								To re-enable this page after the fix is deployed:
							</p>
							<pre className="mt-2 overflow-x-auto rounded bg-[#1A1A1A] p-2 text-xs text-gray-300">
git checkout HEAD~1 -- src/routes/_app/reviews.tsx
							</pre>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
