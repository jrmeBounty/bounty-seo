import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── better-auth tables ─────────────────────────────────────────────────────
// These are required by better-auth for session persistence.
// After adding these, run: bun run db:push

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  role: text().notNull().default("viewer"), // "admin" | "staff" | "viewer"
  image: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── App-level settings (persisted) ────────────────────────────────────────

/**
 * Single-row table holding global app configuration.
 * Upserted via settings page. id is always 1.
 */
export const seoSettings = pgTable("seo_settings", {
  id: serial().primaryKey(),
  businessName: text("business_name").notNull().default("Bounty Supermarket"),
  tagline: text().notNull().default("Great Savings Everyday"),
  primaryWebsite: text("primary_website").default(
    "https://bountysupermarket.co.ke",
  ),
  primaryPhone: text("primary_phone").default("+254 20 222 1234"),
  country: text().notNull().default("Kenya"),
  timezone: text().notNull().default("EAT"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Legacy demo table (preserved) ──────────────────────────────────────────

export const todos = pgTable("todos", {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SEO Tracker: Bounty Supermarket Locations ───────────────────────────────

/**
 * Represents individual Bounty Supermarket branches.
 * Each location has its own keyword set, reviews, and citations.
 */
export const seoLocations = pgTable("seo_locations", {
  id: serial().primaryKey(),
  name: text().notNull(), // e.g. "Bounty Supermarket - Chaguanas"
  address: text().notNull(),
  city: text().notNull(),
  country: text().notNull().default("Kenya"),
  phone: text(),
  website: text(),
  /** Google Maps Place ID — used for Places API calls */
  googlePlaceId: text("google_place_id"),
  /** Google Maps Customer ID (CID) — used for tracking */
  googleCid: text("google_cid"),
  lat: real(),
  lng: real(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── SEO Tracker: Keywords to Monitor ───────────────────────────────────────

/**
 * Search terms to track per location.
 * Categories: 'branded' (includes brand name), 'local' (geo-specific),
 * 'category' (product/service type), 'competitor' (rival brand terms).
 */
export const seoKeywords = pgTable("seo_keywords", {
  id: serial().primaryKey(),
  locationId: integer("location_id").references(() => seoLocations.id, {
    onDelete: "cascade",
  }),
  term: text().notNull(), // e.g. "supermarket near me"
  category: text().default("local"), // branded | local | category | competitor
  targetPosition: integer("target_position").default(3), // goal: be in top N
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SEO Tracker: Ranking Snapshots ─────────────────────────────────────────

/**
 * Point-in-time capture of a keyword's Google Maps / Search position.
 * null position = business not found in top results for that snapshot.
 */
export const seoRankingSnapshots = pgTable("seo_ranking_snapshots", {
  id: serial().primaryKey(),
  keywordId: integer("keyword_id").references(() => seoKeywords.id, {
    onDelete: "cascade",
  }),
  locationId: integer("location_id").references(() => seoLocations.id, {
    onDelete: "cascade",
  }),
  /** null = not in visible results */
  position: integer(),
  totalResultsCount: integer("total_results_count"),
  snapshotDate: date("snapshot_date").notNull(),
  /** Source of the ranking data */
  source: text().default("google_maps"), // google_maps | google_search
  metadata: jsonb(), // raw API response snippet, viewport coords, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SEO Tracker: Customer Reviews ──────────────────────────────────────────

/**
 * Customer reviews ingested from Google Business Profile, Facebook, etc.
 * Sentiment is derived via keyword analysis or AI tagging (Step 4).
 */
export const seoReviews = pgTable("seo_reviews", {
  id: serial().primaryKey(),
  locationId: integer("location_id").references(() => seoLocations.id, {
    onDelete: "cascade",
  }),
  reviewerName: text("reviewer_name"),
  reviewerAvatar: text("reviewer_avatar"),
  rating: integer().notNull(), // 1–5
  text: text(),
  /** Drafted or posted reply from Bounty staff */
  reply: text(),
  repliedAt: timestamp("replied_at"),
  reviewDate: timestamp("review_date").notNull(),
  source: text().default("google"), // google | facebook | tripadvisor
  sourceId: text("source_id"), // external platform review ID
  /** positive | neutral | negative */
  sentiment: text(),
  isResolved: boolean("is_resolved").default(false),
  tags: jsonb(), // string[] — auto-tagged topics
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SEO Tracker: Citations ──────────────────────────────────────────────────

/**
 * Business directory listings (NAP = Name, Address, Phone).
 * napScore 0–100 reflects how consistent the listing is with the canonical NAP.
 */
export const seoCitations = pgTable("seo_citations", {
  id: serial().primaryKey(),
  locationId: integer("location_id").references(() => seoLocations.id, {
    onDelete: "cascade",
  }),
  directoryName: text("directory_name").notNull(), // e.g. "Yellow Pages TT"
  directoryUrl: text("directory_url"), // homepage of the directory
  listingUrl: text("listing_url"), // direct URL to the Bounty listing
  /** What the directory shows — compared against the canonical NAP */
  listedName: text("listed_name"),
  listedAddress: text("listed_address"),
  listedPhone: text("listed_phone"),
  listedWebsite: text("listed_website"),
  /** Field-level match flags */
  nameMatch: boolean("name_match"),
  addressMatch: boolean("address_match"),
  phoneMatch: boolean("phone_match"),
  websiteMatch: boolean("website_match"),
  /** 0–100 composite consistency score */
  napScore: integer("nap_score"),
  /** active | inactive | unchecked | missing | incorrect */
  status: text().default("unchecked"),
  lastChecked: timestamp("last_checked"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
