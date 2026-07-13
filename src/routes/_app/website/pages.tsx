import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Search, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/website/pages")({
	component: WebsitePages,
});

function WebsitePages() {
	const [pageType, setPageType] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const trpc = useTRPC();

	const { data, isLoading } = useQuery(
		trpc.seo.website.pages.list.queryOptions({
			pageType: pageType === "all" ? undefined : (pageType as any),
			limit: 100,
		}),
	);

	const filteredPages = data?.pages.filter((page) =>
		page.url.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="flex-1 overflow-auto bg-background p-6">
			<div className="mx-auto max-w-[1400px]">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Page Analysis
						</h1>
						<p className="text-sm text-muted-foreground">
							All pages from bountybasket.online with SEO scores
						</p>
					</div>
					<Button size="sm" style={{ backgroundColor: "#D4A017" }}>
						<TrendingUp className="mr-2 h-4 w-4" />
						Crawl New Page
					</Button>
				</div>

				{/* Filters */}
				<Card className="mb-6 bg-card">
					<CardContent className="pt-6">
						<div className="flex gap-4">
							<div className="flex-1">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Search pages by URL..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>
							<Select value={pageType} onValueChange={setPageType}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="home">Home</SelectItem>
									<SelectItem value="category">Category</SelectItem>
									<SelectItem value="product">Product</SelectItem>
									<SelectItem value="blog">Blog</SelectItem>
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Pages List */}
				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-muted-foreground">Loading pages...</div>
					</div>
				) : (
					<div className="space-y-3">
						{filteredPages?.map((page) => {
							const scoreColor =
								(page.seoScore ?? 0) >= 80
									? "text-green-500"
									: (page.seoScore ?? 0) >= 60
										? "text-yellow-500"
										: "text-red-500";

							return (
								<Card key={page.id} className="bg-card">
									<CardContent className="flex items-center justify-between p-4">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<Link
													to="/website/pages/$pageId"
													params={{ pageId: page.id.toString() }}
													className="text-sm font-medium text-foreground hover:underline"
												>
													{page.url.replace(
														"https://bountybasket.online",
														"",
													) || "/"}
												</Link>
												<a
													href={page.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground hover:text-foreground"
												>
													<ExternalLink className="h-3 w-3" />
												</a>
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
											</div>
											<div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
												<span>
													Title:{" "}
													{page.title
														? `${page.title.substring(0, 60)}${page.title.length > 60 ? "..." : ""}`
														: "Missing"}
												</span>
												<span>•</span>
												<span>{page.wordCount ?? 0} words</span>
												{page.lastCrawled && (
													<>
														<span>•</span>
														<span>
															Last crawled:{" "}
															{new Date(page.lastCrawled).toLocaleDateString()}
														</span>
													</>
												)}
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-center">
												<div className={`text-2xl font-bold ${scoreColor}`}>
													{page.seoScore ?? 0}
												</div>
												<div className="text-xs text-muted-foreground">
													SEO Score
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-foreground">
													{page.contentScore ?? 0}
												</div>
												<div className="text-xs text-muted-foreground">
													Content
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-foreground">
													{page.technicalScore ?? 0}
												</div>
												<div className="text-xs text-muted-foreground">
													Technical
												</div>
											</div>
											<Link
												to="/website/pages/$pageId"
												params={{ pageId: page.id.toString() }}
											>
												<Button variant="outline" size="sm">
													View Details
												</Button>
											</Link>
										</div>
									</CardContent>
								</Card>
							);
						})}

						{filteredPages?.length === 0 && (
							<Card className="bg-card">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<Search className="mb-4 h-12 w-12 text-muted-foreground" />
									<h3 className="mb-2 text-lg font-semibold text-foreground">
										No pages found
									</h3>
									<p className="mb-4 text-center text-sm text-muted-foreground">
										{searchQuery
											? "Try a different search query"
											: "Run the crawler to analyze pages"}
									</p>
									<Button size="sm" style={{ backgroundColor: "#D4A017" }}>
										Run Site Crawl
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{/* Summary */}
				{data && data.pages.length > 0 && (
					<div className="mt-6 text-center text-sm text-muted-foreground">
						Showing {filteredPages?.length ?? 0} of {data.total} pages
					</div>
				)}
			</div>
		</div>
	);
}
