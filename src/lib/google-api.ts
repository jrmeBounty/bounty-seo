import { and, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { account } from "#/db/schema";

/**
 * Gets a valid Google OAuth access token for a given user.
 * If the current token is expired or expiring in less than 5 minutes,
 * it uses the refresh token to request a new access token and updates the DB.
 */
export async function getGoogleAccessTokenForUser(
	userId: string,
): Promise<string | null> {
	// Find the google account details for this user
	const [googleAccount] = await db
		.select()
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, "google")))
		.limit(1);

	if (!googleAccount) {
		// No Google OAuth account found for user
		return null;
	}

	const accessToken = googleAccount.accessToken;
	const refreshToken = googleAccount.refreshToken;
	const expiresAt = googleAccount.accessTokenExpiresAt;

	if (!accessToken) {
		// Google account has no access token
		return null;
	}

	// If token expires in more than 5 minutes, return it
	const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
	const isExpired =
		!expiresAt || Date.now() + bufferMs >= new Date(expiresAt).getTime();

	if (!isExpired) {
		return accessToken;
	}

	// Token is expired or expiring soon, attempt to refresh it
	if (!refreshToken) {
		// Access token is expired but no refresh token is available
		// Try using current access token anyway as last resort
		return accessToken;
	}

	// Refreshing Google OAuth access token
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		// Missing OAuth credentials
		return accessToken; // Fall back to returning current token
	}

	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`Google token refresh failed: ${response.statusText} - ${errText}`,
			);
		}

		const data = (await response.json()) as {
			access_token: string;
			expires_in: number;
			scope?: string;
			id_token?: string;
		};

		const newAccessToken = data.access_token;
		const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

		// Update the database with the new token
		await db
			.update(account)
			.set({
				accessToken: newAccessToken,
				accessTokenExpiresAt: newExpiresAt,
				updatedAt: new Date(),
			})
			.where(eq(account.id, googleAccount.id));

		// Google OAuth access token refreshed successfully
		return newAccessToken;
	} catch (error) {
		// Error refreshing Google OAuth token - return the old token and hope for the best
		return accessToken;
	}
}
