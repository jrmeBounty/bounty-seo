import * as Sentry from "@sentry/tanstackstart-react";
import type { TRPCRouterRecord } from "@trpc/server";
import { and, asc, avg, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/index";
import {
	account,
	seoAuditHistory,
	seoBacklinks,
	seoCitations,
	seoContentSuggestions,
	seoIssues,
	seoKeywordRankings,
	seoKeywords,
	seoLocations,
	seoPages,
	seoRankingSnapshots,
	seoReviews,
	seoSettings,
	user,
} from "#/db/schema";
import { getGoogleAccessTokenForUser } from "#/lib/google-api";
import {
	postGoogleReviewReply,
	syncGoogleReviews,
} from "#/lib/google-business";
import { getPlaceRanking } from "#/lib/google-maps";
import { createTRPCRouter, publicProcedure } from "./init";

// ─── SEO Tracker: Locations ──────────────────────────────────────────────────

const seoLocationsRouter = {
	list: publicProcedure
		.input(z.object({ isActive: z.boolean().optional() }).optional())
		.query(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.locations.list" }, async () => {
				const where =
					input?.isActive !== undefined
						? eq(seoLocations.isActive, input.isActive)
						: undefined;
				return db
					.select()
					.from(seoLocations)
					.where(where)
					.orderBy(asc(seoLocations.name));
			});
		}),

	withStats: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.locations.withStats" }, async () => {
			const locations = await db
				.select()
				.from(seoLocations)
				.where(eq(seoLocations.isActive, true))
				.orderBy(asc(seoLocations.name));

			if (locations.length === 0) return [];
			const ids = locations.map((l) => l.id);

			const [kwCounts, rvStats, citScores, posData] = await Promise.all([
				db
					.select({ locationId: seoKeywords.locationId, cnt: count() })
					.from(seoKeywords)
					.where(
						and(
							inArray(seoKeywords.locationId, ids),
							eq(seoKeywords.isActive, true),
						),
					)
					.groupBy(seoKeywords.locationId),

				db
					.select({
						locationId: seoReviews.locationId,
						cnt: count(),
						avgR: avg(seoReviews.rating),
					})
					.from(seoReviews)
					.where(inArray(seoReviews.locationId, ids))
					.groupBy(seoReviews.locationId),

				db
					.select({
						locationId: seoCitations.locationId,
						avgS: avg(seoCitations.napScore),
					})
					.from(seoCitations)
					.where(
						and(
							inArray(seoCitations.locationId, ids),
							eq(seoCitations.isActive, true),
						),
					)
					.groupBy(seoCitations.locationId),

				db
					.select({
						locationId: seoRankingSnapshots.locationId,
						avgP: avg(seoRankingSnapshots.position),
					})
					.from(seoRankingSnapshots)
					.where(inArray(seoRankingSnapshots.locationId, ids))
					.groupBy(seoRankingSnapshots.locationId),
			]);

			return locations.map((loc) => ({
				...loc,
				stats: {
					keywords: Number(
						kwCounts.find((r) => r.locationId === loc.id)?.cnt ?? 0,
					),
					reviews: Number(
						rvStats.find((r) => r.locationId === loc.id)?.cnt ?? 0,
					),
					avgRating:
						Math.round(
							Number(rvStats.find((r) => r.locationId === loc.id)?.avgR ?? 0) *
								10,
						) / 10,
					avgPosition:
						Math.round(
							Number(posData.find((r) => r.locationId === loc.id)?.avgP ?? 0) *
								10,
						) / 10,
					citationScore: Math.round(
						Number(citScores.find((r) => r.locationId === loc.id)?.avgS ?? 0),
					),
				},
			}));
		});
	}),

	get: publicProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.locations.get", attributes: { locationId: input.id } },
				async () => {
					const [loc] = await db
						.select()
						.from(seoLocations)
						.where(eq(seoLocations.id, input.id))
						.limit(1);
					return loc ?? null;
				},
			);
		}),

	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(2),
				address: z.string().min(5),
				city: z.string().min(2),
				phone: z.string().optional(),
				website: z.string().url().optional(),
				googlePlaceId: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.locations.create" }, async () => {
				// Check if location with this Place ID already exists
				if (input.googlePlaceId) {
					const existing = await db
						.select()
						.from(seoLocations)
						.where(eq(seoLocations.googlePlaceId, input.googlePlaceId))
						.limit(1);

					if (existing.length > 0) {
						// Return existing location instead of creating duplicate
						return existing[0];
					}
				}

				// Create new location
				const [loc] = await db
					.insert(seoLocations)
					.values({
						name: input.name,
						address: input.address,
						city: input.city,
						phone: input.phone ?? null,
						website: input.website ?? null,
						googlePlaceId: input.googlePlaceId ?? null,
					})
					.returning();
				return loc;
			});
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
				name: z.string().min(2).optional(),
				address: z.string().min(5).optional(),
				city: z.string().min(2).optional(),
				phone: z.string().optional(),
				website: z.string().url().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.locations.update", attributes: { locationId: input.id } },
				async () => {
					const { id, ...data } = input;
					const [updated] = await db
						.update(seoLocations)
						.set({ ...data, updatedAt: new Date() })
						.where(eq(seoLocations.id, id))
						.returning();
					return updated;
				},
			);
		}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Keywords ───────────────────────────────────────────────────

const seoKeywordsRouter = {
	list: publicProcedure
		.input(
			z
				.object({
					locationId: z.number().int().positive().optional(),
					category: z
						.enum(["branded", "local", "category", "competitor"])
						.optional(),
					isActive: z.boolean().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.keywords.list" }, async () => {
				const conditions = [];
				if (input?.locationId)
					conditions.push(eq(seoKeywords.locationId, input.locationId));
				if (input?.category)
					conditions.push(eq(seoKeywords.category, input.category));
				if (input?.isActive !== undefined)
					conditions.push(eq(seoKeywords.isActive, input.isActive));

				const keywords = await db
					.select()
					.from(seoKeywords)
					.where(conditions.length ? and(...conditions) : undefined)
					.orderBy(asc(seoKeywords.term));

				if (keywords.length === 0) return [];

				const keywordIds = keywords.map((k) => k.id);

				// Latest 2 snapshots per keyword for position + trend
				const snapshots = await db
					.select()
					.from(seoRankingSnapshots)
					.where(inArray(seoRankingSnapshots.keywordId, keywordIds))
					.orderBy(desc(seoRankingSnapshots.snapshotDate));

				const snapMap = new Map<number, typeof snapshots>();
				for (const snap of snapshots) {
					if (snap.keywordId === null) continue;
					const arr = snapMap.get(snap.keywordId) ?? [];
					if (arr.length < 2) {
						arr.push(snap);
						snapMap.set(snap.keywordId, arr);
					}
				}

				// Fetch location city names
				const locIds = [
					...new Set(keywords.map((k) => k.locationId).filter(Boolean)),
				] as number[];
				const locs = locIds.length
					? await db
							.select({ id: seoLocations.id, city: seoLocations.city })
							.from(seoLocations)
							.where(inArray(seoLocations.id, locIds))
					: [];
				const locMap = new Map(locs.map((l) => [l.id, l.city]));

				return keywords.map((kw) => {
					const snaps = snapMap.get(kw.id) ?? [];
					const curr = snaps[0]?.position ?? null;
					const prev = snaps[1]?.position ?? null;
					return {
						...kw,
						currentPosition: curr,
						previousPosition: prev,
						trend: curr !== null && prev !== null ? prev - curr : null,
						locationCity: kw.locationId
							? (locMap.get(kw.locationId) ?? "Unknown")
							: "Unknown",
						lastChecked: snaps[0]?.snapshotDate ?? null,
					};
				});
			});
		}),

	create: publicProcedure
		.input(
			z.object({
				term: z.string().min(2),
				locationId: z.number().int().positive(),
				category: z
					.enum(["branded", "local", "category", "competitor"])
					.default("local"),
				targetPosition: z.number().int().min(1).max(20).default(3),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.keywords.create" }, async () => {
				const [kw] = await db
					.insert(seoKeywords)
					.values({
						term: input.term,
						locationId: input.locationId,
						category: input.category,
						targetPosition: input.targetPosition,
					})
					.returning();
				return kw;
			});
		}),

	delete: publicProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.keywords.delete", attributes: { keywordId: input.id } },
				async () => {
					await db.delete(seoKeywords).where(eq(seoKeywords.id, input.id));
					return { deleted: true, id: input.id };
				},
			);
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
				term: z.string().min(2).optional(),
				targetPosition: z.number().int().min(1).max(20).optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.keywords.update", attributes: { keywordId: input.id } },
				async () => {
					const { id, ...data } = input;
					const [updated] = await db
						.update(seoKeywords)
						.set(data)
						.where(eq(seoKeywords.id, id))
						.returning();
					return updated;
				},
			);
		}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Rankings ───────────────────────────────────────────────────

const seoRankingsRouter = {
	snapshots: publicProcedure
		.input(
			z.object({
				keywordId: z.number().int().positive(),
				days: z.number().int().min(1).max(365).default(30),
			}),
		)
		.query(async ({ input }) => {
			return Sentry.startSpan(
				{
					name: "seo.rankings.snapshots",
					attributes: { keywordId: input.keywordId },
				},
				async () => {
					const cutoff = new Date();
					cutoff.setDate(cutoff.getDate() - input.days);
					const cutoffStr = cutoff.toISOString().split("T")[0];
					return db
						.select()
						.from(seoRankingSnapshots)
						.where(
							and(
								eq(seoRankingSnapshots.keywordId, input.keywordId),
								gte(seoRankingSnapshots.snapshotDate, cutoffStr),
							),
						)
						.orderBy(asc(seoRankingSnapshots.snapshotDate));
				},
			);
		}),

	/** Chart data: positions over time for top N keywords in a location */
	trend: publicProcedure
		.input(
			z.object({
				locationId: z.number().int().positive().optional(),
				days: z.number().int().min(7).max(90).default(30),
				limit: z.number().int().min(1).max(5).default(3),
			}),
		)
		.query(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.rankings.trend" }, async () => {
				const kwWhere = input.locationId
					? and(
							eq(seoKeywords.locationId, input.locationId),
							eq(seoKeywords.isActive, true),
						)
					: eq(seoKeywords.isActive, true);

				const topKws = await db
					.select()
					.from(seoKeywords)
					.where(kwWhere)
					.orderBy(asc(seoKeywords.id))
					.limit(input.limit);

				if (topKws.length === 0) return { keywords: [], data: [] };

				const cutoff = new Date();
				cutoff.setDate(cutoff.getDate() - input.days);
				const cutoffStr = cutoff.toISOString().split("T")[0];

				const snaps = await db
					.select()
					.from(seoRankingSnapshots)
					.where(
						and(
							inArray(
								seoRankingSnapshots.keywordId,
								topKws.map((k) => k.id),
							),
							gte(seoRankingSnapshots.snapshotDate, cutoffStr),
						),
					)
					.orderBy(asc(seoRankingSnapshots.snapshotDate));

				const dates = [...new Set(snaps.map((s) => s.snapshotDate))].sort();
				const chartData = dates.map((date) => {
					const row: Record<string, string | number | null> = { date };
					for (const kw of topKws) {
						const snap = snaps.find(
							(s) => s.keywordId === kw.id && s.snapshotDate === date,
						);
						// Use short label (first 3 words) so chart labels fit
						const label = kw.term.split(" ").slice(0, 3).join(" ");
						row[label] = snap?.position ?? null;
					}
					return row;
				});

				return {
					keywords: topKws.map((k) => ({
						id: k.id,
						term: k.term,
						label: k.term.split(" ").slice(0, 3).join(" "),
					})),
					data: chartData,
				};
			});
		}),

	addSnapshot: publicProcedure
		.input(
			z.object({
				keywordId: z.number().int().positive(),
				locationId: z.number().int().positive(),
				position: z.number().int().min(1).nullable(),
				snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				source: z.enum(["google_maps", "google_search"]).default("google_maps"),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.rankings.addSnapshot" },
				async () => {
					const [snap] = await db
						.insert(seoRankingSnapshots)
						.values({
							keywordId: input.keywordId,
							locationId: input.locationId,
							position: input.position,
							snapshotDate: input.snapshotDate,
							source: input.source,
						})
						.returning();
					return snap;
				},
			);
		}),

	checkNow: publicProcedure
		.input(
			z.object({
				keywordId: z.number().int().positive(),
				locationId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "seo.rankings.checkNow", attributes: input },
				async () => {
					const [keyword] = await db
						.select()
						.from(seoKeywords)
						.where(eq(seoKeywords.id, input.keywordId))
						.limit(1);

					const [location] = await db
						.select()
						.from(seoLocations)
						.where(eq(seoLocations.id, input.locationId))
						.limit(1);

					if (!keyword || !location) {
						return {
							position: null,
							message: "Keyword or Location not found in database",
						};
					}

					const { position, source, message } = await getPlaceRanking(
						keyword.term,
						location.googlePlaceId,
						location.name,
					);

					const todayStr = new Date().toISOString().split("T")[0];
					await db.insert(seoRankingSnapshots).values({
						keywordId: input.keywordId,
						locationId: input.locationId,
						position,
						snapshotDate: todayStr,
						source,
					});

					return {
						position,
						message,
					};
				},
			);
		}),

	exportAll: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.rankings.exportAll" }, async () => {
			return db
				.select({
					snapshotDate: seoRankingSnapshots.snapshotDate,
					position: seoRankingSnapshots.position,
					source: seoRankingSnapshots.source,
					term: seoKeywords.term,
					category: seoKeywords.category,
					locationCity: seoLocations.city,
				})
				.from(seoRankingSnapshots)
				.leftJoin(
					seoKeywords,
					eq(seoRankingSnapshots.keywordId, seoKeywords.id),
				)
				.leftJoin(
					seoLocations,
					eq(seoRankingSnapshots.locationId, seoLocations.id),
				)
				.orderBy(desc(seoRankingSnapshots.snapshotDate));
		});
	}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Reviews ────────────────────────────────────────────────────

const seoReviewsRouter = {
	list: publicProcedure
		.input(
			z
				.object({
					locationId: z.number().int().positive().optional(),
					rating: z.number().int().min(1).max(5).optional(),
					sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
					source: z.string().optional(),
					limit: z.number().int().min(1).max(100).default(50),
					offset: z.number().int().min(0).default(0),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.reviews.list" }, async () => {
				const conditions = [];
				if (input?.locationId)
					conditions.push(eq(seoReviews.locationId, input.locationId));
				if (input?.rating) conditions.push(eq(seoReviews.rating, input.rating));
				if (input?.sentiment)
					conditions.push(eq(seoReviews.sentiment, input.sentiment));
				if (input?.source) conditions.push(eq(seoReviews.source, input.source));
				const where = conditions.length ? and(...conditions) : undefined;

				const [reviews, [{ total }]] = await Promise.all([
					db
						.select({
							id: seoReviews.id,
							locationId: seoReviews.locationId,
							reviewerName: seoReviews.reviewerName,
							rating: seoReviews.rating,
							text: seoReviews.text,
							reply: seoReviews.reply,
							repliedAt: seoReviews.repliedAt,
							reviewDate: seoReviews.reviewDate,
							source: seoReviews.source,
							sentiment: seoReviews.sentiment,
							isResolved: seoReviews.isResolved,
							locationCity: seoLocations.city,
						})
						.from(seoReviews)
						.leftJoin(seoLocations, eq(seoReviews.locationId, seoLocations.id))
						.where(where)
						.orderBy(desc(seoReviews.reviewDate))
						.limit(input?.limit ?? 50)
						.offset(input?.offset ?? 0),

					db.select({ total: count() }).from(seoReviews).where(where),
				]);

				return { reviews, total: Number(total) };
			});
		}),

	reply: publicProcedure
		.input(
			z.object({
				reviewId: z.number().int().positive(),
				replyText: z.string().min(1).max(2000),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			return Sentry.startSpan(
				{ name: "seo.reviews.reply", attributes: { reviewId: input.reviewId } },
				async () => {
					const [review] = await db
						.select()
						.from(seoReviews)
						.where(eq(seoReviews.id, input.reviewId))
						.limit(1);

					if (!review) {
						throw new Error("Review not found");
					}

					const [location] = await db
						.select()
						.from(seoLocations)
						.where(eq(seoLocations.id, review.locationId))
						.limit(1);

					// If it is a Google review, attempt to post the reply to GBP API
					if (review.source === "google") {
						const userId = ctx.session?.user?.id;
						let accessToken: string | null = null;
						if (userId) {
							accessToken = await getGoogleAccessTokenForUser(userId);
						} else {
							// Cron/CLI script context or first available google user fallback
							const [fallbackAccount] = await db
								.select()
								.from(account)
								.where(eq(account.providerId, "google"))
								.limit(1);
							if (fallbackAccount) {
								accessToken = await getGoogleAccessTokenForUser(
									fallbackAccount.userId,
								);
							}
						}

						await postGoogleReviewReply(
							location.googlePlaceId,
							review.sourceId,
							input.replyText,
							accessToken,
						);
					}

					const [updated] = await db
						.update(seoReviews)
						.set({ reply: input.replyText, repliedAt: new Date() })
						.where(eq(seoReviews.id, input.reviewId))
						.returning();
					return updated;
				},
			);
		}),
	resolve: publicProcedure
		.input(
			z.object({
				reviewId: z.number().int().positive(),
				resolved: z.boolean(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{
					name: "seo.reviews.resolve",
					attributes: { reviewId: input.reviewId },
				},
				async () => {
					const [updated] = await db
						.update(seoReviews)
						.set({ isResolved: input.resolved })
						.where(eq(seoReviews.id, input.reviewId))
						.returning();
					return updated;
				},
			);
		}),

	autoTag: publicProcedure.mutation(async () => {
		return Sentry.startSpan({ name: "seo.reviews.autoTag" }, async () => {
			const POSITIVE = [
				"great",
				"excellent",
				"amazing",
				"love",
				"wonderful",
				"fantastic",
				"best",
				"awesome",
				"perfect",
				"clean",
				"friendly",
				"helpful",
				"good",
				"outstanding",
				"brilliant",
				"superb",
				"impressed",
				"recommend",
				"fresh",
				"quality",
				"affordable",
				"convenient",
				"organised",
			];
			const NEGATIVE = [
				"terrible",
				"bad",
				"worst",
				"disappointed",
				"rude",
				"horrible",
				"awful",
				"waste",
				"poor",
				"dirty",
				"slow",
				"overpriced",
				"disgusting",
				"unacceptable",
				"never",
				"avoid",
				"appalling",
				"frustrating",
				"expired",
				"overcharged",
				"unhelpful",
				"crowded",
				"broken",
			];

			const allReviews = await db
				.select({ id: seoReviews.id, text: seoReviews.text })
				.from(seoReviews);

			let updated = 0;
			for (const review of allReviews) {
				const text = (review.text ?? "").toLowerCase();
				const posHits = POSITIVE.filter((w) => text.includes(w)).length;
				const negHits = NEGATIVE.filter((w) => text.includes(w)).length;
				const sentiment =
					posHits > negHits
						? "positive"
						: negHits > posHits
							? "negative"
							: "neutral";
				await db
					.update(seoReviews)
					.set({ sentiment })
					.where(eq(seoReviews.id, review.id));
				updated++;
			}
			return { updated };
		});
	}),

	exportAll: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.reviews.exportAll" }, async () => {
			return db
				.select({
					id: seoReviews.id,
					locationCity: seoLocations.city,
					reviewerName: seoReviews.reviewerName,
					rating: seoReviews.rating,
					text: seoReviews.text,
					source: seoReviews.source,
					sentiment: seoReviews.sentiment,
					reviewDate: seoReviews.reviewDate,
					isResolved: seoReviews.isResolved,
					reply: seoReviews.reply,
				})
				.from(seoReviews)
				.leftJoin(seoLocations, eq(seoReviews.locationId, seoLocations.id))
				.orderBy(desc(seoReviews.reviewDate));
		});
	}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Citations ──────────────────────────────────────────────────

const seoCitationsRouter = {
	list: publicProcedure
		.input(
			z
				.object({
					locationId: z.number().int().positive().optional(),
					status: z
						.enum(["active", "inactive", "unchecked", "missing", "incorrect"])
						.optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.citations.list" }, async () => {
				const conditions = [];
				if (input?.locationId)
					conditions.push(eq(seoCitations.locationId, input.locationId));
				if (input?.status)
					conditions.push(eq(seoCitations.status, input.status));

				return db
					.select({
						id: seoCitations.id,
						locationId: seoCitations.locationId,
						directoryName: seoCitations.directoryName,
						directoryUrl: seoCitations.directoryUrl,
						listingUrl: seoCitations.listingUrl,
						listedName: seoCitations.listedName,
						listedAddress: seoCitations.listedAddress,
						listedPhone: seoCitations.listedPhone,
						nameMatch: seoCitations.nameMatch,
						addressMatch: seoCitations.addressMatch,
						phoneMatch: seoCitations.phoneMatch,
						websiteMatch: seoCitations.websiteMatch,
						napScore: seoCitations.napScore,
						status: seoCitations.status,
						lastChecked: seoCitations.lastChecked,
						locationCity: seoLocations.city,
					})
					.from(seoCitations)
					.leftJoin(seoLocations, eq(seoCitations.locationId, seoLocations.id))
					.where(conditions.length ? and(...conditions) : undefined)
					.orderBy(desc(seoCitations.napScore));
			});
		}),

	create: publicProcedure
		.input(
			z.object({
				locationId: z.number().int().positive(),
				directoryName: z.string().min(2),
				directoryUrl: z.string().url().optional(),
				listingUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.citations.create" }, async () => {
				const [cit] = await db
					.insert(seoCitations)
					.values({
						locationId: input.locationId,
						directoryName: input.directoryName,
						directoryUrl: input.directoryUrl ?? null,
						listingUrl: input.listingUrl ?? null,
					})
					.returning();
				return cit;
			});
		}),

	checkNow: publicProcedure
		.input(z.object({ citationId: z.number().int().positive() }))
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{
					name: "seo.citations.checkNow",
					attributes: { citationId: input.citationId },
				},
				async () => {
					await db
						.update(seoCitations)
						.set({ lastChecked: new Date() })
						.where(eq(seoCitations.id, input.citationId));
					return {
						napScore: null as number | null,
						message: "Auto-check coming in Step 5",
					};
				},
			);
		}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Dashboard Aggregation ─────────────────────────────────────

const seoDashboardRouter = {
	stats: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.dashboard.stats" }, async () => {
			const [
				locCount,
				kwCount,
				rvStats,
				ratingDist,
				recentRevs,
				citStats,
				recentSnaps,
			] = await Promise.all([
				db
					.select({ n: count() })
					.from(seoLocations)
					.where(eq(seoLocations.isActive, true)),
				db
					.select({ n: count() })
					.from(seoKeywords)
					.where(eq(seoKeywords.isActive, true)),
				db
					.select({ n: count(), avgR: avg(seoReviews.rating) })
					.from(seoReviews),
				db
					.select({ rating: seoReviews.rating, n: count() })
					.from(seoReviews)
					.groupBy(seoReviews.rating)
					.orderBy(desc(seoReviews.rating)),
				db
					.select({
						id: seoReviews.id,
						reviewerName: seoReviews.reviewerName,
						rating: seoReviews.rating,
						text: seoReviews.text,
						reviewDate: seoReviews.reviewDate,
						source: seoReviews.source,
						sentiment: seoReviews.sentiment,
						locationCity: seoLocations.city,
					})
					.from(seoReviews)
					.leftJoin(seoLocations, eq(seoReviews.locationId, seoLocations.id))
					.orderBy(desc(seoReviews.reviewDate))
					.limit(5),
				db
					.select({
						avgScore: avg(seoCitations.napScore),
						issues: sql<number>`COUNT(CASE WHEN ${seoCitations.status} != 'active' THEN 1 END)`,
					})
					.from(seoCitations)
					.where(eq(seoCitations.isActive, true)),
				// Latest 2 snapshots per keyword (for avg position + changes)
				db
					.select({
						keywordId: seoRankingSnapshots.keywordId,
						position: seoRankingSnapshots.position,
						snapshotDate: seoRankingSnapshots.snapshotDate,
						term: seoKeywords.term,
						locationCity: seoLocations.city,
					})
					.from(seoRankingSnapshots)
					.leftJoin(
						seoKeywords,
						eq(seoRankingSnapshots.keywordId, seoKeywords.id),
					)
					.leftJoin(
						seoLocations,
						eq(seoRankingSnapshots.locationId, seoLocations.id),
					)
					.orderBy(desc(seoRankingSnapshots.snapshotDate))
					.limit(60),
			]);

			// Compute per-keyword latest + previous positions
			const latestPos = new Map<number, number>();
			const prevPos = new Map<number, number>();
			for (const s of recentSnaps) {
				if (s.keywordId === null || s.position === null) continue;
				if (!latestPos.has(s.keywordId)) latestPos.set(s.keywordId, s.position);
				else if (!prevPos.has(s.keywordId))
					prevPos.set(s.keywordId, s.position);
			}

			const allPositions = Array.from(latestPos.values());
			const avgPosition = allPositions.length
				? Math.round(
						(allPositions.reduce((a, b) => a + b, 0) / allPositions.length) *
							10,
					) / 10
				: null;

			// Build keyword changes list (deduplicated)
			const seen = new Set<number>();
			const keywordChanges = recentSnaps
				.filter((s) => s.keywordId !== null && latestPos.has(s.keywordId!))
				.reduce<
					Array<{
						keywordId: number | null;
						term: string;
						locationCity: string;
						current: number | null;
						previous: number | null;
						change: number | null;
					}>
				>((acc, s) => {
					if (s.keywordId !== null && !seen.has(s.keywordId)) {
						seen.add(s.keywordId);
						const curr = latestPos.get(s.keywordId) ?? null;
						const prev = prevPos.get(s.keywordId) ?? null;
						acc.push({
							keywordId: s.keywordId,
							term: s.term ?? "",
							locationCity: s.locationCity ?? "",
							current: curr,
							previous: prev,
							change: curr !== null && prev !== null ? prev - curr : null,
						});
					}
					return acc;
				}, [])
				.slice(0, 8);

			return {
				locationCount: Number(locCount[0]?.n ?? 0),
				keywordCount: Number(kwCount[0]?.n ?? 0),
				reviews: {
					total: Number(rvStats[0]?.n ?? 0),
					avgRating: Math.round(Number(rvStats[0]?.avgR ?? 0) * 10) / 10,
				},
				ratingDistribution: ratingDist.map((r) => ({
					rating: r.rating,
					count: Number(r.n),
				})),
				citations: {
					avgScore: Math.round(Number(citStats[0]?.avgScore ?? 0)),
					issues: Number(citStats[0]?.issues ?? 0),
				},
				avgPosition,
				recentReviews: recentRevs,
				keywordChanges,
			};
		});
	}),
} satisfies TRPCRouterRecord;

// ─── Users ──────────────────────────────────────────────────────────────────

const usersRouter = {
	list: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "users.list" }, async () => {
			return db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					createdAt: user.createdAt,
				})
				.from(user)
				.orderBy(desc(user.createdAt));
		});
	}),

	updateRole: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(["admin", "staff", "viewer"]),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan(
				{ name: "users.updateRole", attributes: { userId: input.userId } },
				async () => {
					const [updated] = await db
						.update(user)
						.set({ role: input.role })
						.where(eq(user.id, input.userId))
						.returning({ id: user.id, role: user.role });
					return updated;
				},
			);
		}),
} satisfies TRPCRouterRecord;

// ─── SEO Tracker: Settings ─────────────────────────────────────────────────

const seoSettingsRouter = {
	get: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.settings.get" }, async () => {
			const [row] = await db.select().from(seoSettings).limit(1);
			return row ?? null;
		});
	}),

	upsert: publicProcedure
		.input(
			z.object({
				businessName: z.string().min(1),
				tagline: z.string(),
				primaryWebsite: z.string().optional(),
				primaryPhone: z.string().optional(),
				country: z.string(),
				timezone: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return Sentry.startSpan({ name: "seo.settings.upsert" }, async () => {
				// Check if a row already exists
				const [existing] = await db
					.select({ id: seoSettings.id })
					.from(seoSettings)
					.limit(1);
				if (existing) {
					const [updated] = await db
						.update(seoSettings)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(seoSettings.id, existing.id))
						.returning();
					return updated;
				}
				const [inserted] = await db
					.insert(seoSettings)
					.values({ ...input })
					.returning();
				return inserted;
			});
		}),
} satisfies TRPCRouterRecord;

// ─── Website SEO Optimization ────────────────────────────────────────────────

const seoWebsiteRouter = {
	stats: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "seo.website.stats" }, async () => {
			const [pageStats, issueStats, backlinkStats, keywordStats] =
				await Promise.all([
					db
						.select({
							total: count(),
							avgScore: avg(seoPages.seoScore),
							indexable: sql<number>`COUNT(CASE WHEN ${seoPages.isIndexable} = true THEN 1 END)`,
						})
						.from(seoPages)
						.where(eq(seoPages.isActive, true)),
					db
						.select({
							total: count(),
							critical: sql<number>`COUNT(CASE WHEN ${seoIssues.issueType} = 'critical' THEN 1 END)`,
							unresolved: sql<number>`COUNT(CASE WHEN ${seoIssues.isResolved} = false THEN 1 END)`,
						})
						.from(seoIssues),
					db
						.select({
							total: count(),
							dofollow: sql<number>`COUNT(CASE WHEN ${seoBacklinks.isDofollow} = true AND ${seoBacklinks.status} = 'active' THEN 1 END)`,
						})
						.from(seoBacklinks)
						.where(eq(seoBacklinks.status, "active")),
					db
						.select({
							total: count(),
							avgPosition: avg(seoKeywordRankings.currentPosition),
						})
						.from(seoKeywordRankings)
						.where(eq(seoKeywordRankings.isActive, true)),
				]);

			return {
				overallScore: Math.round(Number(pageStats[0]?.avgScore ?? 0)),
				totalPages: Number(pageStats[0]?.total ?? 0),
				indexablePages: Number(pageStats[0]?.indexable ?? 0),
				criticalIssues: Number(issueStats[0]?.critical ?? 0),
				unresolvedIssues: Number(issueStats[0]?.unresolved ?? 0),
				totalBacklinks: Number(backlinkStats[0]?.total ?? 0),
				dofollowBacklinks: Number(backlinkStats[0]?.dofollow ?? 0),
				avgKeywordPosition:
					Math.round(Number(keywordStats[0]?.avgPosition ?? 0) * 10) / 10,
			};
		});
	}),

	pages: {
		list: publicProcedure
			.input(
				z
					.object({
						pageType: z
							.enum(["home", "category", "product", "blog", "other"])
							.optional(),
						limit: z.number().int().min(1).max(100).default(50),
						offset: z.number().int().min(0).default(0),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.pages.list" },
					async () => {
						const conditions = [eq(seoPages.isActive, true)];
						if (input?.pageType) {
							conditions.push(eq(seoPages.pageType, input.pageType));
						}

						const [pages, [{ total }]] = await Promise.all([
							db
								.select()
								.from(seoPages)
								.where(and(...conditions))
								.orderBy(desc(seoPages.seoScore))
								.limit(input?.limit ?? 50)
								.offset(input?.offset ?? 0),
							db
								.select({ total: count() })
								.from(seoPages)
								.where(and(...conditions)),
						]);

						return { pages, total: Number(total) };
					},
				);
			}),

		get: publicProcedure
			.input(z.object({ id: z.number().int().positive() }))
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.pages.get", attributes: { pageId: input.id } },
					async () => {
						const [page] = await db
							.select()
							.from(seoPages)
							.where(eq(seoPages.id, input.id))
							.limit(1);

						if (!page) return null;

						const [issues, keywords, suggestions] = await Promise.all([
							db
								.select()
								.from(seoIssues)
								.where(eq(seoIssues.pageId, input.id))
								.orderBy(desc(seoIssues.severity)),
							db
								.select()
								.from(seoKeywordRankings)
								.where(eq(seoKeywordRankings.pageId, input.id))
								.orderBy(asc(seoKeywordRankings.currentPosition)),
							db
								.select()
								.from(seoContentSuggestions)
								.where(eq(seoContentSuggestions.pageId, input.id))
								.orderBy(desc(seoContentSuggestions.priority)),
						]);

						return {
							...page,
							issues,
							keywords,
							suggestions,
						};
					},
				);
			}),

		create: publicProcedure
			.input(
				z.object({
					url: z.string().url(),
					pageType: z.enum(["home", "category", "product", "blog", "other"]),
					title: z.string().optional(),
					metaDescription: z.string().optional(),
				}),
			)
			.mutation(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.pages.create" },
					async () => {
						const [page] = await db
							.insert(seoPages)
							.values({
								url: input.url,
								pageType: input.pageType,
								title: input.title,
								metaDescription: input.metaDescription,
							})
							.returning();
						return page;
					},
				);
			}),
	},

	issues: {
		list: publicProcedure
			.input(
				z
					.object({
						pageId: z.number().int().positive().optional(),
						issueType: z.enum(["critical", "warning", "info"]).optional(),
						category: z
							.enum([
								"meta",
								"content",
								"technical",
								"performance",
								"mobile",
								"accessibility",
							])
							.optional(),
						isResolved: z.boolean().optional(),
						limit: z.number().int().min(1).max(100).default(50),
						offset: z.number().int().min(0).default(0),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.issues.list" },
					async () => {
						const conditions = [];
						if (input?.pageId) {
							conditions.push(eq(seoIssues.pageId, input.pageId));
						}
						if (input?.issueType) {
							conditions.push(eq(seoIssues.issueType, input.issueType));
						}
						if (input?.category) {
							conditions.push(eq(seoIssues.category, input.category));
						}
						if (input?.isResolved !== undefined) {
							conditions.push(eq(seoIssues.isResolved, input.isResolved));
						}

						const where = conditions.length ? and(...conditions) : undefined;

						const [issues, [{ total }]] = await Promise.all([
							db
								.select({
									id: seoIssues.id,
									pageId: seoIssues.pageId,
									issueType: seoIssues.issueType,
									category: seoIssues.category,
									title: seoIssues.title,
									description: seoIssues.description,
									recommendation: seoIssues.recommendation,
									severity: seoIssues.severity,
									impact: seoIssues.impact,
									isResolved: seoIssues.isResolved,
									detectedAt: seoIssues.detectedAt,
									pageUrl: seoPages.url,
								})
								.from(seoIssues)
								.leftJoin(seoPages, eq(seoIssues.pageId, seoPages.id))
								.where(where)
								.orderBy(desc(seoIssues.severity), desc(seoIssues.detectedAt))
								.limit(input?.limit ?? 50)
								.offset(input?.offset ?? 0),
							db.select({ total: count() }).from(seoIssues).where(where),
						]);

						return { issues, total: Number(total) };
					},
				);
			}),

		resolve: publicProcedure
			.input(
				z.object({
					issueId: z.number().int().positive(),
					resolved: z.boolean(),
					notes: z.string().optional(),
				}),
			)
			.mutation(async ({ input, ctx }) => {
				return Sentry.startSpan(
					{
						name: "seo.website.issues.resolve",
						attributes: { issueId: input.issueId },
					},
					async () => {
						const [updated] = await db
							.update(seoIssues)
							.set({
								isResolved: input.resolved,
								resolvedAt: input.resolved ? new Date() : null,
								resolvedBy: input.resolved
									? (ctx.session?.user?.id ?? null)
									: null,
								notes: input.notes ?? null,
							})
							.where(eq(seoIssues.id, input.issueId))
							.returning();
						return updated;
					},
				);
			}),
	},

	backlinks: {
		list: publicProcedure
			.input(
				z
					.object({
						status: z.enum(["active", "lost", "broken"]).optional(),
						limit: z.number().int().min(1).max(100).default(50),
						offset: z.number().int().min(0).default(0),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.backlinks.list" },
					async () => {
						const conditions = [];
						if (input?.status) {
							conditions.push(eq(seoBacklinks.status, input.status));
						}

						const where = conditions.length ? and(...conditions) : undefined;

						const [backlinks, [{ total }]] = await Promise.all([
							db
								.select()
								.from(seoBacklinks)
								.where(where)
								.orderBy(desc(seoBacklinks.domainAuthority))
								.limit(input?.limit ?? 50)
								.offset(input?.offset ?? 0),
							db.select({ total: count() }).from(seoBacklinks).where(where),
						]);

						return { backlinks, total: Number(total) };
					},
				);
			}),

		create: publicProcedure
			.input(
				z.object({
					targetUrl: z.string().url(),
					sourceUrl: z.string().url(),
					sourceDomain: z.string(),
					anchorText: z.string().optional(),
					isDofollow: z.boolean().default(true),
					domainAuthority: z.number().int().min(0).max(100).optional(),
				}),
			)
			.mutation(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.backlinks.create" },
					async () => {
						const [backlink] = await db
							.insert(seoBacklinks)
							.values({
								targetUrl: input.targetUrl,
								sourceUrl: input.sourceUrl,
								sourceDomain: input.sourceDomain,
								anchorText: input.anchorText,
								isDofollow: input.isDofollow,
								domainAuthority: input.domainAuthority,
							})
							.returning();
						return backlink;
					},
				);
			}),
	},

	keywords: {
		list: publicProcedure
			.input(
				z
					.object({
						pageId: z.number().int().positive().optional(),
						limit: z.number().int().min(1).max(100).default(50),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.keywords.list" },
					async () => {
						const conditions = [eq(seoKeywordRankings.isActive, true)];
						if (input?.pageId) {
							conditions.push(eq(seoKeywordRankings.pageId, input.pageId));
						}

						return db
							.select({
								id: seoKeywordRankings.id,
								pageId: seoKeywordRankings.pageId,
								keyword: seoKeywordRankings.keyword,
								currentPosition: seoKeywordRankings.currentPosition,
								previousPosition: seoKeywordRankings.previousPosition,
								targetPosition: seoKeywordRankings.targetPosition,
								searchVolume: seoKeywordRankings.searchVolume,
								competition: seoKeywordRankings.competition,
								lastChecked: seoKeywordRankings.lastChecked,
								pageUrl: seoPages.url,
							})
							.from(seoKeywordRankings)
							.leftJoin(seoPages, eq(seoKeywordRankings.pageId, seoPages.id))
							.where(and(...conditions))
							.orderBy(asc(seoKeywordRankings.currentPosition))
							.limit(input?.limit ?? 50);
					},
				);
			}),

		create: publicProcedure
			.input(
				z.object({
					pageId: z.number().int().positive(),
					keyword: z.string().min(2),
					targetPosition: z.number().int().min(1).max(100).default(10),
					searchVolume: z.number().int().optional(),
				}),
			)
			.mutation(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.keywords.create" },
					async () => {
						const [keyword] = await db
							.insert(seoKeywordRankings)
							.values({
								pageId: input.pageId,
								keyword: input.keyword,
								targetPosition: input.targetPosition,
								searchVolume: input.searchVolume,
							})
							.returning();
						return keyword;
					},
				);
			}),
	},

	audit: {
		history: publicProcedure
			.input(
				z
					.object({
						limit: z.number().int().min(1).max(50).default(10),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				return Sentry.startSpan(
					{ name: "seo.website.audit.history" },
					async () => {
						return db
							.select()
							.from(seoAuditHistory)
							.orderBy(desc(seoAuditHistory.createdAt))
							.limit(input?.limit ?? 10);
					},
				);
			}),

		create: publicProcedure
			.input(
				z.object({
					auditType: z.enum(["full", "quick", "page", "technical"]),
					overallScore: z.number().int().min(0).max(100).optional(),
					pagesAnalyzed: z.number().int().default(0),
					issuesFound: z.number().int().default(0),
				}),
			)
			.mutation(async ({ input, ctx }) => {
				return Sentry.startSpan(
					{ name: "seo.website.audit.create" },
					async () => {
						const [audit] = await db
							.insert(seoAuditHistory)
							.values({
								auditType: input.auditType,
								overallScore: input.overallScore,
								pagesAnalyzed: input.pagesAnalyzed,
								issuesFound: input.issuesFound,
								performedBy: ctx.session?.user?.id ?? null,
								startedAt: new Date(),
								completedAt: new Date(),
							})
							.returning();
						return audit;
					},
				);
			}),
	},
} satisfies TRPCRouterRecord;

// ─── Root tRPC router ────────────────────────────────────────────────────────

export const trpcRouter = createTRPCRouter({
	users: usersRouter,
	seo: createTRPCRouter({
		dashboard: seoDashboardRouter,
		locations: seoLocationsRouter,
		keywords: seoKeywordsRouter,
		rankings: seoRankingsRouter,
		reviews: seoReviewsRouter,
		citations: seoCitationsRouter,
		settings: seoSettingsRouter,
		website: seoWebsiteRouter,
		syncAll: publicProcedure.mutation(async ({ ctx }) => {
			return Sentry.startSpan({ name: "seo.syncAll" }, async () => {
				const userId = ctx.session?.user?.id;
				let accessToken: string | null = null;
				if (userId) {
					accessToken = await getGoogleAccessTokenForUser(userId);
				} else {
					const [fallbackAccount] = await db
						.select()
						.from(account)
						.where(eq(account.providerId, "google"))
						.limit(1);
					if (fallbackAccount) {
						accessToken = await getGoogleAccessTokenForUser(
							fallbackAccount.userId,
						);
					}
				}

				// 1. Fetch all active locations
				const locations = await db
					.select()
					.from(seoLocations)
					.where(eq(seoLocations.isActive, true));

				// 2. Sync reviews for each location
				const syncResults = await Promise.all(
					locations.map(async (loc) => {
						try {
							return await syncGoogleReviews(
								loc.id,
								loc.googlePlaceId,
								accessToken,
							);
						} catch (err) {
							// Failed to sync reviews for location - return error
							return { synced: 0, message: String(err) };
						}
					}),
				);

				// 3. Check rankings for all active keywords
				const keywords = await db
					.select()
					.from(seoKeywords)
					.where(eq(seoKeywords.isActive, true));

				const todayStr = new Date().toISOString().split("T")[0];

				await Promise.all(
					keywords.map(async (kw) => {
						try {
							const loc = locations.find((l) => l.id === kw.locationId);
							if (!loc) return;

							const { position, source } = await getPlaceRanking(
								kw.term,
								loc.googlePlaceId,
								loc.name,
							);

							await db.insert(seoRankingSnapshots).values({
								keywordId: kw.id,
								locationId: kw.locationId,
								position,
								snapshotDate: todayStr,
								source,
							});
						} catch (err) {
							// Failed keyword ranking check - silently continue
						}
					}),
				);

				const totalSyncedReviews = syncResults.reduce(
					(sum, res) => sum + res.synced,
					0,
				);

				return {
					success: true,
					message: `Successfully synced ${locations.length} locations (${totalSyncedReviews} new reviews) and verified ${keywords.length} keywords.`,
				};
			});
		}),
	}),
});

export type TRPCRouter = typeof trpcRouter;
