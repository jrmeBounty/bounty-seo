import { rankItem } from "@tanstack/match-sorter-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, FilterFn, SortingState } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronsUpDown,
	MapPin,
	MessageCircle,
	MessageSquare,
	RefreshCw,
	Star,
} from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	type TooltipValueType,
	XAxis,
	YAxis,
} from "recharts";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
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
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/reviews")({
	component: ReviewsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewRow {
	id: number;
	reviewer: string;
	initials: string;
	location: string;
	rating: number;
	text: string;
	date: string;
	source: "google" | "facebook";
	sentiment: "positive" | "neutral" | "negative";
	replied: boolean;
	tags: string[];
}

// ─── Filter Functions ────────────────────────────────────────────────────────

// Required by the global FilterFns augmentation declared in src/routes/demo/table.tsx
const fuzzyFilter: FilterFn<unknown> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), String(value));
	addMeta({ itemRank });
	return itemRank.passed;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sentimentAvatarColor(sentiment: ReviewRow["sentiment"]): string {
	if (sentiment === "positive") return "#16a34a";
	if (sentiment === "negative") return "#dc2626";
	return "#d4a017";
}

function StarRating({ rating }: { rating: number }) {
	return (
		<span className="flex items-center gap-0.5">
			{Array.from({ length: 5 }, (_, i) => (
				<Star
					key={i}
					size={13}
					fill={i < rating ? "#D4A017" : "none"}
					stroke={i < rating ? "#D4A017" : "#9ca3af"}
				/>
			))}
			<span className="ml-1 text-xs text-gray-500">{rating}</span>
		</span>
	);
}

// ─── Review Trends ────────────────────────────────────────────────────────────

function ReviewTrendsCard({ reviews }: { reviews: ReviewRow[] }) {
	// Group reviews by month for trend chart
	const monthMap = new Map<
		string,
		{ total: number; sum: number; positive: number; negative: number }
	>();
	for (const r of reviews) {
		try {
			const key = format(new Date(r.date), "MMM yy");
			const existing = monthMap.get(key) ?? {
				total: 0,
				sum: 0,
				positive: 0,
				negative: 0,
			};
			existing.total += 1;
			existing.sum += r.rating;
			if (r.sentiment === "positive") existing.positive += 1;
			if (r.sentiment === "negative") existing.negative += 1;
			monthMap.set(key, existing);
		} catch {
			// skip bad dates
		}
	}
	const trendData = Array.from(monthMap.entries()).map(([month, d]) => ({
		month,
		avgRating: parseFloat((d.sum / d.total).toFixed(1)),
		reviews: d.total,
		positive: d.positive,
		negative: d.negative,
	}));

	// Per-sentiment counts
	const totalPositive = reviews.filter(
		(r) => r.sentiment === "positive",
	).length;
	const totalNeutral = reviews.filter((r) => r.sentiment === "neutral").length;
	const totalNegative = reviews.filter(
		(r) => r.sentiment === "negative",
	).length;
	const sentimentData = [
		{ label: "Positive", count: totalPositive, color: "#22C55E" },
		{ label: "Neutral", count: totalNeutral, color: "#D4A017" },
		{ label: "Negative", count: totalNegative, color: "#EF4444" },
	];

	if (trendData.length === 0) return null;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Review Trends</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Avg Rating Over Time */}
					<div>
						<p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
							Avg Rating by Month
						</p>
						<ResponsiveContainer width="100%" height={160}>
							<AreaChart
								data={trendData}
								margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
							>
								<defs>
									<linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
								<XAxis
									dataKey="month"
									tick={{ fontSize: 10, fill: "#9CA3AF" }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									domain={[1, 5]}
									tick={{ fontSize: 10, fill: "#9CA3AF" }}
									tickLine={false}
									axisLine={false}
									width={25}
								/>
								<RechartsTooltip
									formatter={(v: TooltipValueType | undefined) => [
										v != null ? `${v} ★` : "—",
										"Avg Rating",
									]}
									contentStyle={{
										borderRadius: 8,
										border: "1px solid #E5E7EB",
										fontSize: 12,
									}}
								/>
								<Area
									type="monotone"
									dataKey="avgRating"
									stroke="#D4A017"
									strokeWidth={2}
									fill="url(#ratingGrad)"
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					{/* Sentiment breakdown */}
					<div>
						<p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
							Sentiment Breakdown
						</p>
						<ResponsiveContainer width="100%" height={160}>
							<BarChart
								data={sentimentData}
								margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#F3F4F6"
									vertical={false}
								/>
								<XAxis
									dataKey="label"
									tick={{ fontSize: 11, fill: "#6B7280" }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tick={{ fontSize: 10, fill: "#9CA3AF" }}
									tickLine={false}
									axisLine={false}
									width={25}
									allowDecimals={false}
								/>
								<RechartsTooltip
									formatter={(
										v: TooltipValueType | undefined,
										name: number | string | undefined,
									) => [v ?? "", name ?? ""]}
									contentStyle={{
										borderRadius: 8,
										border: "1px solid #E5E7EB",
										fontSize: 12,
									}}
								/>
								<Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
									{sentimentData.map((entry) => (
										<Cell key={entry.label} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Per-Location Breakdown ─────────────────────────────────────────────────

function PerLocationBreakdown({ reviews }: { reviews: ReviewRow[] }) {
	const locationMap = new Map<
		string,
		{ total: number; sumRating: number; unresolved: number; negative: number }
	>();
	for (const r of reviews) {
		const loc = r.location ?? "Unknown";
		const existing = locationMap.get(loc) ?? {
			total: 0,
			sumRating: 0,
			unresolved: 0,
			negative: 0,
		};
		existing.total += 1;
		existing.sumRating += r.rating;
		if (!r.replied) existing.unresolved += 1;
		if (r.sentiment === "negative") existing.negative += 1;
		locationMap.set(loc, existing);
	}

	const locations = Array.from(locationMap.entries())
		.map(([city, d]) => ({
			city,
			total: d.total,
			avgRating: parseFloat((d.sumRating / d.total).toFixed(1)),
			unresolved: d.unresolved,
			negative: d.negative,
		}))
		.sort((a, b) => b.total - a.total);

	if (locations.length === 0) return null;

	return (
		<div>
			<h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
				By Location
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{locations.map((loc) => {
					const ratingColor =
						loc.avgRating >= 4.5
							? "#22C55E"
							: loc.avgRating >= 3.5
								? "#D4A017"
								: loc.avgRating >= 2.5
									? "#F97316"
									: "#EF4444";
					return (
						<Card key={loc.city} className="hover:shadow-sm transition-shadow">
							<CardContent className="p-4 space-y-2">
								<div className="flex items-start justify-between gap-1">
									<p className="font-semibold text-sm text-gray-900 leading-tight">
										{loc.city}
									</p>
									<span
										className="text-lg font-black tabular-nums"
										style={{ color: ratingColor }}
									>
										{loc.avgRating}★
									</span>
								</div>
								<div className="flex items-center gap-3 text-xs text-gray-500">
									<span>{loc.total} reviews</span>
									{loc.unresolved > 0 && (
										<span className="text-amber-600 font-medium">
											{loc.unresolved} pending
										</span>
									)}
									{loc.negative > 0 && (
										<span className="text-red-500 font-medium">
											{loc.negative} negative
										</span>
									)}
								</div>
								{/* Mini rating bar */}
								<div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
									<div
										className="h-full rounded-full"
										style={{
											width: `${((loc.avgRating - 1) / 4) * 100}%`,
											backgroundColor: ratingColor,
										}}
									/>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReviewsPage() {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [locationFilter, setLocationFilter] = useState("all");
	const [ratingFilter, setRatingFilter] = useState("all");
	const [sentimentFilter, setSentimentFilter] = useState("all");
	const [sourceFilter, setSourceFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [replyDialogOpen, setReplyDialogOpen] = useState(false);
	const [replyTarget, setReplyTarget] = useState<{
		id: number;
		reviewerName: string | null;
		existingReply: string | null;
	} | null>(null);
	const [replyText, setReplyText] = useState("");

	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
		trpc.seo.reviews.list.queryOptions({ limit: 100 }),
	);

	const { mutate: submitReply, isPending: replyPending } = useMutation({
		...trpc.seo.reviews.reply.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.reviews.list.queryKey(),
			});
			setReplyDialogOpen(false);
			setReplyTarget(null);
			setReplyText("");
		},
	});

	const { mutate: resolveReview, isPending: resolvePending } = useMutation({
		...trpc.seo.reviews.resolve.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.reviews.list.queryKey(),
			});
		},
	});

	const { mutate: autoTag, isPending: autoTagging } = useMutation({
		...trpc.seo.reviews.autoTag.mutationOptions(),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.reviews.list.queryKey(),
			});
			alert(`Auto-tagged ${data.updated} reviews with sentiment.`);
		},
	});

	const liveReviews: ReviewRow[] = (reviewsData?.reviews ?? []).map((r) => ({
		id: r.id,
		reviewer: r.reviewerName ?? "Anonymous",
		initials: (r.reviewerName ?? "A")
			.split(" ")
			.map((n: string) => n[0] ?? "")
			.join("")
			.slice(0, 2)
			.toUpperCase(),
		location: r.locationCity ?? "Unknown",
		rating: r.rating,
		text: r.text ?? "",
		date: new Date(r.reviewDate).toISOString().split("T")[0],
		source: (r.source ?? "google") as ReviewRow["source"],
		sentiment: (r.sentiment ?? "neutral") as ReviewRow["sentiment"],
		replied: r.reply !== null && r.reply !== undefined,
		tags: [],
	}));

	const unresolvedNegative = liveReviews.filter(
		(r) => r.rating <= 2 && !r.replied,
	);

	const filteredData = liveReviews.filter((r) => {
		if (locationFilter !== "all" && r.location !== locationFilter) return false;
		if (ratingFilter !== "all" && r.rating !== Number(ratingFilter))
			return false;
		if (sentimentFilter !== "all" && r.sentiment !== sentimentFilter)
			return false;
		if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
		if (search) {
			const q = search.toLowerCase();
			if (
				!r.reviewer.toLowerCase().includes(q) &&
				!r.text.toLowerCase().includes(q) &&
				!r.location.toLowerCase().includes(q)
			)
				return false;
		}
		return true;
	});

	const columns: ColumnDef<ReviewRow>[] = [
		{
			accessorKey: "reviewer",
			header: "Reviewer",
			cell: ({ row }) => {
				const r = row.original;
				return (
					<div className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarFallback
								style={{
									backgroundColor: sentimentAvatarColor(r.sentiment),
									color: "#fff",
									fontSize: "11px",
									fontWeight: 600,
								}}
							>
								{r.initials}
							</AvatarFallback>
						</Avatar>
						<span className="font-medium text-sm whitespace-nowrap">
							{r.reviewer}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "location",
			header: "Location",
			cell: ({ getValue }) => (
				<span className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
					<MapPin size={13} className="text-gray-400" />
					{getValue() as string}
				</span>
			),
		},
		{
			accessorKey: "rating",
			header: ({ column }) => (
				<button
					type="button"
					className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Rating <ChevronsUpDown size={13} />
				</button>
			),
			cell: ({ getValue }) => <StarRating rating={getValue() as number} />,
		},
		{
			accessorKey: "source",
			header: "Source",
			cell: ({ getValue }) => {
				const src = getValue() as string;
				return (
					<Badge
						style={{
							backgroundColor: src === "google" ? "#dbeafe" : "#e0e7ff",
							color: src === "google" ? "#1d4ed8" : "#4338ca",
							border: "none",
						}}
					>
						{src === "google" ? "Google" : "Facebook"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "sentiment",
			header: "Sentiment",
			cell: ({ getValue }) => {
				const s = getValue() as ReviewRow["sentiment"];
				const cfg: Record<
					ReviewRow["sentiment"],
					{ bg: string; color: string }
				> = {
					positive: { bg: "#dcfce7", color: "#15803d" },
					neutral: { bg: "#fef9c3", color: "#a16207" },
					negative: { bg: "#fee2e2", color: "#b91c1c" },
				};
				const labels: Record<ReviewRow["sentiment"], string> = {
					positive: "Positive",
					neutral: "Neutral",
					negative: "Negative",
				};
				return (
					<Badge
						style={{
							backgroundColor: cfg[s].bg,
							color: cfg[s].color,
							border: "none",
						}}
					>
						{labels[s]}
					</Badge>
				);
			},
		},
		{
			accessorKey: "date",
			header: ({ column }) => (
				<button
					type="button"
					className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Date <ChevronsUpDown size={13} />
				</button>
			),
			cell: ({ getValue }) => (
				<span className="text-sm text-gray-600 whitespace-nowrap">
					{format(new Date(getValue() as string), "MMM d, yyyy")}
				</span>
			),
		},
		{
			accessorKey: "replied",
			header: "Reply Status",
			cell: ({ getValue }) => {
				const replied = getValue() as boolean;
				if (replied) {
					return (
						<Badge
							style={{
								backgroundColor: "#dcfce7",
								color: "#15803d",
								border: "none",
							}}
						>
							✓ Replied
						</Badge>
					);
				}
				return (
					<Button
						size="sm"
						variant="outline"
						className="h-6 px-2 text-xs border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
					>
						Needs Reply
					</Button>
				);
			},
		},
		{
			accessorKey: "text",
			header: "Review",
			cell: ({ getValue }) => {
				const text = getValue() as string;
				const truncated = text.length > 80 ? `${text.slice(0, 80)}…` : text;
				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-sm text-gray-600 cursor-default">
									{truncated}
								</span>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								<p className="text-xs">{text}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const r = row.original;
				return (
					<div className="flex items-center gap-1.5">
						<Button
							size="sm"
							variant="outline"
							className="h-7 px-2 text-xs gap-1"
							onClick={() => {
								setReplyTarget({
									id: r.id,
									reviewerName: r.reviewer,
									existingReply: r.replied ? r.text : null,
								});
								setReplyText(r.replied ? (r.text ?? "") : "");
								setReplyDialogOpen(true);
							}}
						>
							<MessageSquare size={12} />
							{r.replied ? "Edit Reply" : "Reply"}
						</Button>
						<Button
							size="sm"
							variant="outline"
							className={`h-7 px-2 text-xs gap-1 ${
								r.replied
									? "text-green-600 border-green-200 hover:bg-green-50"
									: ""
							}`}
							onClick={() =>
								resolveReview({ reviewId: r.id, resolved: !r.replied })
							}
							disabled={resolvePending}
						>
							<CheckCircle2 size={12} />
							{r.replied ? "Resolved" : "Resolve"}
						</Button>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: filteredData,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		filterFns: { fuzzy: fuzzyFilter },
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (reviewsLoading) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-9 w-36" />
					))}
				</div>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div
			className="min-h-screen"
			style={{ backgroundColor: "var(--bounty-content-bg)" }}
		>
			<div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1
							className="text-2xl font-bold text-gray-900"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							Review Tracker
						</h1>
						<p className="text-sm text-gray-500 mt-0.5">
							Monitor Google Maps &amp; Facebook reviews across all branches
						</p>
					</div>
					{/* Summary stats */}
					<div className="flex flex-wrap items-center gap-3 text-sm">
						<span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-medium text-gray-700 shadow-sm">
							<MessageCircle size={14} className="text-gray-400" />
							Total: <strong>{reviewsData?.total ?? 0}</strong>
						</span>
						<span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-medium text-gray-700 shadow-sm">
							<Star size={14} fill="#D4A017" stroke="#D4A017" />
							Avg:{" "}
							<strong>
								{liveReviews.length > 0
									? (
											liveReviews.reduce((sum, r) => sum + r.rating, 0) /
											liveReviews.length
										).toFixed(1)
									: "—"}
								★
							</strong>
						</span>
						<span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-medium text-amber-700 shadow-sm">
							Pending Reply:{" "}
							<strong>{liveReviews.filter((r) => !r.replied).length}</strong>
						</span>
						<span className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 font-medium text-green-700 shadow-sm">
							This Week:{" "}
							<strong>
								+
								{
									liveReviews.filter((r) => {
										const d = new Date(r.date);
										const weekAgo = new Date();
										weekAgo.setDate(weekAgo.getDate() - 7);
										return d >= weekAgo;
									}).length
								}
							</strong>
						</span>
						<Button
							variant="outline"
							size="sm"
							className="gap-2 self-start sm:self-auto"
							onClick={() => autoTag()}
							disabled={autoTagging}
						>
							{autoTagging ? (
								<RefreshCw size={14} className="animate-spin" />
							) : (
								<span className="text-sm">✦</span>
							)}
							{autoTagging ? "Tagging…" : "Auto-Tag Sentiment"}
						</Button>
					</div>
				</div>

				{/* Low-star alert banner */}
				{unresolvedNegative.length > 0 && (
					<div
						className="flex items-start gap-3 rounded-xl border px-4 py-3"
						style={{
							backgroundColor: "#FEF2F2",
							borderColor: "#FECACA",
						}}
					>
						<AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-red-700">
								{unresolvedNegative.length} unresolved low-rating{" "}
								{unresolvedNegative.length === 1 ? "review" : "reviews"} need
								attention
							</p>
							<p className="text-xs text-red-500 mt-0.5">
								{unresolvedNegative
									.slice(0, 3)
									.map((r) => `${r.reviewer} (${r.rating}★ · ${r.location})`)
									.join(" · ")}
								{unresolvedNegative.length > 3 &&
									` · +${unresolvedNegative.length - 3} more`}
							</p>
						</div>
						<button
							type="button"
							className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors shrink-0"
							onClick={() => {
								setRatingFilter("2");
							}}
						>
							View all →
						</button>
					</div>
				)}

				{/* Filter Bar */}
				<Card>
					<CardContent className="pt-4 pb-4">
						<div className="flex flex-wrap gap-3 items-center">
							<Select value={locationFilter} onValueChange={setLocationFilter}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="All Locations" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Locations</SelectItem>
									<SelectItem value="Chaguanas">Chaguanas</SelectItem>
									<SelectItem value="San Fernando">San Fernando</SelectItem>
									<SelectItem value="Port of Spain">Port of Spain</SelectItem>
									<SelectItem value="Arima">Arima</SelectItem>
								</SelectContent>
							</Select>

							<Select value={ratingFilter} onValueChange={setRatingFilter}>
								<SelectTrigger className="w-36">
									<SelectValue placeholder="All Ratings" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Ratings</SelectItem>
									<SelectItem value="5">5★</SelectItem>
									<SelectItem value="4">4★</SelectItem>
									<SelectItem value="3">3★</SelectItem>
									<SelectItem value="2">2★</SelectItem>
									<SelectItem value="1">1★</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={sentimentFilter}
								onValueChange={setSentimentFilter}
							>
								<SelectTrigger className="w-36">
									<SelectValue placeholder="All Sentiments" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="positive">Positive</SelectItem>
									<SelectItem value="neutral">Neutral</SelectItem>
									<SelectItem value="negative">Negative</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sourceFilter} onValueChange={setSourceFilter}>
								<SelectTrigger className="w-36">
									<SelectValue placeholder="All Sources" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Sources</SelectItem>
									<SelectItem value="google">Google</SelectItem>
									<SelectItem value="facebook">Facebook</SelectItem>
								</SelectContent>
							</Select>

							<div className="flex-1 min-w-48">
								<Input
									placeholder="Search reviews..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="h-9"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Review Trends */}
				{liveReviews.length > 0 && <ReviewTrendsCard reviews={liveReviews} />}

				{/* Per-location breakdown */}
				{liveReviews.length > 0 && (
					<PerLocationBreakdown reviews={liveReviews} />
				)}

				{/* Table */}
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto rounded-lg">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map((hg) => (
										<TableRow
											key={hg.id}
											className="bg-gray-50 border-b border-gray-200"
										>
											{hg.headers.map((header) => (
												<TableHead
													key={header.id}
													className="text-xs font-semibold uppercase tracking-wide text-gray-500 py-3 px-4"
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</TableHead>
											))}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className="py-3 px-4 align-middle"
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))}
									{table.getRowModel().rows.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={columns.length}
												className="text-center py-12 text-gray-400"
											>
												No reviews match the current filters.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Pagination info */}
				<p className="text-sm text-gray-500 text-right">
					Showing <strong>{table.getRowModel().rows.length}</strong> of{" "}
					<strong>{liveReviews.length}</strong> reviews
				</p>
			</div>

			{/* Reply Dialog */}
			<Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle style={{ fontFamily: "Fraunces, serif" }}>
							{replyTarget?.existingReply ? "Edit Reply" : "Reply to Review"}
						</DialogTitle>
						<DialogDescription>
							Responding to {replyTarget?.reviewerName ?? "this customer"}'s
							review. Replies are visible publicly on Google Business Profile.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<Label htmlFor="reply-text">Your Reply</Label>
						<Textarea
							id="reply-text"
							rows={5}
							placeholder="Thank you for your feedback! We appreciate you taking the time to share your experience at Bounty Supermarket..."
							value={replyText}
							onChange={(e) => setReplyText(e.target.value)}
							className="resize-none"
						/>
						<p className="text-xs text-gray-400">
							Keep it professional and empathetic. Address specific concerns
							where possible.
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setReplyDialogOpen(false);
								setReplyTarget(null);
								setReplyText("");
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={replyPending || !replyText.trim()}
							onClick={() => {
								if (!replyTarget) return;
								submitReply({
									reviewId: replyTarget.id,
									replyText: replyText.trim(),
								});
							}}
							style={{ backgroundColor: "#D4A017", color: "#000" }}
						>
							Save Reply
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
