import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	ExternalLink,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/website/pages/$pageId")({
	component: PageDetail,
});

function PageDetail() {
	const { pageId } = Route.useParams();
	const trpc = useTRPC();

	const { data: page, isLoading } = useQuery(
		trpc.seo.website.pages.get.queryOptions({
			id: Number(pageId),
		}),
	);

	const { mutate: resolveMutation } = useMutation({
		...trpc.seo.website.issues.resolve.mutationOptions(),
		onSuccess: () => {
			// Invalidate the page query to refetch with updated issues
			trpc.seo.website.pages.get.invalidate({ id: Number(pageId) });
		},
	});

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="text-muted-foreground">Loading page details...</div>
			</div>
		);
	}

	if (!page) {
		return (
			<div className="flex h-screen flex-col items-center justify-center bg-background">
				<h2 className="mb-4 text-2xl font-bold text-foreground">
					Page Not Found
				</h2>
				<Link to="/website/pages">
					<Button variant="outline">Back to Pages</Button>
				</Link>
			</div>
		);
	}

	const scoreColor =
		(page.seoScore ?? 0) >= 80
			? "text-green-500"
			: (page.seoScore ?? 0) >= 60
				? "text-yellow-500"
				: "text-red-500";

	const criticalIssues =
		page.issues?.filter((i) => i.issueType === "critical") ?? [];
	const warningIssues =
		page.issues?.filter((i) => i.issueType === "warning") ?? [];
	const infoIssues = page.issues?.filter((i) => i.issueType === "info") ?? [];

	return (
		<div className="flex-1 overflow-auto bg-background p-6">
			<div className="mx-auto max-w-[1400px]">
				{/* Header */}
				<div className="mb-6">
					<Link to="/website/pages">
						<Button variant="ghost" size="sm" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Pages
						</Button>
					</Link>
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold text-foreground">
									{page.url.replace("https://bountybasket.online", "") || "/"}
								</h1>
								<a
									href={page.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground hover:text-foreground"
								>
									<ExternalLink className="h-5 w-5" />
								</a>
								<Badge variant="outline" style={{ borderColor: "#D4A017" }}>
									{page.pageType}
								</Badge>
							</div>
							<p className="mt-1 text-sm text-muted-foreground">
								{page.title || "No title"}
							</p>
						</div>
						<Button size="sm" style={{ backgroundColor: "#D4A017" }}>
							Re-Crawl Page
						</Button>
					</div>
				</div>

				{/* Score Cards */}
				<div className="mb-6 grid gap-4 md:grid-cols-4">
					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								SEO Score
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={`text-4xl font-bold ${scoreColor}`}>
								{page.seoScore ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								{(page.seoScore ?? 0) >= 80
									? "Excellent"
									: (page.seoScore ?? 0) >= 60
										? "Good"
										: "Needs Work"}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Content Score
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">
								{page.contentScore ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Title, meta, content quality
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Technical Score
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">
								{page.technicalScore ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Indexability, canonical, schema
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Issues
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">
								{page.issues?.length ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">
								{criticalIssues.length} critical
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					{/* Page Metadata */}
					<Card className="bg-card">
						<CardHeader>
							<CardTitle className="text-base font-semibold text-foreground">
								Page Metadata
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div>
									<div className="text-xs font-medium text-muted-foreground">
										Title Tag
									</div>
									<div className="text-sm text-foreground">
										{page.title || (
											<span className="text-red-500">Missing</span>
										)}
									</div>
									{page.title && (
										<div className="text-xs text-muted-foreground">
											{page.title.length} characters
										</div>
									)}
								</div>
								<div>
									<div className="text-xs font-medium text-muted-foreground">
										Meta Description
									</div>
									<div className="text-sm text-foreground">
										{page.metaDescription || (
											<span className="text-red-500">Missing</span>
										)}
									</div>
									{page.metaDescription && (
										<div className="text-xs text-muted-foreground">
											{page.metaDescription.length} characters
										</div>
									)}
								</div>
								<div>
									<div className="text-xs font-medium text-muted-foreground">
										H1 Heading
									</div>
									<div className="text-sm text-foreground">
										{page.h1 || <span className="text-red-500">Missing</span>}
									</div>
								</div>
								<div className="grid grid-cols-3 gap-4 pt-2">
									<div>
										<div className="text-xs font-medium text-muted-foreground">
											Word Count
										</div>
										<div className="text-sm font-semibold text-foreground">
											{page.wordCount ?? 0}
										</div>
									</div>
									<div>
										<div className="text-xs font-medium text-muted-foreground">
											Indexable
										</div>
										<div className="text-sm font-semibold text-foreground">
											{page.isIndexable ? (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											) : (
												<AlertCircle className="h-4 w-4 text-red-500" />
											)}
										</div>
									</div>
									<div>
										<div className="text-xs font-medium text-muted-foreground">
											Canonical
										</div>
										<div className="text-sm font-semibold text-foreground">
											{page.hasCanonical ? (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											) : (
												<AlertCircle className="h-4 w-4 text-red-500" />
											)}
										</div>
									</div>
								</div>
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
								{criticalIssues.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
										<p className="text-sm text-muted-foreground">
											No critical issues found!
										</p>
									</div>
								) : (
									criticalIssues.map((issue) => (
										<div
											key={issue.id}
											className="border-b border-border pb-3 last:border-0"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1">
													<div className="text-sm font-medium text-foreground">
														{issue.title}
													</div>
													<div className="mt-1 text-xs text-muted-foreground">
														{issue.description}
													</div>
													<div className="mt-2 text-xs text-blue-500">
														💡 {issue.recommendation}
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														resolveMutation({
															issueId: issue.id,
															resolved: !issue.isResolved,
														});
													}}
												>
													{issue.isResolved ? "Unresolve" : "Resolve"}
												</Button>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* All Issues */}
				{(warningIssues.length > 0 || infoIssues.length > 0) && (
					<Card className="mt-6 bg-card">
						<CardHeader>
							<CardTitle className="text-base font-semibold text-foreground">
								All Issues ({page.issues?.length ?? 0})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Warnings */}
								{warningIssues.length > 0 && (
									<div>
										<div className="mb-2 text-sm font-semibold text-foreground">
											⚠️ Warnings ({warningIssues.length})
										</div>
										<div className="space-y-2">
											{warningIssues.map((issue) => (
												<div
													key={issue.id}
													className="flex items-start justify-between gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 p-3"
												>
													<div className="flex-1">
														<div className="text-sm font-medium text-foreground">
															{issue.title}
														</div>
														<div className="mt-1 text-xs text-muted-foreground">
															{issue.recommendation}
														</div>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															resolveMutation({
																issueId: issue.id,
																resolved: true,
															});
														}}
													>
														Resolve
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Info */}
								{infoIssues.length > 0 && (
									<div>
										<div className="mb-2 text-sm font-semibold text-foreground">
											ℹ️ Info ({infoIssues.length})
										</div>
										<div className="space-y-2">
											{infoIssues.map((issue) => (
												<div
													key={issue.id}
													className="flex items-start justify-between gap-2 rounded border border-blue-500/20 bg-blue-500/5 p-3"
												>
													<div className="flex-1">
														<div className="text-sm font-medium text-foreground">
															{issue.title}
														</div>
														<div className="mt-1 text-xs text-muted-foreground">
															{issue.recommendation}
														</div>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															resolveMutation({
																issueId: issue.id,
																resolved: true,
															});
														}}
													>
														Resolve
													</Button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
