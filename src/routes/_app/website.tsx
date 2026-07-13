import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	Globe,
	Search,
	TrendingUp,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/website")({
	component: WebsiteOptimization,
});

function WebsiteOptimization() {
	const trpc = useTRPC();

	const { data: stats, isLoading } = useQuery(
		trpc.seo.website.stats.queryOptions(),
	);
	const { data: pages } = useQuery(
		trpc.seo.website.pages.list.queryOptions({ limit: 10 }),
	);
	const { data: issues } = useQuery(
		trpc.seo.website.issues.list.queryOptions({ limit: 10 }),
	);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const overallScore = stats?.overallScore ?? 0;
	const scoreColor =
		overallScore >= 80
			? "text-green-500"
			: overallScore >= 60
				? "text-yellow-500"
				: "text-red-500";

	return (
		<div className="flex-1 overflow-auto bg-background p-6">
			<div className="mx-auto max-w-[1400px]">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Website SEO Optimization
						</h1>
						<p className="text-sm text-muted-foreground">
							bountybasket.online ecommerce site health & performance
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm">
							<Search className="mr-2 h-4 w-4" />
							Run Quick Audit
						</Button>
						<Button size="sm" style={{ backgroundColor: "#D4A017" }}>
							<Globe className="mr-2 h-4 w-4" />
							Full Site Audit
						</Button>
					</div>
				</div>

				{/* KPI Cards */}
				<div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card className="bg-card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-foreground">
								Overall SEO Score
							</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className={`text-3xl font-bold ${scoreColor}`}>
								{overallScore}/100
							</div>
							<p className="text-xs text-muted-foreground">
								{overallScore >= 80
									? "Excellent"
									: overallScore >= 60
										? "Good"
										: "Needs Work"}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-foreground">
								Pages Analyzed
							</CardTitle>
							<Globe className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-foreground">
								{stats?.totalPages ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								{stats?.indexablePages ?? 0} indexable
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-foreground">
								Critical Issues
							</CardTitle>
							<AlertCircle className="h-4 w-4 text-red-500" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-red-500">
								{stats?.criticalIssues ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								{stats?.unresolvedIssues ?? 0} unresolved
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-foreground">
								Backlinks
							</CardTitle>
							<CheckCircle2 className="h-4 w-4 text-green-500" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-foreground">
								{stats?.totalBacklinks ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								{stats?.dofollowBacklinks ?? 0} dofollow
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					{/* Top Pages */}
					<Card className="bg-card">
						<CardHeader>
							<CardTitle className="text-base font-semibold text-foreground">
								Top Pages by SEO Score
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{pages?.pages.slice(0, 5).map((page) => (
									<div
										key={page.id}
										className="flex items-center justify-between border-b border-border pb-2 last:border-0"
									>
										<div className="min-w-0 flex-1">
											<Link
												to="/website/pages/$pageId"
												params={{ pageId: page.id.toString() }}
												className="text-sm font-medium text-foreground hover:underline"
											>
												{page.url.replace("https://bountybasket.online", "")}
											</Link>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<Badge
													variant="outline"
													className="text-xs"
													style={{
														borderColor:
															page.pageType === "home"
																? "#D4A017"
																: "var(--border)",
													}}
												>
													{page.pageType}
												</Badge>
												<span>{page.wordCount ?? 0} words</span>
											</div>
										</div>
										<div
											className={`text-lg font-bold ${
												(page.seoScore ?? 0) >= 80
													? "text-green-500"
													: (page.seoScore ?? 0) >= 60
														? "text-yellow-500"
														: "text-red-500"
											}`}
										>
											{page.seoScore ?? 0}
										</div>
									</div>
								))}
								{(!pages?.pages || pages.pages.length === 0) && (
									<p className="text-center text-sm text-muted-foreground">
										No pages analyzed yet. Run a site audit to get started.
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Critical Issues */}
					<Card className="bg-card">
						<CardHeader>
							<CardTitle className="text-base font-semibold text-foreground">
								Critical Issues
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{issues?.issues
									.filter((i) => i.issueType === "critical")
									.slice(0, 5)
									.map((issue) => (
										<div
											key={issue.id}
											className="flex items-start gap-3 border-b border-border pb-2 last:border-0"
										>
											<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
											<div className="min-w-0 flex-1">
												<div className="text-sm font-medium text-foreground">
													{issue.title}
												</div>
												<div className="text-xs text-muted-foreground">
													{issue.category} • {issue.impact} impact
												</div>
											</div>
											{!issue.isResolved && (
												<Badge
													variant="destructive"
													className="shrink-0 text-xs"
												>
													Open
												</Badge>
											)}
										</div>
									))}
								{(!issues?.issues || issues.issues.length === 0) && (
									<p className="text-center text-sm text-muted-foreground">
										No critical issues found. Great work!
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick Links */}
				<div className="mt-6 grid gap-4 md:grid-cols-3">
					<Link to="/website/pages">
						<Card className="cursor-pointer bg-card transition-colors hover:bg-[#1F1F1F]">
							<CardHeader>
								<CardTitle className="text-sm font-medium text-foreground">
									Page Analysis
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground">
									View all pages, scores, and optimization opportunities
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link to="/website/issues">
						<Card className="cursor-pointer bg-card transition-colors hover:bg-[#1F1F1F]">
							<CardHeader>
								<CardTitle className="text-sm font-medium text-foreground">
									Issues & Fixes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground">
									Track and resolve SEO issues across all pages
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link to="/website/backlinks">
						<Card className="cursor-pointer bg-card transition-colors hover:bg-[#1F1F1F]">
							<CardHeader>
								<CardTitle className="text-sm font-medium text-foreground">
									Backlink Profile
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground">
									Monitor backlinks, domain authority, and link quality
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
}
