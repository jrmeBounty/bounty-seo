/**
 * Ranking checker utility using the Google Places API.
 * Converts keywords into local search ranks by querying Google Places Text Search.
 */

interface PlacesSearchResponse {
	places?: Array<{
		id: string;
		displayName?: {
			text: string;
			languageCode?: string;
		};
		formattedAddress?: string;
	}>;
}

/**
 * Checks the local SEO rank of a specific Place ID for a search term.
 * If the API key is missing, it runs a deterministic simulation for demo/dev purposes.
 */
export async function getPlaceRanking(
	keyword: string,
	googlePlaceId: string | null,
	locationName: string,
): Promise<{ position: number | null; source: string; message: string }> {
	const apiKey =
		process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API;

	if (!apiKey) {
		// API Key not configured — run a simulated rank check so the app is functional.
		console.warn(
			`[Google Maps API] GOOGLE_MAPS_API_KEY is not set. Simulating ranking for "${keyword}"...`,
		);

		// Deterministic mock position based on keyword characters and location name length
		const combined = (keyword + locationName).toLowerCase();
		let hash = 0;
		for (let i = 0; i < combined.length; i++) {
			hash = (hash << 5) - hash + combined.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		const mockPosition = Math.abs(hash % 9) + 1; // Rank between 1 and 9

		return {
			position: mockPosition,
			source: "google_maps_simulated",
			message: "Simulated rank check (no API key configured)",
		};
	}

	if (!googlePlaceId) {
		return {
			position: null,
			source: "google_maps",
			message: "Failed: Location has no google_place_id configured",
		};
	}

	try {
		console.log(
			`[Google Maps API] Fetching real rank for "${keyword}" using Places API...`,
		);

		const response = await fetch(
			"https://places.googleapis.com/v1/places:searchText",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": apiKey,
					// We need the ID to match against googlePlaceId
					"X-Goog-FieldMask":
						"places.id,places.displayName,places.formattedAddress",
				},
				body: JSON.stringify({
					textQuery: keyword,
					pageSize: 20, // Check top 20 results
					// Bias towards Kenya to get local results
					locationBias: {
						circle: {
							center: {
								latitude: -0.3, // Nakuru, Kenya area
								longitude: 36.08,
							},
							radius: 50000.0, // 50km radius
						},
					},
				}),
			},
		);

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`Google Places API error: ${response.statusText} - ${errText}`,
			);
		}

		const data = (await response.json()) as PlacesSearchResponse;
		const places = data.places ?? [];

		if (places.length === 0) {
			return {
				position: null,
				source: "google_maps",
				message: "No places returned in search results",
			};
		}

		// Search for the place ID in the list of results
		const rankIndex = places.findIndex((p) => p.id === googlePlaceId);

		if (rankIndex === -1) {
			return {
				position: null, // Outside top 20
				source: "google_maps",
				message: `Business not found in top ${places.length} search results`,
			};
		}

		const rankPosition = rankIndex + 1;
		return {
			position: rankPosition,
			source: "google_maps",
			message: `Found at position ${rankPosition} of ${places.length} results`,
		};
	} catch (error) {
		console.error(
			`[Google Maps API] Error checking ranking for "${keyword}":`,
			error,
		);
		return {
			position: null,
			source: "google_maps",
			message:
				error instanceof Error
					? error.message
					: "Unknown error during rank check",
		};
	}
}
