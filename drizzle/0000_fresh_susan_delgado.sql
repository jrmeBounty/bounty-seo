CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_audit_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_type" text NOT NULL,
	"overall_score" integer,
	"content_score" integer,
	"technical_score" integer,
	"performance_score" integer,
	"mobile_score" integer,
	"critical_issues" integer DEFAULT 0,
	"warnings" integer DEFAULT 0,
	"info_issues" integer DEFAULT 0,
	"pages_analyzed" integer DEFAULT 0,
	"issues_found" integer DEFAULT 0,
	"issues_fixed" integer DEFAULT 0,
	"duration" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"performed_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_backlinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_url" text NOT NULL,
	"source_url" text NOT NULL,
	"source_domain" text NOT NULL,
	"anchor_text" text,
	"domain_authority" integer,
	"page_authority" integer,
	"is_dofollow" boolean DEFAULT true,
	"is_sponsored" boolean DEFAULT false,
	"is_ugc" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"lost_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_citations" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"directory_name" text NOT NULL,
	"directory_url" text,
	"listing_url" text,
	"listed_name" text,
	"listed_address" text,
	"listed_phone" text,
	"listed_website" text,
	"name_match" boolean,
	"address_match" boolean,
	"phone_match" boolean,
	"website_match" boolean,
	"nap_score" integer,
	"status" text DEFAULT 'unchecked',
	"last_checked" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_competitor_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitor_domain" text NOT NULL,
	"competitor_name" text NOT NULL,
	"domain_authority" integer,
	"organic_traffic" integer,
	"organic_keywords" integer,
	"backlinks" integer,
	"referring_domains" integer,
	"social_score" integer,
	"top_keywords" jsonb,
	"top_pages" jsonb,
	"content_gaps" jsonb,
	"last_analyzed" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_content_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer,
	"suggestion_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"current_value" text,
	"suggested_value" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_implemented" boolean DEFAULT false NOT NULL,
	"implemented_at" timestamp,
	"implemented_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer,
	"issue_type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"recommendation" text,
	"severity" integer DEFAULT 5 NOT NULL,
	"impact" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text,
	"notes" text,
	"detected_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_keyword_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer,
	"keyword" text NOT NULL,
	"target_position" integer DEFAULT 10,
	"current_position" integer,
	"previous_position" integer,
	"search_volume" integer,
	"competition" text DEFAULT 'medium',
	"cpc" real,
	"last_checked" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"term" text NOT NULL,
	"category" text DEFAULT 'local',
	"target_position" integer DEFAULT 3,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'Kenya' NOT NULL,
	"phone" text,
	"website" text,
	"google_place_id" text,
	"google_cid" text,
	"lat" real,
	"lng" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "seo_locations_google_place_id_unique" UNIQUE("google_place_id")
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"page_type" text NOT NULL,
	"title" text,
	"meta_description" text,
	"h1" text,
	"word_count" integer,
	"is_indexable" boolean DEFAULT true,
	"is_in_sitemap" boolean DEFAULT false,
	"has_canonical" boolean DEFAULT false,
	"canonical_url" text,
	"load_time" real,
	"mobile_score" integer,
	"desktop_score" integer,
	"seo_score" integer,
	"content_score" integer,
	"technical_score" integer,
	"last_crawled" timestamp,
	"last_modified" timestamp,
	"priority" real DEFAULT 0.5,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "seo_pages_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "seo_ranking_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer,
	"location_id" integer,
	"position" integer,
	"total_results_count" integer,
	"snapshot_date" date NOT NULL,
	"source" text DEFAULT 'google_maps',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"reviewer_name" text,
	"reviewer_avatar" text,
	"rating" integer NOT NULL,
	"text" text,
	"reply" text,
	"replied_at" timestamp,
	"review_date" timestamp NOT NULL,
	"source" text DEFAULT 'google',
	"source_id" text,
	"sentiment" text,
	"is_resolved" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" text DEFAULT 'Bounty Supermarket' NOT NULL,
	"tagline" text DEFAULT 'Great Savings Everyday' NOT NULL,
	"primary_website" text DEFAULT 'https://www.bountybasket.online',
	"primary_phone" text DEFAULT '+254 20 222 1234',
	"country" text DEFAULT 'Kenya' NOT NULL,
	"timezone" text DEFAULT 'EAT' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_citations" ADD CONSTRAINT "seo_citations_location_id_seo_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."seo_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_content_suggestions" ADD CONSTRAINT "seo_content_suggestions_page_id_seo_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."seo_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_issues" ADD CONSTRAINT "seo_issues_page_id_seo_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."seo_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_keyword_rankings" ADD CONSTRAINT "seo_keyword_rankings_page_id_seo_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."seo_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_keywords" ADD CONSTRAINT "seo_keywords_location_id_seo_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."seo_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_ranking_snapshots" ADD CONSTRAINT "seo_ranking_snapshots_keyword_id_seo_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."seo_keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_ranking_snapshots" ADD CONSTRAINT "seo_ranking_snapshots_location_id_seo_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."seo_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_reviews" ADD CONSTRAINT "seo_reviews_location_id_seo_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."seo_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_citations_location_status" ON "seo_citations" USING btree ("location_id","status");--> statement-breakpoint
CREATE INDEX "idx_citations_active" ON "seo_citations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_issues_page_type_resolved" ON "seo_issues" USING btree ("page_id","issue_type","is_resolved");--> statement-breakpoint
CREATE INDEX "idx_issues_severity" ON "seo_issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_keyword_rankings_page_active" ON "seo_keyword_rankings" USING btree ("page_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_keyword_rankings_position" ON "seo_keyword_rankings" USING btree ("current_position");--> statement-breakpoint
CREATE INDEX "idx_pages_type_active" ON "seo_pages" USING btree ("page_type","is_active");--> statement-breakpoint
CREATE INDEX "idx_pages_seo_score" ON "seo_pages" USING btree ("seo_score");--> statement-breakpoint
CREATE INDEX "idx_ranking_snapshots_keyword_date" ON "seo_ranking_snapshots" USING btree ("keyword_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_ranking_snapshots_location_date" ON "seo_ranking_snapshots" USING btree ("location_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_reviews_location_date" ON "seo_reviews" USING btree ("location_id","review_date");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "seo_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_reviews_unresolved" ON "seo_reviews" USING btree ("is_resolved");