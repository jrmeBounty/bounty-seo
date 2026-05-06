import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
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

export const Route = createFileRoute("/_app/rankings/$keywordId")({
  component: KeywordDrilldownPage,
});

const CATEGORY_COLORS: Record<string, string> = {
  branded: "bg-purple-100 text-purple-700 border-purple-200",
  local: "bg-blue-100 text-blue-700 border-blue-200",
  category: "bg-amber-100 text-amber-700 border-amber-200",
  competitor: "bg-red-100 text-red-700 border-red-200",
};

function positionColor(pos: number | null): string {
  if (pos === null) return "#9CA3AF";
  if (pos <= 3) return "#22C55E";
  if (pos <= 5) return "#D4A017";
  if (pos <= 7) return "#F97316";
  return "#EF4444";
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon?: React.ReactNode;
}) {
  const color = positionColor(value);
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end gap-2">
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: value !== null ? color : "#9CA3AF" }}
        >
          {value !== null ? `#${value}` : "—"}
        </span>
        {icon && <span className="mb-1 text-gray-400">{icon}</span>}
      </CardContent>
    </Card>
  );
}

function KeywordDrilldownPage() {
  const { keywordId } = Route.useParams();
  const kwId = parseInt(keywordId, 10);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch all keywords to find this one
  const { data: allKeywords, isLoading: kwLoading } = useQuery(
    trpc.seo.keywords.list.queryOptions(),
  );
  const keyword = (allKeywords ?? []).find((k) => k.id === kwId);

  // Fetch snapshots
  const { data: snapshots, isLoading: snapsLoading } = useQuery(
    trpc.seo.rankings.snapshots.queryOptions({ keywordId: kwId, days: 90 }),
  );

  // Check Now mutation
  const { mutate: checkNow, isPending: checking } = useMutation({
    ...trpc.seo.rankings.checkNow.mutationOptions(),
    onSuccess: (data) => {
      setCheckMsg(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.seo.rankings.snapshots.queryKey({
          keywordId: kwId,
          days: 90,
        }),
      });
    },
  });

  const isLoading = kwLoading || snapsLoading;

  // Derive stats from snapshots
  const validSnaps = (snapshots ?? []).filter((s) => s.position !== null);
  const positions = validSnaps.map((s) => s.position as number);
  const currentPos =
    snapshots && snapshots.length > 0
      ? (snapshots[snapshots.length - 1]?.position ?? null)
      : null;
  const bestPos = positions.length > 0 ? Math.min(...positions) : null;
  const worstPos = positions.length > 0 ? Math.max(...positions) : null;
  const avgPos =
    positions.length > 0
      ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
      : null;

  // Chart data
  const chartData = (snapshots ?? []).map((s) => ({
    date: s.snapshotDate,
    position: s.position,
  }));

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!keyword) {
    return (
      <div className="p-8 text-center text-gray-500">
        Keyword not found.{" "}
        <Link to="/rankings" className="text-[#D4A017] underline">
          Back to Rankings
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bounty-content-bg)" }}
    >
      <div className="max-w-screen-lg mx-auto px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          to="/rankings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Rankings
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              {keyword.term}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`${CATEGORY_COLORS[keyword.category ?? "local"]} text-xs px-2 py-0`}
              >
                {keyword.category ?? "local"}
              </Badge>
              <Badge
                className="text-xs px-2 py-0"
                style={{
                  backgroundColor: "rgba(212,160,23,0.15)",
                  color: "#92610a",
                  border: "1px solid rgba(212,160,23,0.35)",
                }}
              >
                {keyword.locationCity}
              </Badge>
              <span className="text-xs text-gray-400">
                Target: top {keyword.targetPosition}
              </span>
            </div>
          </div>
          <Button
            onClick={() =>
              keyword.locationId &&
              checkNow({ keywordId: kwId, locationId: keyword.locationId })
            }
            disabled={checking || !keyword.locationId}
            style={{ backgroundColor: "#D4A017", color: "#000" }}
            className="gap-2 shrink-0"
          >
            {checking ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Check Now
          </Button>
        </div>

        {/* Check Now message */}
        {checkMsg && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {checkMsg}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Current Position"
            value={currentPos}
            icon={
              currentPos !== null && avgPos !== null ? (
                currentPos < avgPos ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : currentPos > avgPos ? (
                  <TrendingDown size={16} className="text-red-500" />
                ) : (
                  <Minus size={16} />
                )
              ) : undefined
            }
          />
          <KpiCard label="Best Position" value={bestPos} />
          <KpiCard label="Worst Position" value={worstPos} />
          <KpiCard label="Avg Position" value={avgPos} />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Position History (90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
                No snapshot data yet. Click "Check Now" to record a position.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      try {
                        return format(new Date(v), "MMM d");
                      } catch {
                        return v;
                      }
                    }}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    reversed
                    domain={[1, 20]}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `#${v}`}
                    width={35}
                  />
                  <Tooltip
                    formatter={(v) =>
                      v !== null ? [`#${v}`, "Position"] : ["N/A", "Position"]
                    }
                    labelFormatter={(label) => {
                      try {
                        return format(new Date(label), "MMM d, yyyy");
                      } catch {
                        return label;
                      }
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                    }}
                  />
                  {keyword.targetPosition && (
                    <ReferenceLine
                      y={keyword.targetPosition}
                      stroke="#D4A017"
                      strokeDasharray="4 4"
                      label={{
                        value: `Target #${keyword.targetPosition}`,
                        position: "insideTopRight",
                        fontSize: 10,
                        fill: "#D4A017",
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="#D4A017"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    activeDot={{ r: 4, fill: "#D4A017" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Snapshot history table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Snapshot History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(snapshots ?? []).length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No snapshots recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
                        Position
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
                        Source
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(snapshots ?? [])]
                      .reverse()
                      .map((snap) => (
                        <TableRow
                          key={snap.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell className="py-3 px-4 text-sm text-gray-700">
                            {snap.snapshotDate
                              ? (() => {
                                  try {
                                    return format(
                                      new Date(snap.snapshotDate),
                                      "MMM d, yyyy",
                                    );
                                  } catch {
                                    return snap.snapshotDate;
                                  }
                                })()
                              : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {snap.position !== null ? (
                              <span
                                className="font-bold tabular-nums"
                                style={{
                                  color: positionColor(snap.position),
                                }}
                              >
                                #{snap.position}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Not ranked
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor:
                                  snap.source === "google_search"
                                    ? "#EDE9FE"
                                    : "#DBEAFE",
                                color:
                                  snap.source === "google_search"
                                    ? "#7C3AED"
                                    : "#1D4ED8",
                                border: "none",
                              }}
                            >
                              {snap.source === "google_search"
                                ? "Google Search"
                                : "Google Maps"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
