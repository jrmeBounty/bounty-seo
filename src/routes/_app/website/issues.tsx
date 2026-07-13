import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Filter } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/website/issues")({
	component: WebsiteIssues,
});

function WebsiteIssues() {
	const [issueType, setIssueType] = useState<string>("all");
	const [category, setCategory] = useState<string>("all");
	const [status, setStatus] = useState<string>("unresolved");

	const trpc = useTRPC();

	const { data, isLoading } = useQuery(
		trpc.seo.website.issues.list.queryOptions({
			issueType: issueType === "all" ? undefined : (issueType as any),
			category: category === "all" ? undefined : (category as any),
			isResolved: status === "all" ? undefined : status === "resolved",
			limit: 100,
		}),
	);

	const { mutate: resolveMutation, isPending: resolving } = useMutation({
		...trpc.seo.website.issues.resolve.mutationOptions(),
		onSuccess: () => {
			// Invalidate both issues list and stats
			trpc.seo.website.issues.list.invalidate();
			trpc.seo.website.stats.invalidate();
		},
	});

	const criticalCount =
		data?.issues.filter((i) => i.issueType === "critical").length ?? 0;
	const warningCount =
		data?.issues.filter((i) => i.issueType === "warning").length ?? 0;
	const infoCount =
		data?.issues.filter((i) => i.issueType === "info").length ?? 0;

	return (
		<div className="flex-1 overflow-auto bg-background p-6">
			<div className="mx-auto max-w-[1400px]">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-foreground">
						SEO Issues & Fixes
					</h1>
					<p className="text-sm text-muted-foreground">
						Track and resolve SEO issues across all pages
					</p>
				</div>

				{/* Summary Cards */}
				<div className="mb-6 grid gap-4 md:grid-cols-3">
					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Critical Issues
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-red-500">
								{criticalCount}
							</div>
							<p className="text-xs text-muted-foreground">
								Requires immediate attention
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Warnings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-yellow-500">
								{warningCount}
							</div>
							<p className="text-xs text-muted-foreground">
								Should be addressed soon
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Info
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-blue-500">
								{infoCount}
							</div>
							<p className="text-xs text-muted-foreground">
								Nice-to-have improvements
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<Card className="mb-6 bg-card">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
							<Filter className="h-4 w-4" />
							Filters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4">
							<Select value={issueType} onValueChange={setIssueType}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Issue Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="critical">Critical</SelectItem>
									<SelectItem value="warning">Warning</SelectItem>
									<SelectItem value="info">Info</SelectItem>
								</SelectContent>
							</Select>

							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									<SelectItem value="meta">Meta Tags</SelectItem>
									<SelectItem value="content">Content</SelectItem>
									<SelectItem value="technical">Technical</SelectItem>
									<SelectItem value="performance">Performance</SelectItem>
									<SelectItem value="mobile">Mobile</SelectItem>
									<SelectItem value="accessibility">Accessibility</SelectItem>
								</SelectContent>
							</Select>

							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="unresolved">Unresolved</SelectItem>
									<SelectItem value="resolved">Resolved</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Issues List */}
				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-muted-foreground">Loading issues...</div>
					</div>
				) : (
					<div className="space-y-3">
						{data?.issues.map((issue) => {
							const typeColors = {
								critical: "border-red-500/30 bg-red-500/5",
								warning: "border-yellow-500/30 bg-yellow-500/5",
								info: "border-blue-500/30 bg-blue-500/5",
							};

							const typeIcons = {
								critical: <AlertCircle className="h-5 w-5 text-red-500" />,
								warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
								info: <AlertCircle className="h-5 w-5 text-blue-500" />,
							};

							return (
								<Card
									key={issue.id}
									className={`${typeColors[issue.issueType]} border`}
								>
									<CardContent className="flex items-start gap-4 p-4">
										{typeIcons[issue.issueType]}
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-foreground">
													{issue.title}
												</span>
												<Badge variant="outline" className="text-xs capitalize">
													{issue.category}
												</Badge>
												<Badge
													variant="outline"
													className="text-xs capitalize"
													style={{
														borderColor:
															issue.impact === "high"
																? "#EF4444"
																: issue.impact === "medium"
																	? "#F59E0B"
																	: "#3B82F6",
													}}
												>
													{issue.impact} impact
												</Badge>
												{issue.isResolved && (
													<Badge
														variant="outline"
														className="text-xs"
														style={{ borderColor: "#22C55E" }}
													>
														<CheckCircle2 className="mr-1 h-3 w-3" />
														Resolved
													</Badge>
												)}
											</div>
											<div className="mt-1 text-xs text-muted-foreground">
												{issue.description}
											</div>
											<div className="mt-2 rounded bg-blue-500/10 p-2 text-xs text-foreground">
												<span className="font-semibold">💡 Fix:</span>{" "}
												{issue.recommendation}
											</div>
											{issue.pageUrl && (
												<div className="mt-2 text-xs text-muted-foreground">
													Page:{" "}
													<Link to="/website/pages" className="hover:underline">
														{issue.pageUrl.replace(
															"https://bountybasket.online",
															"",
														) || "/"}
													</Link>
												</div>
											)}
										</div>
										<div className="flex shrink-0 flex-col gap-2">
											<Button
												variant={issue.isResolved ? "outline" : "default"}
												size="sm"
												style={
													!issue.isResolved
														? { backgroundColor: "#D4A017" }
														: undefined
												}
												onClick={() => {
													resolveMutation({
														issueId: issue.id,
														resolved: !issue.isResolved,
														notes: issue.isResolved
															? "Marked as unresolved"
															: "Marked as resolved",
													});
												}}
												disabled={resolving}
											>
												{issue.isResolved ? "Unresolve" : "Mark Resolved"}
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}

						{data?.issues.length === 0 && (
							<Card className="bg-card">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
									<h3 className="mb-2 text-lg font-semibold text-foreground">
										No issues found!
									</h3>
									<p className="text-center text-sm text-muted-foreground">
										{status === "unresolved"
											? "All issues have been resolved. Great work!"
											: "No issues match your filters"}
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{/* Summary */}
				{data && data.issues.length > 0 && (
					<div className="mt-6 text-center text-sm text-muted-foreground">
						Showing {data.issues.length} of {data.total} issues
					</div>
				)}
			</div>
		</div>
	);
}
