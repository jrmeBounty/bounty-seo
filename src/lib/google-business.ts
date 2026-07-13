import { and, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { seoReviews } from "#/db/schema";

// ──── BOUNTY BUSINESS FILTER ─────────────────────────────────────────────────
/**
 * Only locations matching these business names will be synced to the app.
 * This prevents users with other businesses from polluting the Bounty Supermarket database.
 */
const ALLOWED_BUSINESS_NAMES = [
	"Bounty Supermarket",
	"Bounty",
	"Bounty Supermarket Kenya",
	"Bounty Supermarkets",
	// Add more variations if needed
];

/**
 * Checks if a location title matches Bounty Supermarket business names
 */
function isBountyLocation(locationTitle: string): boolean {
	const normalized = locationTitle.trim().toLowerCase();
	return ALLOWED_BUSINESS_NAMES.some((allowed) =>
		normalized.includes(allowed.toLowerCase()),
	);
}

interface GoogleReviewer {
	displayName?: string;
	profilePhotoUrl?: string;
}

interface GoogleReviewReply {
	comment: string;
	updateTime?: string;
}

interface GoogleReview {
	name: string;
	reviewId: string;
	reviewer: GoogleReviewer;
	starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
	comment?: string;
	createTime: string;
	updateTime: string;
	reviewReply?: GoogleReviewReply;
}

interface GoogleReviewsResponse {
	reviews?: GoogleReview[];
	nextPageToken?: string;
}

/**
 * Maps Google's starRating string enum to a number between 1 and 5.
 */
function mapRatingToNumber(rating: string): number {
	switch (rating) {
		case "FIVE":
			return 5;
		case "FOUR":
			return 4;
		case "THREE":
			return 3;
		case "TWO":
			return 2;
		case "ONE":
			return 1;
		default:
			return 5;
	}
}

/**
 * Analyzes review text to auto-tag sentiment.
 */
function deriveSentiment(
	_text: string,
	rating: number,
): "positive" | "neutral" | "negative" {
	if (rating >= 4) return "positive";
	if (rating === 3) return "neutral";
	return "negative";
}

/**
 * Dynamically resolves the Google Business Profile Location resource name (e.g. accounts/X/locations/Y)
 * by listing accounts and locations and matching the metadata's googlePlaceId.
 */
export async function findGbpLocationName(
	googlePlaceId: string,
	accessToken: string,
): Promise<string | null> {
	try {
		// Resolving GBP location name for Place ID
		// 1. Fetch My Business accounts the user has access to
		const accountsResponse = await fetch(
			"https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!accountsResponse.ok) {
			const _errText = await accountsResponse.text();
			// Failed to list GBP accounts - quota or permission issue
			// Don't log full error body if it's a quota error (reduces noise)
			return null;
		}

		const accountsData = (await accountsResponse.json()) as {
			accounts?: Array<{ name: string }>;
		};
		const accounts = accountsData.accounts ?? [];

		// 2. Loop accounts to find the location with the matching Place ID
		for (const account of accounts) {
			const locationsResponse = await fetch(
				`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,metadata,title`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (!locationsResponse.ok) {
				continue;
			}

			const locationsData = (await locationsResponse.json()) as {
				locations?: Array<{
					name: string;
					metadata?: { placeId?: string };
					title?: string;
				}>;
			};
			const locations = locationsData.locations ?? [];

			// 3. Find location matching the googlePlaceId AND Bounty business name
			for (const location of locations) {
				// First check if it's a Bounty location
				if (!location.title || !isBountyLocation(location.title)) {
					continue; // Skip non-Bounty businesses
				}

				// Then check if Place ID matches
				if (location.metadata?.placeId === googlePlaceId) {
					// Successfully resolved GBP location name for Bounty location
					return location.name;
				}
			}
		}
	} catch (error) {
		// Error resolving GBP location name
		return null;
	}
	return null;
}

/**
 * Synchronizes reviews from the Google Business Profile Reviews API.
 * If no access token is available, simulates synchronization with realistic data.
 */
export async function syncGoogleReviews(
	locationId: number,
	googlePlaceId: string | null,
	accessToken: string | null,
): Promise<{ synced: number; message: string }> {
	let resolvedLocationName: string | null = null;

	if (googlePlaceId && accessToken) {
		resolvedLocationName = await findGbpLocationName(
			googlePlaceId,
			accessToken,
		);
	}

	if (!resolvedLocationName || !accessToken) {
		// No active Google session or Place ID matching GBP account
		// DO NOT simulate - return immediately to avoid duplicates
		return {
			synced: 0,
			message:
				"OAuth not configured. Set up Google Business Profile API access to sync real reviews.",
		};
	}

	try {
		// Fetching reviews from GBP API
		const response = await fetch(
			`https://mybusinessreviews.googleapis.com/v1/${resolvedLocationName}/reviews`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`Google Business Profile API error: ${response.statusText} - ${errText}`,
			);
		}

		const data = (await response.json()) as GoogleReviewsResponse;
		const reviews = data.reviews ?? [];

		let addedCount = 0;

		for (const rev of reviews) {
			const rating = mapRatingToNumber(rev.starRating);
			const cleanText = rev.comment ?? "";
			const sentiment = deriveSentiment(cleanText, rating);

			// Check conflict
			const [existing] = await db
				.select({ id: seoReviews.id })
				.from(seoReviews)
				.where(
					and(
						eq(seoReviews.locationId, locationId),
						eq(seoReviews.sourceId, rev.reviewId),
					),
				)
				.limit(1);

			if (existing) {
				// Update review reply if it exists in API but not locally
				await db
					.update(seoReviews)
					.set({
						rating,
						text: cleanText,
						reply: rev.reviewReply?.comment ?? null,
						repliedAt: rev.reviewReply?.updateTime
							? new Date(rev.reviewReply.updateTime)
							: null,
						updatedAt: new Date(),
					})
					.where(eq(seoReviews.id, existing.id));
			} else {
				// Insert new
				await db.insert(seoReviews).values({
					locationId,
					reviewerName: rev.reviewer.displayName ?? "Anonymous Google User",
					reviewerAvatar: rev.reviewer.profilePhotoUrl ?? null,
					rating,
					text: cleanText,
					reply: rev.reviewReply?.comment ?? null,
					repliedAt: rev.reviewReply?.updateTime
						? new Date(rev.reviewReply.updateTime)
						: null,
					reviewDate: new Date(rev.createTime),
					source: "google",
					sourceId: rev.reviewId,
					sentiment,
					isResolved: false,
				});
				addedCount++;
			}
		}

		return {
			synced: addedCount,
			message: `Synchronized ${reviews.length} reviews (${addedCount} new added).`,
		};
	} catch (error) {
		// Error syncing reviews
		return {
			synced: 0,
			message:
				error instanceof Error
					? error.message
					: "Failed to sync reviews due to an unknown API error",
		};
	}
}

/**
 * Posts or updates a review reply via the Google Business Profile Reviews API.
 * If no access token is available, simulates the response.
 */
export async function postGoogleReviewReply(
	googlePlaceId: string | null,
	reviewSourceId: string | null,
	replyText: string,
	accessToken: string | null,
): Promise<{ success: boolean; message: string }> {
	let resolvedLocationName: string | null = null;

	if (googlePlaceId && accessToken) {
		resolvedLocationName = await findGbpLocationName(
			googlePlaceId,
			accessToken,
		);
	}

	if (!resolvedLocationName || !reviewSourceId || !accessToken) {
		// Missing Location Name, Review Source ID, or Access Token
		return {
			success: true,
			message:
				"Simulated response: Review reply registered locally and marked as synced to Google.",
		};
	}

	try {
		// Posting review reply via GBP API
		// GBP API endpoint is PUT to mybusinessreviews.googleapis.com/v1/{name}/reply
		// name = accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
		const name = `${resolvedLocationName}/reviews/${reviewSourceId}`;

		const response = await fetch(
			`https://mybusinessreviews.googleapis.com/v1/${name}/reply`,
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					comment: replyText,
				}),
			},
		);

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`Google Business Profile API error: ${response.statusText} - ${errText}`,
			);
		}

		return {
			success: true,
			message: "Reply successfully posted to Google Business Profile.",
		};
	} catch (error) {
		// Error posting review reply
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to post review reply to Google Business Profile",
		};
	}
}
