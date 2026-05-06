import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  BarChart2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "#/components/ui/skeleton";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_app/locations")({
  component: LocationsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationData {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  googlePlaceId: string;
  isActive: boolean;
  stats: {
    keywords: number;
    reviews: number;
    avgPosition: number;
    citationScore: number;
  };
}

// ─── Location Card ────────────────────────────────────────────────────────────

function LocationCard({ loc }: { loc: LocationData }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Card top bar accent */}
        <div className="h-1 w-full" style={{ backgroundColor: "#D4A017" }} />

        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3
                className="font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                {loc.name}
              </h3>
              <Badge
                className="text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(212,160,23,0.15)",
                  color: "#92610a",
                  border: "1px solid rgba(212,160,23,0.35)",
                }}
              >
                {loc.city}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-green-700 font-medium">Active</span>
            </div>
          </div>

          {/* Address & Phone */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <span>{loc.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="shrink-0 text-gray-400" />
              <span>{loc.phone}</span>
            </div>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
              <BarChart2 size={13} className="text-gray-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">
                {loc.stats.keywords}
              </span>
              <span className="text-[10px] text-gray-400">Keywords</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
              <MessageSquare size={13} className="text-gray-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">
                {loc.stats.reviews}
              </span>
              <span className="text-[10px] text-gray-400">Reviews</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
              <Star size={13} className="text-gray-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">
                #{loc.stats.avgPosition}
              </span>
              <span className="text-[10px] text-gray-400">Pos avg</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
              <span className="text-xs font-black" style={{ color: "#D4A017" }}>
                NAP
              </span>
              <span className="text-sm font-bold text-gray-800">
                {loc.stats.citationScore}%
              </span>
              <span className="text-[10px] text-gray-400">Citations</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <a href="/rankings" className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8"
              >
                <BarChart2 size={13} />
                View Rankings
              </Button>
            </a>
            <a href="/reviews" className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8"
              >
                <MessageSquare size={13} />
                View Reviews
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              aria-label="Settings"
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add Location Dialog Form ─────────────────────────────────────────────────

function AddLocationDialog({
  open,
  onOpenChange,
  onCreateLocation,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreateLocation: (data: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    googlePlaceId?: string;
  }) => void;
  isCreating: boolean;
}) {
  const form = useForm({
    defaultValues: {
      branchName: "",
      fullAddress: "",
      city: "",
      phone: "",
      googlePlaceId: "",
    },
    onSubmit: async ({ value }) => {
      onCreateLocation({
        name: value.branchName,
        address: value.fullAddress,
        city: value.city,
        phone: value.phone || undefined,
        googlePlaceId: value.googlePlaceId || undefined,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Fraunces, serif" }}>
            Add New Location
          </DialogTitle>
          <DialogDescription>
            Add a new Bounty Supermarket branch to track rankings, reviews, and
            citations.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Branch Name */}
          <form.Field name="branchName">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Branch Name</Label>
                <Input
                  id={field.name}
                  placeholder="e.g. Bounty Supermarket — Nairobi CBD"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {(field.state.meta.errors as unknown[]).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {String(err)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Full Address */}
          <form.Field name="fullAddress">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Full Address</Label>
                <Input
                  id={field.name}
                  placeholder="e.g. 23 Tom Mboya Street, Nairobi CBD"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {(field.state.meta.errors as unknown[]).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {String(err)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* City */}
          <form.Field name="city">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>City</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nairobi">Nairobi</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Kisumu">Kisumu</SelectItem>
                    <SelectItem value="Nakuru">Nakuru</SelectItem>
                    <SelectItem value="Eldoret">Eldoret</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {(field.state.meta.errors as unknown[]).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {String(err)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Phone */}
          <form.Field name="phone">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Phone</Label>
                <Input
                  id={field.name}
                  type="tel"
                  pattern="[+][0-9 ()\\-]+"
                  placeholder="+254 7XX XXX XXX"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {(field.state.meta.errors as unknown[]).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {String(err)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Google Place ID */}
          <form.Field name="googlePlaceId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>
                  Google Place ID{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id={field.name}
                  placeholder="ChIJ..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-gray-400">Find in Google Maps URL</p>
                {(field.state.meta.errors as unknown[]).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {String(err)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              style={{ backgroundColor: "#D4A017", color: "#000" }}
            >
              {isCreating ? "Adding…" : "Add Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Location Compare ───────────────────────────────────────────────────────

function LocationCompare({ locations }: { locations: unknown[] }) {
  type LocStat = {
    id: number;
    name: string;
    city: string;
    stats: {
      keywords: number;
      reviews: number;
      avgPosition: number;
      citationScore: number;
      avgRating?: number;
    };
  };
  const locs = locations as LocStat[];

  if (locs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No locations to compare.
      </div>
    );
  }

  const shortName = (name: string) =>
    name
      .replace("Bounty Supermarket — ", "")
      .replace("Bounty Supermarket - ", "");

  const BRANCH_COLORS = ["#D4A017", "#3B82F6", "#22C55E", "#F97316"];

  const posData = locs.map((l, i) => ({
    branch: shortName(l.name),
    value: l.stats.avgPosition ?? 0,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  const reviewData = locs.map((l, i) => ({
    branch: shortName(l.name),
    value: l.stats.reviews ?? 0,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  const citationData = locs.map((l, i) => ({
    branch: shortName(l.name),
    value: l.stats.citationScore ?? 0,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  const kwData = locs.map((l, i) => ({
    branch: shortName(l.name),
    value: l.stats.keywords ?? 0,
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  const ChartCard = ({
    title,
    subtitle,
    data,
    unit = "",
    reversed = false,
  }: {
    title: string;
    subtitle: string;
    data: { branch: string; value: number; color: string }[];
    unit?: string;
    reversed?: boolean;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="branch"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              reversed={reversed}
              width={28}
              tickFormatter={(v) => `${v}${unit}`}
            />
            <Tooltip
              formatter={(v) => [`${v}${unit}`, title]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {locs.map((l, i) => (
          <div
            key={l.id}
            className="flex items-center gap-1.5 text-sm text-gray-600"
          >
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{
                backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
              }}
            />
            {shortName(l.name)}
          </div>
        ))}
      </div>

      {/* 2x2 chart grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard
          title="Avg. Google Maps Position"
          subtitle="Lower is better — target #1–3"
          data={posData}
          reversed={true}
          unit=""
        />
        <ChartCard
          title="Total Reviews"
          subtitle="Reviews collected across all time"
          data={reviewData}
        />
        <ChartCard
          title="Citation NAP Score"
          subtitle="Directory consistency (higher = better)"
          data={citationData}
          unit="%"
        />
        <ChartCard
          title="Active Keywords"
          subtitle="Number of tracked search terms"
          data={kwData}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LocationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locLoading } = useQuery(
    trpc.seo.locations.withStats.queryOptions(),
  );

  const { mutate: createLocation, isPending: creating } = useMutation({
    ...trpc.seo.locations.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.seo.locations.withStats.queryKey(),
      });
      setDialogOpen(false);
    },
  });

  if (locLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
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
              Location Manager
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {(locations ?? []).length} active branches across Kenya
            </p>
          </div>
          <DialogTrigger asChild>
            <Button
              className="gap-2 self-start sm:self-auto"
              style={{ backgroundColor: "#D4A017", color: "#000" }}
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={16} />
              Add Location
            </Button>
          </DialogTrigger>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compare">Compare Branches</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(locations ?? []).map((loc) => (
                <LocationCard
                  key={loc.id}
                  loc={loc as unknown as LocationData}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            <LocationCompare locations={locations ?? []} />
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <AddLocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreateLocation={(data) => createLocation(data)}
          isCreating={creating}
        />
      </div>
    </div>
  );
}
