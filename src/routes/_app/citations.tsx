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
	ExternalLink,
	Info,
	Plus,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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
import { Progress } from "#/components/ui/progress";
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
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/citations")({
	component: CitationsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface CitationRow {
	id: number;
	directory: string;
	url: string;
	listing: string;
	location: string;
	nameMatch: boolean;
	addressMatch: boolean;
	phoneMatch: boolean;
	websiteMatch: boolean;
	napScore: number;
	status: "active" | "incorrect" | "missing" | "unchecked";
	lastChecked: string;
}

// ─── Directory Coverage ──────────────────────────────────────────────────────

const IMPORTANT_DIRECTORIES = [
	{
		name: "Google Business Profile",
		priority: "critical" as const,
		tip: "Most important for local Google Maps rankings",
	},
	{
		name: "Facebook Business",
		priority: "high" as const,
		tip: "Large user base in Kenya — drives direct foot traffic",
	},
	{
		name: "Apple Maps Connect",
		priority: "high" as const,
		tip: "iOS users and growing smartphone penetration",
	},
	{
		name: "Bing Places",
		priority: "medium" as const,
		tip: "Powers some mapping & search features",
	},
	{
		name: "Kenya Yellow Pages",
		priority: "high" as const,
		tip: "Top local business directory for Kenya",
	},
	{
		name: "TripAdvisor",
		priority: "medium" as const,
		tip: "Lifestyle and travel searches",
	},
	{
		name: "Foursquare",
		priority: "low" as const,
		tip: "Feeds many third-party mapping apps",
	},
	{
		name: "Yelp",
		priority: "low" as const,
		tip: "International platform with growing Kenya presence",
	},
	{
		name: "Kenya National Chamber of Commerce",
		priority: "medium" as const,
		tip: "Adds credibility with official listing",
	},
];

// ─── Filter Functions ────────────────────────────────────────────────────────

// Required by the global FilterFns augmentation declared in src/routes/demo/table.tsx
const fuzzyFilter: FilterFn<unknown> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), String(value));
	addMeta({ itemRank });
	return itemRank.passed;
};

// ─── Coverage Checklist ──────────────────────────────────────────────────────

function CoverageChecklist({ citations }: { citations: CitationRow[] }) {
	const PRIORITY_ORDER: Record<string, number> = {
		critical: 0,
		high: 1,
		medium: 2,
		low: 3,
	};

	const items = IMPORTANT_DIRECTORIES.map((dir) => {
		const match = citations.find(
			(c) =>
				c.directory
					.toLowerCase()
					.includes(dir.name.toLowerCase().split(" ")[0]) ||
				dir.name
					.toLowerCase()
					.includes(c.directory.toLowerCase().split(" ")[0]),
		);
		const coverage = !match
			? "missing"
			: match.status === "active"
				? "active"
				: "issue";
		return { ...dir, coverage, listingUrl: match?.listing || match?.url || "" };
	}).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

	const covered = items.filter((i) => i.coverage === "active").length;
	const total = items.length;
	const coveragePct = Math.round((covered / total) * 100);

	const priorityColors: Record<string, string> = {
		critical: "#EF4444",
		high: "#F97316",
		medium: "#D4A017",
		low: "#9CA3AF",
	};
	const priorityLabels: Record<string, string> = {
		critical: "Critical",
		high: "High",
		medium: "Medium",
		low: "Low",
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-4">
					<div>
						<CardTitle className="text-base">Directory Coverage</CardTitle>
						<CardDescription className="text-xs mt-0.5">
							Key directories for Bounty Supermarket Kenya
						</CardDescription>
					</div>
					<div className="text-right shrink-0">
						<span
							className="text-2xl font-black tabular-nums"
							style={{
								color:
									coveragePct >= 80
										? "#22C55E"
										: coveragePct >= 60
											? "#D4A017"
											: "#EF4444",
							}}
						>
							{coveragePct}%
						</span>
						<p className="text-xs text-muted-foreground">
							{covered}/{total} covered
						</p>
					</div>
				</div>
				<Progress value={coveragePct} className="h-1.5 mt-2" />
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					{items.map((item) => (
						<div
							key={item.name}
							className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
								item.coverage === "active"
									? "bg-green-50/70 dark:bg-green-950/20 border-green-200 dark:border-green-900/50"
									: item.coverage === "issue"
										? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
										: "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
							}`}
						>
							{/* Status icon */}
							<div className="shrink-0">
								{item.coverage === "active" ? (
									<CheckCircle2 size={17} className="text-green-500" />
								) : item.coverage === "issue" ? (
									<AlertTriangle size={17} className="text-amber-500" />
								) : (
									<XCircle size={17} className="text-red-400" />
								)}
							</div>

							{/* Name + tip */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-sm font-medium text-foreground">
										{item.name}
									</span>
									<span
										className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
										style={{
											backgroundColor: `${priorityColors[item.priority]}20`,
											color: priorityColors[item.priority],
										}}
									>
										{priorityLabels[item.priority]}
									</span>
								</div>
								<p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">
									{item.tip}
								</p>
							</div>

							{/* Status + link */}
							<div className="shrink-0 flex items-center gap-2">
								<span
									className="text-xs font-medium"
									style={{
										color:
											item.coverage === "active"
												? "#16a34a"
												: item.coverage === "issue"
													? "#d97706"
													: "#dc2626",
									}}
								>
									{item.coverage === "active"
										? "Listed ✓"
										: item.coverage === "issue"
											? "Has issues"
											: "Not listed"}
								</span>
								{item.listingUrl && (
									<a
										href={item.listingUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-gray-400 hover:text-blue-500 transition-colors"
									>
										<ExternalLink size={13} />
									</a>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function NapScoreBar({ score }: { score: number }) {
	let color = "#dc2626";
	if (score >= 90) color = "#16a34a";
	else if (score >= 70) color = "#D4A017";
	else if (score >= 50) color = "#ea580c";

	return (
		<div className="flex items-center gap-2 min-w-[100px]">
			<div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all"
					style={{ width: `${score}%`, backgroundColor: color }}
				/>
			</div>
			<span className="text-xs font-semibold tabular-nums" style={{ color }}>
				{score}%
			</span>
		</div>
	);
}

function BoolIcon({ value }: { value: boolean }) {
	if (value)
		return <CheckCircle2 size={16} className="text-green-500 mx-auto" />;
	return <XCircle size={16} className="text-red-500 mx-auto" />;
}

function StatusBadge({ status }: { status: CitationRow["status"] }) {
	const cfg: Record<
		CitationRow["status"],
		{ bg: string; color: string; label: string }
	> = {
		active: { bg: "#dcfce7", color: "#15803d", label: "Active" },
		incorrect: { bg: "#fef9c3", color: "#a16207", label: "Incorrect" },
		missing: { bg: "#fee2e2", color: "#b91c1c", label: "Missing" },
		unchecked: { bg: "#f3f4f6", color: "#6b7280", label: "Unchecked" },
	};
	const c = cfg[status];
	return (
		<Badge style={{ backgroundColor: c.bg, color: c.color, border: "none" }}>
			{c.label}
		</Badge>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CitationsPage() {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState({
		locationId: "",
		directoryName: "",
		directoryUrl: "",
		listingUrl: "",
	});
	const queryClient = useQueryClient();

	const trpc = useTRPC();
	const { mutate: createCitation, isPending: creating } = useMutation({
		...trpc.seo.citations.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.citations.list.queryKey(),
			});
			setDialogOpen(false);
			setForm({
				locationId: "",
				directoryName: "",
				directoryUrl: "",
				listingUrl: "",
			});
		},
	});
	const { data: locations } = useQuery(trpc.seo.locations.list.queryOptions());
	const { data: citationsRaw, isLoading: citLoading } = useQuery(
		trpc.seo.citations.list.queryOptions(),
	);

	const liveCitations: CitationRow[] = (citationsRaw ?? []).map((c) => ({
		id: c.id,
		directory: c.directoryName,
		url: c.directoryUrl ?? "",
		listing: c.listingUrl ?? "",
		location: c.locationCity ?? "Unknown",
		nameMatch: c.nameMatch ?? false,
		addressMatch: c.addressMatch ?? false,
		phoneMatch: c.phoneMatch ?? false,
		websiteMatch: false, // websiteMatch not returned by this procedure stub
		napScore: c.napScore ?? 0,
		status: (c.status ?? "unchecked") as CitationRow["status"],
		lastChecked: c.lastChecked
			? new Date(c.lastChecked).toISOString().split("T")[0]
			: "Never",
	}));

	const columns: ColumnDef<CitationRow>[] = [
		{
			accessorKey: "directory",
			header: "Directory",
			cell: ({ row }) => {
				const { directory, listing, url } = row.original;
				const href = listing || url;
				return (
					<div className="flex items-center gap-1.5">
						<span className="font-medium text-sm text-foreground whitespace-nowrap">
							{directory}
						</span>
						{href && (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-blue-500 transition-colors"
							>
								<ExternalLink size={13} />
							</a>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "location",
			header: "Location",
			cell: ({ getValue }) => (
				<span className="text-sm text-gray-200 dark:text-gray-200 whitespace-nowrap">
					{getValue() as string}
				</span>
			),
		},
		{
			accessorKey: "napScore",
			header: "NAP Score",
			cell: ({ getValue }) => <NapScoreBar score={getValue() as number} />,
		},
		{
			accessorKey: "nameMatch",
			header: "Name",
			cell: ({ getValue }) => <BoolIcon value={getValue() as boolean} />,
		},
		{
			accessorKey: "addressMatch",
			header: "Address",
			cell: ({ getValue }) => <BoolIcon value={getValue() as boolean} />,
		},
		{
			accessorKey: "phoneMatch",
			header: "Phone",
			cell: ({ getValue }) => <BoolIcon value={getValue() as boolean} />,
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => (
				<StatusBadge status={getValue() as CitationRow["status"]} />
			),
		},
		{
			accessorKey: "lastChecked",
			header: "Last Checked",
			cell: ({ getValue }) => {
				const val = getValue() as string;
				if (!val || val === "Never") {
					return (
						<span className="text-sm text-gray-200 dark:text-gray-200 whitespace-nowrap">
							Never
						</span>
					);
				}
				return (
					<span className="text-sm text-gray-200 dark:text-gray-200 whitespace-nowrap">
						{format(new Date(val), "MMM d, yyyy")}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const { listing, url } = row.original;
				const href = listing || url;
				return (
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="h-7 px-2 text-xs gap-1"
						>
							<RefreshCw size={12} />
							Check Now
						</Button>
						{href && (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors"
							>
								<ExternalLink size={13} />
							</a>
						)}
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: liveCitations,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		filterFns: { fuzzy: fuzzyFilter },
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (citLoading) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-lg" />
					))}
				</div>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-14 w-full rounded-lg" />
				))}
			</div>
		);
	}

	const overallHealth = Math.round(
		liveCitations.reduce((sum, c) => sum + c.napScore, 0) /
			Math.max(liveCitations.length, 1),
	);

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
			<div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1
							className="text-2xl font-bold text-white"
							style={{ fontFamily: "Fraunces, serif" }}
						>
							Citation Manager
						</h1>
						<p className="text-sm text-gray-400 mt-0.5">
							Track NAP consistency across business directories
						</p>
					</div>
					<Button
						className="gap-2 self-start sm:self-auto"
						style={{ backgroundColor: "#D4A017", color: "#000" }}
						onClick={() => setDialogOpen(true)}
					>
						<Plus size={16} />
						Add Citation
					</Button>
				</div>

				{/* KPI Summary */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{/* Overall Health */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold text-gray-300">
								Overall Health
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<span className="text-3xl font-bold text-white">
								{overallHealth}%
							</span>
							<Progress value={overallHealth} className="h-2" />
						</CardContent>
					</Card>

					{/* Active Listings */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold text-gray-300">
								Active Listings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<span className="text-3xl font-bold text-white">
								{liveCitations.filter((c) => c.status === "active").length}
							</span>
							<span className="text-lg text-gray-400 font-medium">
								{" "}
								of {liveCitations.length}
							</span>
							<p className="text-xs text-gray-400 mt-1">
								across all directories
							</p>
						</CardContent>
					</Card>

					{/* Issues Found */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold text-gray-300">
								Issues Found
							</CardTitle>
						</CardHeader>
						<CardContent className="flex items-center gap-3">
							<span className="text-3xl font-bold text-red-500">
								{liveCitations.filter((c) => c.status !== "active").length}
							</span>
							<AlertTriangle size={24} className="text-red-400" />
						</CardContent>
					</Card>
				</div>

				{/* Directory Coverage Checklist */}
				<CoverageChecklist citations={liveCitations} />

				{/* Table */}
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto rounded-lg">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map((hg) => (
										<TableRow
											key={hg.id}
											className="bg-gray-900 border-b border-gray-800"
										>
											{hg.headers.map((header) => (
												<TableHead
													key={header.id}
													className="text-xs font-semibold uppercase tracking-wide text-gray-400 py-3 px-4 text-center first:text-left last:text-left"
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
											className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className="py-3 px-4 align-middle text-center first:text-left last:text-left text-gray-300"
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* NAP Consistency Tips */}
				<div
					className="rounded-xl border p-5 space-y-3"
					style={{
						backgroundColor: "rgba(212,160,23,0.08)",
						borderColor: "rgba(212,160,23,0.4)",
					}}
				>
					<div className="flex items-center gap-2 mb-1">
						<Info size={16} style={{ color: "#D4A017" }} />
						<span
							className="font-semibold text-sm"
							style={{ color: "#92610a" }}
						>
							NAP Consistency Tips
						</span>
					</div>
					<ul className="space-y-2">
						<li
							className="flex items-start gap-2 text-sm"
							style={{ color: "#78540a" }}
						>
							<span className="mt-0.5 shrink-0" style={{ color: "#D4A017" }}>
								•
							</span>
							Ensure your business name is exactly{" "}
							<strong>&apos;Bounty Supermarket&apos;</strong> (not
							&apos;Bounty&apos;s&apos; or &apos;Bounty Super Mkt&apos;)
						</li>
						<li
							className="flex items-start gap-2 text-sm"
							style={{ color: "#78540a" }}
						>
							<span className="mt-0.5 shrink-0" style={{ color: "#D4A017" }}>
								•
							</span>
							Canonical phone: <strong>+254 20 222 1234</strong> — ensure all
							listings match
						</li>
						<li
							className="flex items-start gap-2 text-sm"
							style={{ color: "#78540a" }}
						>
							<span className="mt-0.5 shrink-0" style={{ color: "#D4A017" }}>
								•
							</span>
							Website URL: <strong>https://www.bountybasket.online</strong> —
							use consistent URL format
						</li>
					</ul>
				</div>
			</div>

			{/* Add Citation Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle style={{ fontFamily: "Fraunces, serif" }}>
							Add Citation
						</DialogTitle>
						<DialogDescription>
							Track a new business directory listing for Bounty Supermarket.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{/* Location */}
						<div className="space-y-1.5">
							<Label className="text-gray-200 dark:text-gray-200 font-medium">
								Branch
							</Label>
							<Select
								value={form.locationId}
								onValueChange={(v) => setForm((f) => ({ ...f, locationId: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select branch" />
								</SelectTrigger>
								<SelectContent>
									{(locations ?? []).map((loc) => (
										<SelectItem key={loc.id} value={String(loc.id)}>
											{loc.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Directory Name */}
						<div className="space-y-1.5">
							<Label className="text-gray-200 dark:text-gray-200 font-medium">
								Directory Name
							</Label>
							<Input
								placeholder="e.g. Kenya Yellow Pages"
								value={form.directoryName}
								onChange={(e) =>
									setForm((f) => ({ ...f, directoryName: e.target.value }))
								}
								className="placeholder:text-gray-400"
							/>
						</div>

						{/* Directory URL */}
						<div className="space-y-1.5">
							<Label className="text-gray-200 dark:text-gray-200 font-medium">
								Directory URL{" "}
								<span className="text-gray-400 font-normal">(optional)</span>
							</Label>
							<Input
								type="url"
								placeholder="https://yellowpages.co.ke"
								value={form.directoryUrl}
								onChange={(e) =>
									setForm((f) => ({ ...f, directoryUrl: e.target.value }))
								}
								className="placeholder:text-gray-400"
							/>
						</div>

						{/* Listing URL */}
						<div className="space-y-1.5">
							<Label className="text-gray-200 dark:text-gray-200 font-medium">
								Listing URL{" "}
								<span className="text-gray-400 font-normal">(optional)</span>
							</Label>
							<Input
								type="url"
								placeholder="https://yellowpages.co.ke/bounty-supermarket"
								value={form.listingUrl}
								onChange={(e) =>
									setForm((f) => ({ ...f, listingUrl: e.target.value }))
								}
								className="placeholder:text-gray-400"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={
								creating || !form.locationId || !form.directoryName.trim()
							}
							onClick={() => {
								createCitation({
									locationId: parseInt(form.locationId, 10),
									directoryName: form.directoryName.trim(),
									directoryUrl: form.directoryUrl || undefined,
									listingUrl: form.listingUrl || undefined,
								});
							}}
							style={{ backgroundColor: "#D4A017", color: "#000" }}
						>
							{creating ? "Adding…" : "Add Citation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
