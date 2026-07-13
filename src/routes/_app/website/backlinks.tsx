import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Link as LinkIcon, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/website/backlinks")({
	component: WebsiteBacklinks,
});

function WebsiteBacklinks() {
	const [status, setStatus] = useState<string>("all");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const trpc = useTRPC();

	const { data, isLoading } = useQuery(
		trpc.seo.website.backlinks.list.queryOptions({
			status: status === "all" ? undefined : (status as any),
			limit: 100,
		}),
	);

	const { mutate: createMutation, isPending: creating } = useMutation({
		...trpc.seo.website.backlinks.create.mutationOptions(),
		onSuccess: () => {
			// Invalidate both backlinks and stats
			trpc.seo.website.backlinks.list.invalidate();
			trpc.seo.website.stats.invalidate();
			setIsAddDialogOpen(false);
		},
	});

	const [formData, setFormData] = useState({
		targetUrl: "https://bountybasket.online",
		sourceUrl: "",
		sourceDomain: "",
		anchorText: "",
		isDofollow: true,
		domainAuthority: 0,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation(formData);
	};

	const activeCount =
		data?.backlinks.filter((b) => b.status === "active").length ?? 0;
	const lostCount =
		data?.backlinks.filter((b) => b.status === "lost").length ?? 0;
	const avgDA = data?.backlinks.length
		? Math.round(
				data.backlinks.reduce((sum, b) => sum + (b.domainAuthority ?? 0), 0) /
					data.backlinks.length,
			)
		: 0;

	return (
		<div className="flex-1 overflow-auto bg-background p-6">
			<div className="mx-auto max-w-[1400px]">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Backlink Profile
						</h1>
						<p className="text-sm text-muted-foreground">
							Monitor inbound links to bountybasket.online
						</p>
					</div>
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" style={{ backgroundColor: "#D4A017" }}>
								<Plus className="mr-2 h-4 w-4" />
								Add Backlink
							</Button>
						</DialogTrigger>
						<DialogContent>
							<form onSubmit={handleSubmit}>
								<DialogHeader>
									<DialogTitle>Add New Backlink</DialogTitle>
									<DialogDescription>
										Manually add a backlink to track its status and quality
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="sourceUrl">Source URL *</Label>
										<Input
											id="sourceUrl"
											placeholder="https://example.com/article"
											value={formData.sourceUrl}
											onChange={(e) =>
												setFormData({ ...formData, sourceUrl: e.target.value })
											}
											required
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="sourceDomain">Source Domain *</Label>
										<Input
											id="sourceDomain"
											placeholder="example.com"
											value={formData.sourceDomain}
											onChange={(e) =>
												setFormData({
													...formData,
													sourceDomain: e.target.value,
												})
											}
											required
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="targetUrl">Target URL</Label>
										<Input
											id="targetUrl"
											value={formData.targetUrl}
											onChange={(e) =>
												setFormData({ ...formData, targetUrl: e.target.value })
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="anchorText">Anchor Text</Label>
										<Input
											id="anchorText"
											placeholder="Fresh groceries Kenya"
											value={formData.anchorText}
											onChange={(e) =>
												setFormData({
													...formData,
													anchorText: e.target.value,
												})
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="domainAuthority">
											Domain Authority (0-100)
										</Label>
										<Input
											id="domainAuthority"
											type="number"
											min="0"
											max="100"
											value={formData.domainAuthority}
											onChange={(e) =>
												setFormData({
													...formData,
													domainAuthority: Number(e.target.value),
												})
											}
										/>
									</div>
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="isDofollow"
											checked={formData.isDofollow}
											onChange={(e) =>
												setFormData({
													...formData,
													isDofollow: e.target.checked,
												})
											}
										/>
										<Label htmlFor="isDofollow">Dofollow link</Label>
									</div>
								</div>
								<DialogFooter>
									<Button
										type="submit"
										disabled={creating}
										style={{ backgroundColor: "#D4A017" }}
									>
										{creating ? "Adding..." : "Add Backlink"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{/* Summary Cards */}
				<div className="mb-6 grid gap-4 md:grid-cols-3">
					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Active Backlinks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-green-500">
								{activeCount}
							</div>
							<p className="text-xs text-muted-foreground">
								Currently pointing to your site
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Lost Backlinks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-red-500">{lostCount}</div>
							<p className="text-xs text-muted-foreground">
								Links that were removed
							</p>
						</CardContent>
					</Card>

					<Card className="bg-card">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-foreground">
								Avg Domain Authority
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-4xl font-bold text-foreground">{avgDA}</div>
							<p className="text-xs text-muted-foreground">
								Average quality score
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Filter */}
				<Card className="mb-6 bg-card">
					<CardContent className="flex items-center gap-4 pt-6">
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="lost">Lost</SelectItem>
								<SelectItem value="broken">Broken</SelectItem>
							</SelectContent>
						</Select>
					</CardContent>
				</Card>

				{/* Backlinks List */}
				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-muted-foreground">Loading backlinks...</div>
					</div>
				) : (
					<div className="space-y-3">
						{data?.backlinks.map((backlink) => (
							<Card key={backlink.id} className="bg-card">
								<CardContent className="flex items-start gap-4 p-4">
									<LinkIcon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<a
												href={backlink.sourceUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-semibold text-foreground hover:underline"
											>
												{backlink.sourceDomain}
											</a>
											<ExternalLink className="h-3 w-3 text-muted-foreground" />
											{backlink.isDofollow && (
												<Badge
													variant="outline"
													style={{ borderColor: "#22C55E" }}
													className="text-xs"
												>
													Dofollow
												</Badge>
											)}
											{backlink.status === "active" ? (
												<Badge variant="outline" className="text-xs">
													Active
												</Badge>
											) : (
												<Badge
													variant="outline"
													style={{ borderColor: "#EF4444" }}
													className="text-xs"
												>
													{backlink.status}
												</Badge>
											)}
										</div>
										<div className="mt-1 text-xs text-muted-foreground">
											Anchor: {backlink.anchorText || "No anchor text"} →{" "}
											{backlink.targetUrl}
										</div>
										<div className="mt-2 flex items-center gap-4 text-xs">
											<div>
												<span className="font-semibold text-foreground">
													DA: {backlink.domainAuthority ?? "N/A"}
												</span>
											</div>
											<span className="text-muted-foreground">•</span>
											<div className="text-muted-foreground">
												First seen:{" "}
												{backlink.firstSeen
													? new Date(backlink.firstSeen).toLocaleDateString()
													: "Unknown"}
											</div>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{backlink.domainAuthority !== null && (
											<div className="text-center">
												<div
													className={`text-2xl font-bold ${
														backlink.domainAuthority >= 50
															? "text-green-500"
															: backlink.domainAuthority >= 30
																? "text-yellow-500"
																: "text-red-500"
													}`}
												>
													{backlink.domainAuthority}
												</div>
												<div className="text-xs text-muted-foreground">DA</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}

						{data?.backlinks.length === 0 && (
							<Card className="bg-card">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<LinkIcon className="mb-4 h-12 w-12 text-muted-foreground" />
									<h3 className="mb-2 text-lg font-semibold text-foreground">
										No backlinks found
									</h3>
									<p className="mb-4 text-center text-sm text-muted-foreground">
										Start tracking backlinks by adding them manually
									</p>
									<Button
										size="sm"
										style={{ backgroundColor: "#D4A017" }}
										onClick={() => setIsAddDialogOpen(true)}
									>
										Add Your First Backlink
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
