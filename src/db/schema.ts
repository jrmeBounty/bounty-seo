import {
	boolean,
	date,
	index,
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
		"https://www.bountybasket.online",
	),
	primaryPhone: text("primary_phone").default("+254 20 222 1234"),
	country: text().notNull().default("Kenya"),
	timezone: text().notNull().default("EAT"),
	updatedAt: timestamp("updated_at").defaultNow(),
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
	/** Google Maps Place ID — used for Places API calls (UNIQUE to prevent duplicates) */
	googlePlaceId: text("google_place_id").unique(),
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
export const seoRankingSnapshots = pgTable(
	"seo_ranking_snapshots",
	{
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
	},
	(table) => [
		// Index for time-series queries (most common query pattern)
		index("idx_ranking_snapshots_keyword_date").on(
			table.keywordId,
			table.snapshotDate,
		),
		// Index for location-based queries
		index("idx_ranking_snapshots_location_date").on(
			table.locationId,
			table.snapshotDate,
		),
	],
);

// ─── SEO Tracker: Customer Reviews ──────────────────────────────────────────

/**
 * Customer reviews ingested from Google Business Profile, Facebook, etc.
 * Sentiment is derived via keyword analysis or AI tagging (Step 4).
 */
export const seoReviews = pgTable(
	"seo_reviews",
	{
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
	},
	(table) => [
		// Index for filtering by location and sorting by date
		index("idx_reviews_location_date").on(table.locationId, table.reviewDate),
		// Index for filtering by rating
		index("idx_reviews_rating").on(table.rating),
		// Index for unresolved reviews (common query)
		index("idx_reviews_unresolved").on(table.isResolved),
	],
);

// ─── SEO Tracker: Citations ──────────────────────────────────────────────────

/**
 * Business directory listings (NAP = Name, Address, Phone).
 * napScore 0–100 reflects how consistent the listing is with the canonical NAP.
 */
export const seoCitations = pgTable(
	"seo_citations",
	{
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
	},
	(table) => [
		// Index for location-based queries with status filtering
		index("idx_citations_location_status").on(table.locationId, table.status),
		// Index for active citations only
		index("idx_citations_active").on(table.isActive),
	],
);

// ─── Website SEO Optimization Tables ─────────────────────────────────────────
// For tracking bountybasket.online ecommerce site SEO health

export const seoPages = pgTable(
	"seo_pages",
	{
		id: serial("id").primaryKey(),
		url: text().notNull().unique(),
		pageType: text("page_type").notNull(), // "home" | "category" | "product" | "blog" | "other"
		title: text(),
		metaDescription: text("meta_description"),
		h1: text(),
		wordCount: integer("word_count"),
		/** Crawlability status */
		isIndexable: boolean("is_indexable").default(true),
		isInSitemap: boolean("is_in_sitemap").default(false),
		hasCanonical: boolean("has_canonical").default(false),
		canonicalUrl: text("canonical_url"),
		/** Performance metrics */
		loadTime: real("load_time"), // seconds
		mobileScore: integer("mobile_score"), // 0-100
		desktopScore: integer("desktop_score"), // 0-100
		/** SEO scores */
		seoScore: integer("seo_score"), // 0-100 composite
		contentScore: integer("content_score"), // 0-100
		technicalScore: integer("technical_score"), // 0-100
		lastCrawled: timestamp("last_crawled"),
		lastModified: timestamp("last_modified"),
		priority: real().default(0.5), // sitemap priority 0.0-1.0
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		// Index for filtering by page type and active status
		index("idx_pages_type_active").on(table.pageType, table.isActive),
		// Index for sorting by SEO score
		index("idx_pages_seo_score").on(table.seoScore),
	],
);

export const seoIssues = pgTable(
	"seo_issues",
	{
		id: serial("id").primaryKey(),
		pageId: integer("page_id").references(() => seoPages.id, {
			onDelete: "cascade",
		}),
		issueType: text("issue_type").notNull(), // "critical" | "warning" | "info"
		category: text().notNull(), // "meta" | "content" | "technical" | "performance" | "mobile" | "accessibility"
		title: text().notNull(),
		description: text(),
		recommendation: text(),
		/** Issue priority */
		severity: integer().notNull().default(5), // 1-10 (10 = most severe)
		impact: text().notNull(), // "high" | "medium" | "low"
		/** Resolution tracking */
		isResolved: boolean("is_resolved").notNull().default(false),
		resolvedAt: timestamp("resolved_at"),
		resolvedBy: text("resolved_by"),
		notes: text(),
		detectedAt: timestamp("detected_at").defaultNow(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		// Index for filtering by page and issue type
		index("idx_issues_page_type_resolved").on(
			table.pageId,
			table.issueType,
			table.isResolved,
		),
		// Index for severity-based queries
		index("idx_issues_severity").on(table.severity),
	],
);

export const seoKeywordRankings = pgTable(
	"seo_keyword_rankings",
	{
		id: serial("id").primaryKey(),
		pageId: integer("page_id").references(() => seoPages.id, {
			onDelete: "cascade",
		}),
		keyword: text().notNull(),
		/** Target vs actual ranking */
		targetPosition: integer("target_position").default(10),
		currentPosition: integer("current_position"),
		previousPosition: integer("previous_position"),
		/** Search volume & competition */
		searchVolume: integer("search_volume"),
		competition: text().default("medium"), // "low" | "medium" | "high"
		cpc: real(), // cost per click (for reference)
		/** Tracking */
		lastChecked: timestamp("last_checked"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		// Index for page-based queries with active filter
		index("idx_keyword_rankings_page_active").on(table.pageId, table.isActive),
		// Index for position tracking
		index("idx_keyword_rankings_position").on(table.currentPosition),
	],
);

export const seoBacklinks = pgTable("seo_backlinks", {
	id: serial("id").primaryKey(),
	targetUrl: text("target_url").notNull(), // bountybasket.online page
	sourceUrl: text("source_url").notNull(), // referring domain
	sourceDomain: text("source_domain").notNull(),
	anchorText: text("anchor_text"),
	/** Link quality metrics */
	domainAuthority: integer("domain_authority"), // 0-100
	pageAuthority: integer("page_authority"), // 0-100
	isDofollow: boolean("is_dofollow").default(true),
	isSponsored: boolean("is_sponsored").default(false),
	isUgc: boolean("is_ugc").default(false), // user-generated content
	/** Status tracking */
	status: text().notNull().default("active"), // "active" | "lost" | "broken"
	firstSeen: timestamp("first_seen").defaultNow(),
	lastSeen: timestamp("last_seen").defaultNow(),
	lostAt: timestamp("lost_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoContentSuggestions = pgTable("seo_content_suggestions", {
	id: serial("id").primaryKey(),
	pageId: integer("page_id").references(() => seoPages.id, {
		onDelete: "cascade",
	}),
	suggestionType: text("suggestion_type").notNull(), // "keyword" | "heading" | "content" | "link" | "image"
	title: text().notNull(),
	description: text(),
	currentValue: text("current_value"),
	suggestedValue: text("suggested_value"),
	/** Implementation tracking */
	priority: text().notNull().default("medium"), // "low" | "medium" | "high"
	isImplemented: boolean("is_implemented").notNull().default(false),
	implementedAt: timestamp("implemented_at"),
	implementedBy: text("implemented_by"),
	notes: text(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoCompetitorAnalysis = pgTable("seo_competitor_analysis", {
	id: serial("id").primaryKey(),
	competitorDomain: text("competitor_domain").notNull(),
	competitorName: text("competitor_name").notNull(),
	/** Metrics */
	domainAuthority: integer("domain_authority"), // 0-100
	organicTraffic: integer("organic_traffic"), // monthly estimate
	organicKeywords: integer("organic_keywords"), // total ranking keywords
	backlinks: integer(), // total backlinks
	referringDomains: integer("referring_domains"),
	/** Social metrics */
	socialScore: integer("social_score"), // 0-100
	/** Analysis */
	topKeywords: jsonb("top_keywords"), // array of {keyword, position, volume}
	topPages: jsonb("top_pages"), // array of {url, traffic, keywords}
	contentGaps: jsonb("content_gaps"), // keywords they rank for but we don't
	lastAnalyzed: timestamp("last_analyzed").defaultNow(),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoAuditHistory = pgTable("seo_audit_history", {
	id: serial("id").primaryKey(),
	auditType: text("audit_type").notNull(), // "full" | "quick" | "page" | "technical"
	/** Overall scores */
	overallScore: integer("overall_score"), // 0-100
	contentScore: integer("content_score"),
	technicalScore: integer("technical_score"),
	performanceScore: integer("performance_score"),
	mobileScore: integer("mobile_score"),
	/** Issue counts */
	criticalIssues: integer("critical_issues").default(0),
	warnings: integer().default(0),
	infoIssues: integer("info_issues").default(0),
	/** Pages analyzed */
	pagesAnalyzed: integer("pages_analyzed").default(0),
	issuesFound: integer("issues_found").default(0),
	issuesFixed: integer("issues_fixed").default(0),
	/** Timing */
	duration: integer(), // seconds
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	performedBy: text("performed_by"),
	notes: text(),
	createdAt: timestamp("created_at").defaultNow(),
});
