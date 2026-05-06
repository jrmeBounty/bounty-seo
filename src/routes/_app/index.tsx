import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link2, RefreshCw, Search, Star, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";
import { Skeleton } from "#/components/ui/skeleton";
import { useTRPC } from "#/integrations/trpc/react";

// ─── Local types (mirrors tRPC return shapes) ───────────────────────────────
// Explicit types are required because the #/db module alias resolves to
// src/db.ts (which doesn't export 'db') rather than src/db/index.ts,
// causing TypeScript to lose type information for all SEO procedures.

type DashboardStats = {
  locationCount: number;
  keywordCount: number;
  reviews: { total: number; avgRating: number };
  ratingDistribution: Array<{ rating: number; count: number }>;
  citations: { avgScore: number; issues: number };
  avgPosition: number | null;
  recentReviews: Array<{
    id: number;
    reviewerName: string | null;
    rating: number;
    text: string | null;
    reviewDate: string;
    source: string | null;
    sentiment: string | null;
    locationCity: string | null;
  }>;
  keywordChanges: Array<{
    keywordId: number | null;
    term: string;
    locationCity: string;
    current: number | null;
    previous: number | null;
    change: number | null;
  }>;
};

type TrendResult = {
  keywords: Array<{ id: number; term: string; label: string }>;
  data: Array<Record<string, string | number | null>>;
};

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#D4A017", "#3B82F6", "#22C55E", "#F97316", "#8B5CF6"];

// ─── Helper components ────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < rating
              ? "fill-[#D4A017] text-[#D4A017]"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "positive" | "neutral" | "negative";
}) {
  const cfg = {
    positive: "bg-green-100 text-green-700 border-green-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
    negative: "bg-red-100 text-red-700 border-red-200",
  } as const;
  const labels = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
  } as const;
  return <Badge className={cfg[sentiment]}>{labels[sentiment]}</Badge>;
}

function getPositionColor(pos: number): string {
  if (pos === 1) return "#22C55E";
  if (pos <= 3) return "#D4A017";
  if (pos <= 5) return "#F97316";
  return "#EF4444";
}

// ─── Page component ───────────────────────────────────────────────────────────

function DashboardPage() {
  const trpc = useTRPC();

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.seo.dashboard.stats.queryOptions(),
  );

  const [trendDays, setTrendDays] = useState(30);

  const { data: trendData } = useQuery(
    trpc.seo.rankings.trend.queryOptions({ days: trendDays, limit: 3 }),
  );

  // ── SEO Health Score computation ────────────────────────────────────────
  const posScore =
    stats?.avgPosition != null
      ? Math.max(0, Math.round(100 - (stats.avgPosition - 1) * (100 / 19)))
      : 0;
  const revScore =
    stats != null ? Math.round(((stats.reviews.avgRating - 1) / 4) * 100) : 0;
  const citScore = stats?.citations.avgScore ?? 0;
  const healthScore = Math.round(
    posScore * 0.4 + revScore * 0.35 + citScore * 0.25,
  );
  const scoreColor =
    healthScore >= 80
      ? "#22C55E"
      : healthScore >= 60
        ? "#D4A017"
        : healthScore >= 40
          ? "#F97316"
          : "#EF4444";
  const healthLabel =
    healthScore >= 80
      ? "Excellent"
      : healthScore >= 60
        ? "Good"
        : healthScore >= 40
          ? "Needs Work"
          : "Critical";

  const ratingChartData = [5, 4, 3, 2, 1].map((star) => ({
    stars: `${star}★`,
    count: stats?.ratingDistribution.find((r) => r.rating === star)?.count ?? 0,
  }));

  // ── Full-page loading skeleton ─────────────────────────────────────────────
  if (statsLoading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="mb-3 h-4 w-32" />
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-5 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart placeholders */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Section 1: Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SEO Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Bounty Supermarket — Great Savings Everyday
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last updated: Today at 09:15 AM
          </p>
        </div>
        <Button
          className="shrink-0 font-semibold text-black hover:opacity-90"
          style={{ backgroundColor: "var(--bounty-gold)" }}
        >
          <RefreshCw size={14} />
          Sync Now
        </Button>
      </div>

      {/* ── Section 2: KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1 — Avg. Maps Position */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Maps Position
                </p>
                <div className="mt-2 text-3xl font-bold text-foreground">
                  {stats?.avgPosition != null
                    ? stats.avgPosition.toFixed(1)
                    : "—"}
                </div>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                  ↑ 0.7 vs last month
                </Badge>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Google Maps ranking
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp size={18} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Total Reviews */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Reviews
                </p>
                <div className="mt-2 text-3xl font-bold text-foreground">
                  {stats?.reviews.total ?? 0}
                </div>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                  +18 this week
                </Badge>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  All locations combined
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <Star size={18} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Citation Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Citation Score
                </p>
                <div className="mt-2 text-3xl font-bold text-foreground">
                  {stats?.citations.avgScore ?? 0}%
                </div>
                <Badge className="mt-2 bg-amber-100 text-amber-700 border-amber-200">
                  {stats?.citations.issues ?? 0} issues found
                </Badge>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  NAP consistency
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Link2 size={18} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 — Active Keywords */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Keywords
                </p>
                <div className="mt-2 text-3xl font-bold text-foreground">
                  {stats?.keywordCount ?? 0}
                </div>
                <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                  {stats?.locationCount ?? 0} locations
                </Badge>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Tracked positions
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Search size={18} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section: SEO Health Score ─────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Score gauge — left */}
            <div className="flex flex-col items-center gap-2 sm:w-48 shrink-0">
              <div
                className="text-6xl font-black tabular-nums"
                style={{ color: scoreColor }}
              >
                {healthScore}
              </div>
              <p className="text-sm font-semibold text-gray-500">
                SEO Health Score
              </p>
              <Progress value={healthScore} className="w-full h-2" />
              <Badge
                style={{
                  backgroundColor: scoreColor + "25",
                  color: scoreColor,
                  border: "none",
                }}
              >
                {healthLabel}
              </Badge>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-gray-100" />

            {/* Contributors — right */}
            <div className="flex-1 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Score Breakdown
              </p>

              {/* Rankings contributor */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                  <TrendingUp size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Rankings
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: scoreColor }}
                    >
                      {posScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${posScore}%`,
                        backgroundColor: scoreColor,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    40% weight · avg position #
                    {stats?.avgPosition?.toFixed(1) ?? "—"}
                  </p>
                </div>
              </div>

              {/* Reviews contributor */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                  <Star size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Reviews
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: scoreColor }}
                    >
                      {revScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${revScore}%`,
                        backgroundColor: scoreColor,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    35% weight · {stats?.reviews.avgRating?.toFixed(1) ?? "—"}★
                    avg rating
                  </p>
                </div>
              </div>

              {/* Citations contributor */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                  <Link2 size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Citations
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: scoreColor }}
                    >
                      {citScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${citScore}%`,
                        backgroundColor: scoreColor,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    25% weight · {stats?.citations.issues ?? 0} NAP issues
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Charts row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left — Rankings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Google Maps Position Trend
            </CardTitle>
            <CardDescription>
              Top keywords — lower position is better
            </CardDescription>
            <div className="flex gap-1.5 mt-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTrendDays(d)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={
                    trendDays === d
                      ? { backgroundColor: "#D4A017", color: "#000" }
                      : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                  }
                >
                  {d}d
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData?.data ?? []}
                  margin={{ top: 4, right: 16, bottom: 0, left: -16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[1, 10]}
                    reversed={true}
                    tick={{ fontSize: 11 }}
                    tickCount={6}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {(trendData?.keywords ?? []).map((kw, i) => (
                    <Line
                      key={kw.id}
                      type="monotone"
                      dataKey={kw.label}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right — Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Rating Breakdown</CardTitle>
            <CardDescription>All locations — all time</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary stats */}
            <div className="mb-3 flex items-center gap-6">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {stats?.reviews.total ?? 0}
                </span>
                <span className="ml-1.5 text-sm text-muted-foreground">
                  total reviews
                </span>
              </div>
              <div>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--bounty-gold)" }}
                >
                  {stats?.reviews.avgRating != null
                    ? `${stats.reviews.avgRating.toFixed(1)}★`
                    : "—"}
                </span>
                <span className="ml-1.5 text-sm text-muted-foreground">
                  average rating
                </span>
              </div>
            </div>

            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingChartData}
                  margin={{ top: 16, right: 16, bottom: 0, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#D4A017"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={64}
                  >
                    <LabelList
                      dataKey="count"
                      position="top"
                      style={{ fontSize: "11px", fill: "#6B7280" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Bottom row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left — Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reviews</CardTitle>
            <CardDescription>Latest customer feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats?.recentReviews ?? []).map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar size="default">
                  <AvatarFallback
                    className="text-xs font-bold text-black"
                    style={{
                      backgroundColor: "var(--bounty-gold-muted)",
                      color: "var(--bounty-gold)",
                    }}
                  >
                    {(review.reviewerName ?? "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold leading-none">
                      {review.reviewerName ?? "Anonymous"}
                    </span>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-1.5 py-0 text-[10px]">
                      {review.locationCity}
                    </Badge>
                    <StarRating rating={review.rating} />
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {review.text != null && review.text.length > 80
                      ? `${review.text.slice(0, 80)}…`
                      : (review.text ?? "")}
                  </p>
                  <div className="mt-1.5">
                    <SentimentBadge
                      sentiment={
                        (review.sentiment ?? "neutral") as
                          | "positive"
                          | "neutral"
                          | "negative"
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right — Keyword Position Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Position Changes (7 days)
            </CardTitle>
            <CardDescription>Movement in Google Maps rankings</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Keyword</span>
              <span>Location</span>
              <span className="text-center">Change</span>
              <span className="text-center">Pos.</span>
            </div>

            <div className="space-y-1">
              {(stats?.keywordChanges ?? []).map((item) => (
                <div
                  key={`${item.term}-${item.locationCity}`}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/40"
                >
                  <span className="truncate text-xs font-medium text-foreground">
                    {item.term}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.locationCity}
                  </span>
                  <div className="flex justify-center">
                    {item.change != null && item.change > 0 ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
                        ↑ +{item.change}
                      </Badge>
                    ) : item.change != null && item.change < 0 ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">
                        ↓ {item.change}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[11px]">
                        —
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: getPositionColor(item.current ?? 99),
                      }}
                    >
                      #{item.current ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
