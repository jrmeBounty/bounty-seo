import { rankItem } from "@tanstack/match-sorter-utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef, FilterFn, SortingState } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	BarChart2,
	ChevronsUpDown,
	Download,
	MapPin,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
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

export const Route = createFileRoute("/_app/rankings")({
	component: RankingsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeywordRow {
	id: number;
	term: string;
	location: string;
	category: "branded" | "local" | "category" | "competitor";
	currentPos: number;
	prevPos: number;
	target: number;
	trend: number;
	lastChecked: string;
	isActive: boolean;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const addKeywordSchema = z.object({
	term: z.string().min(2, "Term must be at least 2 characters"),
	location: z.string().min(1, "Location is required"),
	category: z.enum(["local", "branded", "category", "competitor"]),
	targetPosition: z.number().int().min(1).max(20),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
	{ value: "local", label: "Local" },
	{ value: "branded", label: "Branded" },
	{ value: "category", label: "Category" },
	{ value: "competitor", label: "Competitor" },
] as const;

// ─── Helper components ────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: KeywordRow["category"] }) {
	const cfg: Record<KeywordRow["category"], string> = {
		branded: "bg-purple-100 text-purple-700 border-purple-200",
		local: "bg-blue-100 text-blue-700 border-blue-200",
		category: "bg-amber-100 text-amber-700 border-amber-200",
		competitor: "bg-red-100 text-red-700 border-red-200",
	};
	const labels: Record<KeywordRow["category"], string> = {
		branded: "Branded",
		local: "Local",
		category: "Category",
		competitor: "Competitor",
	};
	return (
		<Badge className={`${cfg[category]} px-1.5 py-0 text-[10px]`}>
			{labels[category]}
		</Badge>
	);
}

function getPositionColor(pos: number): string {
	if (pos === 1) return "#22C55E";
	if (pos <= 3) return "#D4A017";
	if (pos <= 5) return "#F97316";
	return "#EF4444";
}

// Required by the global FilterFns augmentation declared in src/routes/demo/table.tsx
const fuzzyFilter: FilterFn<unknown> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), String(value));
	addMeta({ itemRank });
	return itemRank.passed;
};

// ─── CSV Export helper ───────────────────────────────────────────────────────

function exportToCSV(data: KeywordRow[]) {
	const headers = [
		"Keyword",
		"Location",
		"Category",
		"Current Position",
		"Previous Position",
		"Trend",
		"Target Position",
		"Last Checked",
		"Active",
	];
	const rows = data.map((r) => [
		`"${r.term}"`,
		`"${r.location}"`,
		r.category,
		r.currentPos ?? "",
		r.prevPos ?? "",
		r.trend > 0 ? `+${r.trend}` : String(r.trend),
		r.target,
		r.lastChecked ?? "",
		r.isActive ? "Yes" : "No",
	]);
	const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `bounty-rankings-${new Date().toISOString().split("T")[0]}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

// ─── CSV Import parser ──────────────────────────────────────────────────────

function parseKeywordCSV(
	text: string,
): Array<{ term: string; category: string; targetPosition: number }> {
	const VALID_CATEGORIES = [
		"local",
		"branded",
		"category",
		"competitor",
	] as const;
	const lines = text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	const rows: Array<{
		term: string;
		category: string;
		targetPosition: number;
	}> = [];
	for (const line of lines) {
		const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
		const term = cols[0];
		if (!term || term.toLowerCase() === "keyword") continue; // skip empty or header
		const cat = VALID_CATEGORIES.includes(
			cols[1] as (typeof VALID_CATEGORIES)[number],
		)
			? (cols[1] as string)
			: "local";
		const target = parseInt(cols[2] ?? "3", 10);
		rows.push({
			term,
			category: cat,
			targetPosition: Number.isNaN(target)
				? 3
				: Math.min(Math.max(target, 1), 20),
		});
	}
	return rows;
}

// ─── Page component ───────────────────────────────────────────────────────────

function RankingsPage() {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [locationFilter, setLocationFilter] = useState("all");
	const [dialogOpen, setDialogOpen] = useState(false);

	// Edit keyword state
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingKw, setEditingKw] = useState<KeywordRow | null>(null);
	const [editTerm, setEditTerm] = useState("");
	const [editTarget, setEditTarget] = useState(3);

	// Import CSV state
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [importLocationId, setImportLocationId] = useState("");
	const [importRows, setImportRows] = useState<
		Array<{ term: string; category: string; targetPosition: number }>
	>([]);
	const [importStatus, setImportStatus] = useState<
		"idle" | "importing" | "done"
	>("idle");
	const [importProgress, setImportProgress] = useState(0);

	// ── tRPC ────────────────────────────────────────────────────────────────────
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Fetch locations for filter dropdown + Add Keyword form
	const { data: locations } = useQuery(trpc.seo.locations.list.queryOptions());

	// Resolve selected location ID (undefined = all locations)
	const selectedLocId =
		locationFilter === "all"
			? undefined
			: locations?.find((l) => l.city === locationFilter)?.id;

	// Fetch keywords — re-runs when locationFilter changes
	const { data: keywordsRaw, isLoading: kwLoading } = useQuery(
		trpc.seo.keywords.list.queryOptions(
			selectedLocId ? { locationId: selectedLocId } : undefined,
		),
	);

	// Create keyword mutation
	const { mutate: createKeyword, isPending: creating } = useMutation({
		...trpc.seo.keywords.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.keywords.list.queryKey(),
			});
			setDialogOpen(false);
		},
	});

	// Delete keyword mutation
	const { mutate: deleteKeyword } = useMutation({
		...trpc.seo.keywords.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.seo.keywords.list.queryKey(),
			});
		},
	});

	// Check Now mutation
	const { mutate: checkNow, variables: checkingVariables } = useMutation({
		...trpc.seo.rankings.checkNow.mutationOptions(),
		onSuccess: () => {
			// Only invalidate the specific keyword to avoid refreshing all
			queryClient.invalidateQueries({
				queryKey: trpc.seo.keywords.list.queryKey(),
			});
		},
	});

	// Helper to check if a specific keyword is being checked
	const isKeywordChecking = (keywordId: number) => {
		return checkingVariables?.keywordId === keywordId;
	};

	// ── Map live data to KeywordRow shape ──────────────────────────────────────

	const tableData: KeywordRow[] = (keywordsRaw ?? []).map((kw) => ({
		id: kw.id,
		term: kw.term,
		location: kw.locationCity,
		category: (kw.category ?? "local") as KeywordRow["category"],
		currentPos: kw.currentPosition ?? 99,
		prevPos: kw.previousPosition ?? 99,
		target: kw.targetPosition ?? 3,
		trend: kw.trend ?? 0,
		lastChecked: kw.lastChecked ?? "Never",
		isActive: kw.isActive,
	}));

	// Summary stats
	const avgPos =
		tableData.length > 0
			? Math.round(
					(tableData.reduce((sum, k) => sum + k.currentPos, 0) /
						tableData.length) *
						10,
				) / 10
			: 0;
	const improvedCount = tableData.filter((k) => k.trend > 0).length;

	// ── TanStack Form ──────────────────────────────────────────────────────────

	const form = useForm({
		defaultValues: {
			term: "",
			location: "",
			category: "local" as "local" | "branded" | "category" | "competitor",
			targetPosition: 3,
		},
		onSubmit: async ({ value }) => {
			const locObj = locations?.find((l) => l.city === value.location);
			if (!locObj) return;
			createKeyword({
				term: value.term,
				locationId: locObj.id,
				category: value.category,
				targetPosition: value.targetPosition,
			});
		},
	});

	// ── TanStack Table columns ─────────────────────────────────────────────────

	const columns: ColumnDef<KeywordRow>[] = [
		{
			accessorKey: "term",
			header: ({ column }) => (
				<button
					type="button"
					className="flex items-center gap-1 font-medium text-foreground hover:text-foreground/80"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Keyword
					<ChevronsUpDown size={13} className="opacity-50" />
				</button>
			),
			cell: ({ row }) => (
				<div className="space-y-1 py-1">
					<p className="text-sm font-semibold leading-snug">
						{row.original.term}
					</p>
					<CategoryBadge category={row.original.category} />
				</div>
			),
		},
		{
			accessorKey: "location",
			header: "Location",
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<MapPin size={12} className="shrink-0" />
					{row.original.location}
				</div>
			),
		},
		{
			accessorKey: "currentPos",
			header: ({ column }) => (
				<button
					type="button"
					className="flex items-center gap-1 font-medium text-foreground hover:text-foreground/80"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Position
					<ChevronsUpDown size={13} className="opacity-50" />
				</button>
			),
			cell: ({ row }) => (
				<span
					className="text-xl font-bold tabular-nums"
					style={{ color: getPositionColor(row.original.currentPos) }}
				>
					#{row.original.currentPos}
				</span>
			),
		},
		{
			accessorKey: "trend",
			header: "Change",
			cell: ({ row }) => {
				const { trend } = row.original;
				if (trend > 0) {
					return (
						<Badge className="bg-green-100 text-green-700 border-green-200">
							↑ +{trend}
						</Badge>
					);
				}
				if (trend < 0) {
					return (
						<Badge className="bg-red-100 text-red-700 border-red-200">
							↓ {trend}
						</Badge>
					);
				}
				return (
					<Badge className="bg-gray-100 text-gray-500 border-gray-200">—</Badge>
				);
			},
		},
		{
			accessorKey: "target",
			header: "Target",
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
					Target: #{row.original.target}
				</span>
			),
		},
		{
			accessorKey: "isActive",
			header: "Status",
			cell: ({ row }) =>
				row.original.isActive ? (
					<Badge className="bg-green-100 text-green-700 border-green-200">
						Active
					</Badge>
				) : (
					<Badge className="bg-gray-100 text-gray-500 border-gray-200">
						Inactive
					</Badge>
				),
		},
		{
			id: "view",
			header: "",
			cell: ({ row }) => (
				<Link
					to="/rankings/$keywordId"
					params={{ keywordId: String(row.original.id) }}
					className="inline-flex items-center gap-1 text-xs font-medium text-[#D4A017] hover:text-[#b8870e] transition-colors"
				>
					<BarChart2 size={13} />
					Details
				</Link>
			),
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => (
				<div className="flex items-center gap-0.5">
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-2 text-xs gap-1"
						onClick={() =>
							checkNow({
								keywordId: row.original.id,
								locationId:
									keywordsRaw?.find((k) => k.id === row.original.id)
										?.locationId ?? 0,
							})
						}
						disabled={isKeywordChecking(row.original.id)}
					>
						<RefreshCw
							size={12}
							className={
								isKeywordChecking(row.original.id) ? "animate-spin" : ""
							}
						/>
						Check
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => {
							setEditingKw(row.original);
							setEditTerm(row.original.term);
							setEditTarget(row.original.target);
							setEditDialogOpen(true);
						}}
					>
						<Pencil size={14} />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-red-600"
						onClick={() => deleteKeyword({ id: row.original.id })}
					>
						<Trash2 size={14} />
					</Button>
				</div>
			),
		},
	];

	// ── TanStack Table instance ────────────────────────────────────────────────

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	// ─────────────────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 p-6">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						Rankings Tracker
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Monitor Google Maps positions for all keywords
					</p>
				</div>

				<div className="flex items-center gap-3">
					{/* Location filter */}
					<Select value={locationFilter} onValueChange={setLocationFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Locations</SelectItem>
							{(locations ?? []).map((loc) => (
								<SelectItem key={loc.id} value={loc.city}>
									{loc.city}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Import CSV */}
					<Button
						variant="outline"
						className="gap-2"
						onClick={() => {
							setImportRows([]);
							setImportLocationId("");
							setImportStatus("idle");
							setImportProgress(0);
							setImportDialogOpen(true);
						}}
					>
						<Upload size={16} />
						Import CSV
					</Button>

					{/* Export CSV */}
					<Button
						variant="outline"
						className="gap-2 self-start sm:self-auto"
						onClick={() => exportToCSV(tableData)}
					>
						<Download size={16} />
						Export CSV
					</Button>

					{/* Add Keyword button + Dialog */}
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button
								className="font-semibold text-black hover:opacity-90"
								style={{ backgroundColor: "var(--bounty-gold)" }}
							>
								<Plus size={14} />
								Add Keyword
							</Button>
						</DialogTrigger>

						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Add Keyword</DialogTitle>
								<DialogDescription>
									Track a new Google Maps position for a keyword and location.
								</DialogDescription>
							</DialogHeader>

							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									form.handleSubmit();
								}}
								className="space-y-4 pt-2"
							>
								{/* term */}
								<form.Field
									name="term"
									validators={{
										onChange: ({ value }) => {
											const result =
												addKeywordSchema.shape.term.safeParse(value);
											return result.success
												? undefined
												: result.error.issues[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-1.5">
											<Label htmlFor={field.name}>Keyword Term</Label>
											<Input
												id={field.name}
												placeholder="e.g. supermarket near me"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
											/>
											{field.state.meta.isTouched &&
												field.state.meta.errors[0] && (
													<p className="text-xs text-red-500">
														{String(field.state.meta.errors[0])}
													</p>
												)}
										</div>
									)}
								</form.Field>

								{/* location */}
								<form.Field
									name="location"
									validators={{
										onChange: ({ value }) => {
											const result =
												addKeywordSchema.shape.location.safeParse(value);
											return result.success
												? undefined
												: result.error.issues[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-1.5">
											<Label>Location</Label>
											<Select
												value={field.state.value}
												onValueChange={(val) => field.handleChange(val)}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select location" />
												</SelectTrigger>
												<SelectContent>
													{(locations ?? []).map((loc) => (
														<SelectItem key={loc.id} value={loc.city}>
															{loc.city}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{field.state.meta.isTouched &&
												field.state.meta.errors[0] && (
													<p className="text-xs text-red-500">
														{String(field.state.meta.errors[0])}
													</p>
												)}
										</div>
									)}
								</form.Field>

								{/* category */}
								<form.Field
									name="category"
									validators={{
										onChange: ({ value }) => {
											const result =
												addKeywordSchema.shape.category.safeParse(value);
											return result.success
												? undefined
												: result.error.issues[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-1.5">
											<Label>Category</Label>
											<Select
												value={field.state.value}
												onValueChange={(val) =>
													field.handleChange(
														val as
															| "local"
															| "branded"
															| "category"
															| "competitor",
													)
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
												<SelectContent>
													{CATEGORIES.map((cat) => (
														<SelectItem key={cat.value} value={cat.value}>
															{cat.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{field.state.meta.isTouched &&
												field.state.meta.errors[0] && (
													<p className="text-xs text-red-500">
														{String(field.state.meta.errors[0])}
													</p>
												)}
										</div>
									)}
								</form.Field>

								{/* targetPosition */}
								<form.Field
									name="targetPosition"
									validators={{
										onChange: ({ value }) => {
											const result =
												addKeywordSchema.shape.targetPosition.safeParse(value);
											return result.success
												? undefined
												: result.error.issues[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-1.5">
											<Label htmlFor={field.name}>Target Position (1–20)</Label>
											<Input
												id={field.name}
												type="number"
												min={1}
												max={20}
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(e.target.value, 10) || 1,
													)
												}
												onBlur={field.handleBlur}
											/>
											{field.state.meta.isTouched &&
												field.state.meta.errors[0] && (
													<p className="text-xs text-red-500">
														{String(field.state.meta.errors[0])}
													</p>
												)}
										</div>
									)}
								</form.Field>

								<DialogFooter className="pt-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => setDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={creating}
										className="font-semibold text-black hover:opacity-90"
										style={{ backgroundColor: "var(--bounty-gold)" }}
									>
										{creating ? "Adding…" : "Add Keyword"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* ── Summary stat cards ──────────────────────────────────────────── */}
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Tracked Keywords
					</p>
					<p className="mt-1 text-2xl font-bold text-foreground">
						{(keywordsRaw ?? []).length}
					</p>
				</div>
				<div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Avg Position
					</p>
					<p
						className="mt-1 text-2xl font-bold"
						style={{ color: "var(--bounty-gold)" }}
					>
						{avgPos}
					</p>
				</div>
				<div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
					<p className="text-xs font-medium text-muted-foreground">
						Improved This Week
					</p>
					<p className="mt-1 text-2xl font-bold text-green-600">
						{improvedCount}
					</p>
				</div>
			</div>

			{/* ── Global search ───────────────────────────────────────────────── */}
			<div>
				<Input
					placeholder="Search keywords, locations…"
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			{/* ── Table ───────────────────────────────────────────────────────── */}
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} className="px-4 py-3">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>

						<TableBody>
							{kwLoading ? (
								Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={columns.length}>
											<Skeleton className="h-8 w-full" />
										</TableCell>
									</TableRow>
								))
							) : table.getRowModel().rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="py-10 text-center text-sm text-muted-foreground"
									>
										No keywords found. Try adjusting your search or filter.
									</TableCell>
								</TableRow>
							) : (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="px-4 py-2">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Row count */}
			<p className="text-xs text-muted-foreground">
				Showing {table.getRowModel().rows.length} of {tableData.length} keywords
			</p>

			{/* ─── Import CSV Dialog ───────────────────────────────────────────── */}
			<Dialog
				open={importDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						setImportDialogOpen(false);
						setImportRows([]);
						setImportStatus("idle");
					}
				}}
			>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle style={{ fontFamily: "Fraunces, serif" }}>
							Import Keywords from CSV
						</DialogTitle>
						<DialogDescription>
							Upload a CSV file with columns: <strong>keyword</strong>, category
							(optional), targetPosition (optional). Category must be one of:
							local, branded, category, competitor.
						</DialogDescription>
					</DialogHeader>

					{importStatus === "done" ? (
						<div className="flex flex-col items-center gap-3 py-6">
							<div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
								<span className="text-2xl">✓</span>
							</div>
							<p className="font-semibold text-foreground">
								{importRows.length} keywords imported successfully!
							</p>
							<Button
								style={{ backgroundColor: "#D4A017", color: "#000" }}
								onClick={() => {
									setImportDialogOpen(false);
									setImportRows([]);
									setImportStatus("idle");
								}}
							>
								Done
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{/* Step 1 — pick location */}
							<div className="space-y-1.5">
								<Label>Branch (required)</Label>
								<Select
									value={importLocationId}
									onValueChange={setImportLocationId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select branch" />
									</SelectTrigger>
									<SelectContent>
										{(locations ?? []).map((loc) => (
											<SelectItem key={loc.id} value={String(loc.id)}>
												{loc.city}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Step 2 — file picker */}
							<div className="space-y-1.5">
								<Label>CSV File</Label>
								<input
									type="file"
									accept=".csv,text/csv"
									className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										const reader = new FileReader();
										reader.onload = (ev) => {
											const text = ev.target?.result as string;
											setImportRows(parseKeywordCSV(text));
										};
										reader.readAsText(file);
									}}
								/>
								<p className="text-xs text-gray-400">
									Expected format: keyword, category, targetPosition (one per
									line)
								</p>
							</div>

							{/* Preview table */}
							{importRows.length > 0 && (
								<div className="rounded-lg border border-gray-200 overflow-hidden">
									<div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
										Preview — {importRows.length} keyword
										{importRows.length !== 1 ? "s" : ""} found
									</div>
									<div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
										{importRows.slice(0, 20).map((row, i) => (
											<div
												key={i}
												className="flex items-center gap-3 px-3 py-2 text-sm"
											>
												<span className="flex-1 text-gray-100 truncate">
													{row.term}
												</span>
												<span className="text-xs text-gray-400 shrink-0">
													{row.category}
												</span>
												<span className="text-xs text-gray-400 shrink-0">
													top {row.targetPosition}
												</span>
											</div>
										))}
										{importRows.length > 20 && (
											<div className="px-3 py-2 text-xs text-gray-400 text-center">
												+{importRows.length - 20} more…
											</div>
										)}
									</div>
								</div>
							)}

							{/* Progress bar while importing */}
							{importStatus === "importing" && (
								<div className="space-y-1">
									<div className="flex justify-between text-xs text-gray-400">
										<span>Importing…</span>
										<span>
											{importProgress} / {importRows.length}
										</span>
									</div>
									<div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
										<div
											className="h-full rounded-full transition-all"
											style={{
												width: `${(importProgress / importRows.length) * 100}%`,
												backgroundColor: "#D4A017",
											}}
										/>
									</div>
								</div>
							)}

							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setImportDialogOpen(false);
										setImportRows([]);
										setImportStatus("idle");
									}}
								>
									Cancel
								</Button>
								<Button
									disabled={
										!importLocationId ||
										importRows.length === 0 ||
										importStatus === "importing"
									}
									style={{ backgroundColor: "#D4A017", color: "#000" }}
									onClick={async () => {
										setImportStatus("importing");
										setImportProgress(0);
										const locId = parseInt(importLocationId, 10);
										for (let i = 0; i < importRows.length; i++) {
											const row = importRows[i];
											await new Promise<void>((resolve) => {
												createKeyword(
													{
														term: row.term,
														locationId: locId,
														category: row.category as
															| "local"
															| "branded"
															| "category"
															| "competitor",
														targetPosition: row.targetPosition,
													},
													{
														onSuccess: () => {
															setImportProgress(i + 1);
															resolve();
														},
														onError: () => {
															setImportProgress(i + 1);
															resolve();
														},
													},
												);
											});
										}
										setImportStatus("done");
									}}
								>
									Import{importRows.length > 0 ? ` ${importRows.length} ` : " "}
									Keywords
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* ── Edit Keyword Dialog ────────────────────────────────────────────── */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle style={{ fontFamily: "Fraunces, serif" }}>
							Edit Keyword
						</DialogTitle>
						<DialogDescription>
							Updating a keyword resets its ranking history.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label>Keyword Term</Label>
							<Input
								value={editTerm}
								onChange={(e) => setEditTerm(e.target.value)}
								placeholder="e.g. supermarket near me nairobi"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Target Position</Label>
							<Input
								type="number"
								min={1}
								max={20}
								value={editTarget}
								onChange={(e) =>
									setEditTarget(parseInt(e.target.value, 10) || 3)
								}
							/>
							<p className="text-xs text-gray-400">
								Aim to rank in the top N results
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={!editTerm.trim() || creating}
							style={{ backgroundColor: "#D4A017", color: "#000" }}
							onClick={() => {
								if (!editingKw) return;
								const locId =
									keywordsRaw?.find((k) => k.id === editingKw.id)?.locationId ??
									0;
								deleteKeyword({ id: editingKw.id });
								setTimeout(() => {
									createKeyword({
										term: editTerm.trim(),
										locationId: locId,
										category: editingKw.category as
											| "local"
											| "branded"
											| "category"
											| "competitor",
										targetPosition: editTarget,
									});
								}, 300);
								setEditDialogOpen(false);
							}}
						>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
