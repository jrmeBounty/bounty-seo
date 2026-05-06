import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useTRPC } from "#/integrations/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Skeleton } from "#/components/ui/skeleton";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

// ─── Tab 1: General ───────────────────────────────────────────────────────────

function GeneralTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery(
    trpc.seo.settings.get.queryOptions(),
  );

  const { mutate: upsertSettings, isPending: saving } = useMutation({
    ...trpc.seo.settings.upsert.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.seo.settings.get.queryKey(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const form = useForm({
    defaultValues: {
      businessName: "Bounty Supermarket",
      tagline: "Great Savings Everyday",
      primaryWebsite: "https://bountysupermarket.co.ke",
      primaryPhone: "+254 20 222 1234",
      country: "Kenya",
      timezone: "EAT",
    },
    onSubmit: async ({ value }) => {
      upsertSettings(value);
    },
  });

  // Sync form defaults when settings load from DB
  useEffect(() => {
    if (settings) {
      form.setFieldValue("businessName", settings.businessName ?? "Bounty Supermarket");
      form.setFieldValue("tagline", settings.tagline ?? "Great Savings Everyday");
      form.setFieldValue("primaryWebsite", settings.primaryWebsite ?? "https://bountysupermarket.co.ke");
      form.setFieldValue("primaryPhone", settings.primaryPhone ?? "+254 20 222 1234");
      form.setFieldValue("country", settings.country ?? "Kenya");
      form.setFieldValue("timezone", settings.timezone ?? "EAT");
    }
  }, [settings]);

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Information</CardTitle>
          <CardDescription>
            Core details used across all tracking and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Name */}
              <form.Field name="businessName">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Business Name</Label>
                    <Input
                      id={field.name}
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

              {/* Tagline */}
              <form.Field name="tagline">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Tagline</Label>
                    <Input
                      id={field.name}
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

              {/* Primary Website */}
              <form.Field name="primaryWebsite">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Primary Website</Label>
                    <Input
                      id={field.name}
                      type="url"
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

              {/* Primary Phone */}
              <form.Field name="primaryPhone">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Primary Phone</Label>
                    <Input
                      id={field.name}
                      type="tel"
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

              {/* Country (read-only) */}
              <form.Field name="country">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Country</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      disabled
                      className="bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                )}
              </form.Field>

              {/* Timezone */}
              <form.Field name="timezone">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Time Zone</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EAT">
                          East Africa Time (UTC+3)
                        </SelectItem>
                        <SelectItem value="CAT">
                          Central Africa Time (UTC+2)
                        </SelectItem>
                        <SelectItem value="SAST">
                          South Africa Standard Time (UTC+2)
                        </SelectItem>
                        <SelectItem value="WAT">
                          West Africa Time (UTC+1)
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium animate-in fade-in">
                  <Check size={14} />
                  Saved successfully
                </span>
              )}
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: "#D4A017", color: "#000" }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Saving…
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Brand Colors (info only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Colors</CardTitle>
          <CardDescription>
            Brand palette used throughout the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: "#0A0A0A" }}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Bounty Black
                </p>
                <p className="text-xs text-gray-400">#0A0A0A</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: "#D4A017" }}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Bounty Gold
                </p>
                <p className="text-xs text-gray-400">#D4A017</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: API Keys ──────────────────────────────────────────────────────────

interface ApiKeyService {
  id: string;
  name: string;
  description: string;
  status: "configured" | "not-configured";
}

const API_SERVICES: ApiKeyService[] = [
  {
    id: "google-maps",
    name: "Google Maps API",
    description: "Used for Maps position tracking",
    status: "not-configured",
  },
  {
    id: "google-business",
    name: "Google Business Profile API",
    description: "Fetches reviews automatically",
    status: "not-configured",
  },
  {
    id: "sentry",
    name: "Sentry DSN",
    description: "Error monitoring and performance tracking",
    status: "configured",
  },
];

function ApiKeyRow({ service }: { service: ApiKeyService }) {
  const [show, setShow] = useState(false);

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">
                {service.name}
              </span>
              {service.status === "configured" ? (
                <Badge
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    border: "none",
                  }}
                >
                  Configured
                </Badge>
              ) : (
                <Badge
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    border: "none",
                  }}
                >
                  Not Configured
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative flex-1">
              <Input
                type={show ? "text" : "password"}
                placeholder={
                  service.status === "configured"
                    ? "••••••••••••••••"
                    : "Enter API key…"
                }
                className="pr-9 text-sm"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide key" : "Show key"}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-xs shrink-0"
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-4">
      {API_SERVICES.map((svc) => (
        <ApiKeyRow key={svc.id} service={svc} />
      ))}

      {/* Security callout */}
      <div
        className="flex items-start gap-3 rounded-xl border p-4 mt-2"
        style={{ backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }}
      >
        <Shield size={16} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          API keys are stored securely as environment variables and never
          exposed to the browser.
        </p>
      </div>
    </div>
  );
}

// ─── Tab 3: Notifications ─────────────────────────────────────────────────────

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "position-drop",
    label: "Position drop alerts",
    description:
      "Email alerts when a keyword position drops more than 2 places.",
    defaultOn: true,
  },
  {
    id: "low-star-reviews",
    label: "Low star review alerts",
    description: "Email alerts for new 1–2 star reviews across all branches.",
    defaultOn: true,
  },
  {
    id: "weekly-report",
    label: "Weekly SEO summary report",
    description:
      "Receive a weekly digest of ranking changes and review activity.",
    defaultOn: false,
  },
  {
    id: "citation-issues",
    label: "Citation issue alerts",
    description:
      "Notifications when NAP inconsistencies are detected in directory listings.",
    defaultOn: true,
  },
];

function NotificationsTab() {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_SETTINGS.map((s) => [s.id, s.defaultOn])),
  );

  return (
    <div className="space-y-3">
      {NOTIFICATION_SETTINGS.map((setting) => (
        <Card key={setting.id}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label
                  className="text-sm font-semibold text-gray-900 cursor-pointer"
                  htmlFor={setting.id}
                >
                  {setting.label}
                </Label>
                <p className="text-xs text-gray-500">{setting.description}</p>
              </div>
              <Switch
                id={setting.id}
                checked={values[setting.id]}
                onCheckedChange={(checked) =>
                  setValues((prev) => ({ ...prev, [setting.id]: checked }))
                }
                className="shrink-0 mt-0.5"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab 4: Data ──────────────────────────────────────────────────────────────

function DataTab() {
  const trpc = useTRPC();

  // Fetch data for exports
  const { data: rankingsData } = useQuery(
    trpc.seo.rankings.exportAll.queryOptions(),
  );
  const { data: reviewsData } = useQuery(
    trpc.seo.reviews.exportAll.queryOptions(),
  );
  const { data: citationsData } = useQuery(
    trpc.seo.citations.list.queryOptions(),
  );

  function downloadCSV(filename: string, rows: string[][], headers: string[]) {
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleExportRankings = () => {
    if (!rankingsData) return;
    downloadCSV(
      `bounty-rankings-${new Date().toISOString().split("T")[0]}.csv`,
      rankingsData.map((r) => [
        r.snapshotDate ?? "",
        r.locationCity ?? "",
        r.term ?? "",
        r.category ?? "",
        String(r.position ?? ""),
        r.source ?? "",
      ]),
      ["Date", "Location", "Keyword", "Category", "Position", "Source"],
    );
  };

  const handleExportReviews = () => {
    if (!reviewsData) return;
    downloadCSV(
      `bounty-reviews-${new Date().toISOString().split("T")[0]}.csv`,
      reviewsData.map((r) => [
        String(r.id),
        r.locationCity ?? "",
        r.reviewerName ?? "",
        String(r.rating),
        r.text ?? "",
        r.source ?? "",
        r.sentiment ?? "",
        r.reviewDate ? new Date(r.reviewDate).toISOString().split("T")[0] : "",
        r.isResolved ? "Yes" : "No",
        r.reply ?? "",
      ]),
      [
        "ID",
        "Location",
        "Reviewer",
        "Rating",
        "Text",
        "Source",
        "Sentiment",
        "Date",
        "Resolved",
        "Reply",
      ],
    );
  };

  const handleExportCitations = () => {
    if (!citationsData) return;
    downloadCSV(
      `bounty-citations-${new Date().toISOString().split("T")[0]}.csv`,
      citationsData.map((r) => [
        r.directoryName ?? "",
        r.locationCity ?? "",
        String(r.napScore ?? ""),
        r.status ?? "",
        r.nameMatch ? "Yes" : "No",
        r.addressMatch ? "Yes" : "No",
        r.phoneMatch ? "Yes" : "No",
        r.listingUrl ?? "",
      ]),
      [
        "Directory",
        "Location",
        "NAP Score",
        "Status",
        "Name Match",
        "Address Match",
        "Phone Match",
        "Listing URL",
      ],
    );
  };

  return (
    <div className="space-y-4">
      {/* Export Rankings */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-gray-900">
                Export Rankings Data
              </p>
              <p className="text-xs text-gray-500">
                Download all ranking snapshots as CSV.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleExportRankings}
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Reviews */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-gray-900">
                Export Reviews
              </p>
              <p className="text-xs text-gray-500">
                Download all reviews with sentiment tags as CSV.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleExportReviews}
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Citations */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-gray-900">
                Export Citations
              </p>
              <p className="text-xs text-gray-500">
                Download citation audit report as PDF.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleExportCitations}
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync All Data */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-gray-900">
                Sync All Data
              </p>
              <p className="text-xs text-gray-500">
                Manually trigger a full data refresh from all sources.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2 shrink-0"
              style={{ backgroundColor: "#D4A017", color: "#000" }}
            >
              <RefreshCw size={14} />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle size={15} />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs text-red-500">
            These actions are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-gray-800">
                Clear all cached data
              </p>
              <p className="text-xs text-gray-500">
                Removes all locally cached ranking snapshots and review data.
                Live data will be re-fetched on next sync.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 size={14} />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 5: Team ───────────────────────────────────────────────────────────

function TeamTab() {
  const trpc = useTRPC();
  const { data: users, isLoading } = useQuery(trpc.users.list.queryOptions());

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const userList = users ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
          <CardDescription>
            All accounts with access to the Bounty SEO Tracker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
              <Users size={32} className="text-gray-300" />
              <p className="text-sm">No team members yet.</p>
              <p className="text-xs">
                Sign in with Google or create an account via the login page.
              </p>
            </div>
          ) : (
            userList.map((u) => {
              const initials = (u.name ?? u.email)
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {u.image && (
                      <AvatarImage src={u.image} alt={u.name ?? ""} />
                    )}
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{
                        backgroundColor: "rgba(212,160,23,0.15)",
                        color: "#92610a",
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.name ?? "Unnamed User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      Joined{" "}
                      {u.createdAt
                        ? format(new Date(u.createdAt), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Info note */}
      <div
        className="rounded-xl border p-4 text-sm"
        style={{
          backgroundColor: "rgba(212,160,23,0.08)",
          borderColor: "rgba(212,160,23,0.3)",
        }}
      >
        <p className="font-semibold text-amber-900 mb-1">
          Role management coming soon
        </p>
        <p className="text-amber-700 text-xs">
          Currently all users have full access. Admin / Viewer role distinction
          will be added in a future update.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bounty-content-bg)" }}
    >
      <div className="max-w-screen-lg mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure your SEO tracker preferences and integrations
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="data">
            <DataTab />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
