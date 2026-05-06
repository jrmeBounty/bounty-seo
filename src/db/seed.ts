/**
 * Seed script — Bounty Supermarket SEO Tracker
 * Run: bun run db:seed
 *
 * Inserts realistic demo data for all 4 branches:
 *   Nairobi CBD · Westlands · Mombasa · Kisumu
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

config({ path: [".env.local", ".env"] });

const db = drizzle(process.env.DATABASE_URL!, { schema });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD string for `daysAgo` days before today */
function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString().split("T")[0];
}

/** Returns a Date for `daysAgo` days before today */
function dateAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d;
}

async function seed() {
	console.log("\n🌱  Seeding Bounty Supermarket SEO Tracker database…\n");

	// ─── 1. Clear existing SEO data (cascade order) ───────────────────────────
	console.log("🗑   Clearing existing SEO data…");
	await db.delete(schema.seoCitations);
	await db.delete(schema.seoReviews);
	await db.delete(schema.seoRankingSnapshots);
	await db.delete(schema.seoKeywords);
	await db.delete(schema.seoLocations);

	// ─── 2. Locations ─────────────────────────────────────────────────────────
	console.log("📍  Inserting locations…");
	const [nairobiCbd, westlands, mombasa, kisumu] = await db
		.insert(schema.seoLocations)
		.values([
			{
				name: "Bounty Supermarket — Nairobi CBD",
				address: "23 Tom Mboya Street, Nairobi CBD",
				city: "Nairobi",
				country: "Kenya",
				phone: "+254 20 222 1234",
				website: "https://bountysupermarket.co.ke",
				isActive: true,
			},
			{
				name: "Bounty Supermarket — Westlands",
				address: "15 Westlands Road, Westlands",
				city: "Nairobi",
				country: "Kenya",
				phone: "+254 20 374 5678",
				website: "https://bountysupermarket.co.ke",
				isActive: true,
			},
			{
				name: "Bounty Supermarket — Mombasa",
				address: "34 Moi Avenue, Mombasa CBD",
				city: "Mombasa",
				country: "Kenya",
				phone: "+254 41 223 4567",
				website: "https://bountysupermarket.co.ke",
				isActive: true,
			},
			{
				name: "Bounty Supermarket — Kisumu",
				address: "8 Oginga Odinga Street, Kisumu",
				city: "Kisumu",
				country: "Kenya",
				phone: "+254 57 202 4321",
				website: "https://bountysupermarket.co.ke",
				isActive: true,
			},
		])
		.returning();

	console.log(`   ✅ ${4} locations`);

	// ─── 3. Keywords ──────────────────────────────────────────────────────────
	console.log("🔑  Inserting keywords…");
	const keywords = await db
		.insert(schema.seoKeywords)
		.values([
			// Nairobi CBD — 6 keywords
			{
				locationId: nairobiCbd.id,
				term: "supermarket near me nairobi",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: nairobiCbd.id,
				term: "bounty supermarket nairobi",
				category: "branded",
				targetPosition: 1,
			},
			{
				locationId: nairobiCbd.id,
				term: "grocery store nairobi cbd",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: nairobiCbd.id,
				term: "cheap groceries nairobi",
				category: "category",
				targetPosition: 5,
			},
			{
				locationId: nairobiCbd.id,
				term: "fresh produce nairobi",
				category: "category",
				targetPosition: 3,
			},
			{
				locationId: nairobiCbd.id,
				term: "supermarket deals kenya",
				category: "category",
				targetPosition: 5,
			},

			// Westlands — 6 keywords
			{
				locationId: westlands.id,
				term: "supermarket westlands nairobi",
				category: "local",
				targetPosition: 2,
			},
			{
				locationId: westlands.id,
				term: "bounty supermarket westlands",
				category: "branded",
				targetPosition: 1,
			},
			{
				locationId: westlands.id,
				term: "grocery store westlands",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: westlands.id,
				term: "best supermarket westlands",
				category: "category",
				targetPosition: 3,
			},
			{
				locationId: westlands.id,
				term: "weekly specials supermarket nairobi",
				category: "category",
				targetPosition: 5,
			},
			{
				locationId: westlands.id,
				term: "fresh meat westlands nairobi",
				category: "category",
				targetPosition: 5,
			},

			// Mombasa — 5 keywords
			{
				locationId: mombasa.id,
				term: "supermarket mombasa",
				category: "local",
				targetPosition: 2,
			},
			{
				locationId: mombasa.id,
				term: "bounty supermarket mombasa",
				category: "branded",
				targetPosition: 1,
			},
			{
				locationId: mombasa.id,
				term: "grocery store mombasa",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: mombasa.id,
				term: "supermarket coast kenya",
				category: "category",
				targetPosition: 5,
			},
			{
				locationId: mombasa.id,
				term: "cheap groceries mombasa",
				category: "category",
				targetPosition: 5,
			},

			// Kisumu — 5 keywords
			{
				locationId: kisumu.id,
				term: "supermarket kisumu",
				category: "local",
				targetPosition: 2,
			},
			{
				locationId: kisumu.id,
				term: "bounty supermarket kisumu",
				category: "branded",
				targetPosition: 1,
			},
			{
				locationId: kisumu.id,
				term: "grocery store kisumu",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: kisumu.id,
				term: "supermarket western kenya",
				category: "local",
				targetPosition: 3,
			},
			{
				locationId: kisumu.id,
				term: "fresh vegetables kisumu",
				category: "category",
				targetPosition: 5,
			},
		])
		.returning();

	console.log(`   ✅ ${keywords.length} keywords`);

	// ─── 4. Ranking Snapshots (10 weekly snapshots per keyword) ───────────────
	console.log("📊  Inserting ranking snapshots (10 weeks × 22 keywords)…");

	const BASE: Record<string, number> = {
		branded: 1,
		local: 4,
		category: 6,
		competitor: 8,
	};
	const snapshots = [];
	for (const kw of keywords) {
		const base = BASE[kw.category ?? "local"];
		for (let week = 9; week >= 0; week--) {
			const improvement = Math.floor((9 - week) * 0.3);
			const noise = Math.floor(Math.random() * 3) - 1;
			const pos = Math.max(1, base - improvement + noise);
			snapshots.push({
				keywordId: kw.id,
				locationId: kw.locationId!,
				position: pos,
				snapshotDate: daysAgo(week * 7),
				source: "google_maps" as const,
			});
		}
	}

	for (let i = 0; i < snapshots.length; i += 100) {
		await db
			.insert(schema.seoRankingSnapshots)
			.values(snapshots.slice(i, i + 100));
	}
	console.log(`   ✅ ${snapshots.length} snapshots`);

	// ─── 5. Reviews ───────────────────────────────────────────────────────────
	console.log("⭐  Inserting reviews…");
	await db.insert(schema.seoReviews).values([
		// Nairobi CBD (5)
		{
			locationId: nairobiCbd.id,
			reviewerName: "Wanjiku Kamau",
			rating: 5,
			text: "Amazing selection of fresh produce! Best supermarket in Nairobi CBD. The prices are very fair and staff are always helpful.",
			reviewDate: dateAgo(1),
			source: "google",
			sentiment: "positive",
			isResolved: false,
		},
		{
			locationId: nairobiCbd.id,
			reviewerName: "James Otieno",
			rating: 4,
			text: "Good variety of products at affordable prices. The meat section is always fresh. Will definitely come back.",
			reviewDate: dateAgo(3),
			source: "google",
			sentiment: "positive",
			isResolved: false,
		},
		{
			locationId: nairobiCbd.id,
			reviewerName: "Amina Said",
			rating: 2,
			text: "Long queues at the checkout during lunch hour. Management should consider opening more tills during peak times.",
			reviewDate: dateAgo(7),
			source: "google",
			sentiment: "negative",
			isResolved: false,
		},
		{
			locationId: nairobiCbd.id,
			reviewerName: "Peter Kimani",
			rating: 5,
			text: "The weekly specials are unbeatable! I save a lot doing my shopping here. Clean environment and friendly staff.",
			reviewDate: dateAgo(12),
			source: "facebook",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: nairobiCbd.id,
			reviewerName: "Grace Njeri",
			rating: 3,
			text: "Average experience. Products are good but the parking situation needs improvement. Hope they fix this soon.",
			reviewDate: dateAgo(20),
			source: "google",
			sentiment: "neutral",
			isResolved: false,
		},

		// Westlands (4)
		{
			locationId: westlands.id,
			reviewerName: "Kipchoge Rotich",
			rating: 5,
			text: "This Bounty branch in Westlands is my favourite! Great deals every week and the fresh bakery section is outstanding.",
			reviewDate: dateAgo(2),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: westlands.id,
			reviewerName: "Fatuma Hassan",
			rating: 5,
			text: "Excellent service! Staff went out of their way to help me find what I needed. Very clean and well organised.",
			reviewDate: dateAgo(5),
			source: "facebook",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: westlands.id,
			reviewerName: "Samuel Odhiambo",
			rating: 4,
			text: "Really good supermarket. The Westlands branch always has everything in stock. Slightly pricier than others but quality justifies it.",
			reviewDate: dateAgo(9),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: westlands.id,
			reviewerName: "Lucy Wanjiru",
			rating: 2,
			text: "Checkout took 30 minutes on a Saturday. They really need more cashiers on weekends. Otherwise products are great.",
			reviewDate: dateAgo(15),
			source: "google",
			sentiment: "negative",
			isResolved: false,
		},

		// Mombasa (5)
		{
			locationId: mombasa.id,
			reviewerName: "Aisha Mwenda",
			rating: 5,
			text: "Bounty Supermarket Mombasa is the best in Coast region! Affordable prices and great range of both local and imported goods.",
			reviewDate: dateAgo(2),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: mombasa.id,
			reviewerName: "David Mutua",
			rating: 4,
			text: "Good supermarket with friendly staff. The fresh seafood section is a great addition. Very convenient location on Moi Avenue.",
			reviewDate: dateAgo(6),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: mombasa.id,
			reviewerName: "Mercy Njoki",
			rating: 5,
			text: "I love shopping here! Always clean, well-stocked and the prices are competitive. My family's go-to supermarket in Mombasa.",
			reviewDate: dateAgo(10),
			source: "facebook",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: mombasa.id,
			reviewerName: "Hassan Omar",
			rating: 3,
			text: "Average experience. The air conditioning was not working on my last visit which made shopping uncomfortable in the heat.",
			reviewDate: dateAgo(14),
			source: "google",
			sentiment: "neutral",
			isResolved: false,
		},
		{
			locationId: mombasa.id,
			reviewerName: "Beatrice Wekesa",
			rating: 1,
			text: "Very disappointed. Was overcharged at the till and when I raised it the cashier was rude. Management needs to address staff attitude.",
			reviewDate: dateAgo(18),
			source: "google",
			sentiment: "negative",
			isResolved: false,
		},

		// Kisumu (4)
		{
			locationId: kisumu.id,
			reviewerName: "Moses Kariuki",
			rating: 5,
			text: "Best supermarket in Kisumu! Great prices on fresh produce and the staff are always smiling and helpful.",
			reviewDate: dateAgo(3),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: kisumu.id,
			reviewerName: "Esther Achieng",
			rating: 4,
			text: "Good shopping experience overall. The variety has improved a lot recently. Happy to see more Kenyan-made products on the shelves.",
			reviewDate: dateAgo(8),
			source: "facebook",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: kisumu.id,
			reviewerName: "John Mwangi",
			rating: 5,
			text: "Bounty in Kisumu never disappoints. Clean, well-organised and competitive prices. The loyalty card program saves me money every week.",
			reviewDate: dateAgo(11),
			source: "google",
			sentiment: "positive",
			isResolved: true,
		},
		{
			locationId: kisumu.id,
			reviewerName: "Mary Otieno",
			rating: 3,
			text: "The location is convenient but the shop can get crowded on weekends. More space and wider aisles would improve the experience.",
			reviewDate: dateAgo(22),
			source: "google",
			sentiment: "neutral",
			isResolved: false,
		},
	]);
	console.log("   ✅ 18 reviews");

	// ─── 6. Citations ─────────────────────────────────────────────────────────
	console.log("🔗  Inserting citations…");
	await db.insert(schema.seoCitations).values([
		// Nairobi CBD (3)
		{
			locationId: nairobiCbd.id,
			directoryName: "Google Business Profile",
			directoryUrl: "https://business.google.com",
			listingUrl: "https://g.page/bounty-nairobi-cbd",
			listedName: "Bounty Supermarket",
			listedAddress: "23 Tom Mboya Street, Nairobi CBD",
			listedPhone: "+254 20 222 1234",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},
		{
			locationId: nairobiCbd.id,
			directoryName: "Facebook Business",
			directoryUrl: "https://facebook.com",
			listingUrl: "https://facebook.com/bountysupermarketke",
			listedName: "Bounty Supermarket Kenya",
			listedAddress: "23 Tom Mboya Street",
			listedPhone: "+254 20 222 1234",
			nameMatch: true,
			addressMatch: false,
			phoneMatch: true,
			websiteMatch: false,
			napScore: 63,
			status: "incorrect",
			lastChecked: new Date(),
		},
		{
			locationId: nairobiCbd.id,
			directoryName: "Kenya Yellow Pages",
			directoryUrl: "https://yellowpages.co.ke",
			listingUrl: "https://yellowpages.co.ke/bounty-supermarket",
			listedName: "Bounty Supermarket",
			listedAddress: "23 Tom Mboya Street, Nairobi",
			listedPhone: null,
			nameMatch: true,
			addressMatch: true,
			phoneMatch: false,
			websiteMatch: true,
			napScore: 82,
			status: "incorrect",
			lastChecked: new Date(),
		},

		// Westlands (3)
		{
			locationId: westlands.id,
			directoryName: "Google Business Profile",
			directoryUrl: "https://business.google.com",
			listingUrl: "https://g.page/bounty-westlands",
			listedName: "Bounty Supermarket",
			listedAddress: "15 Westlands Road, Westlands",
			listedPhone: "+254 20 374 5678",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},
		{
			locationId: westlands.id,
			directoryName: "Apple Maps Connect",
			directoryUrl: "https://mapsconnect.apple.com",
			listingUrl: null,
			listedName: "Bounty Supermarket",
			listedAddress: "15 Westlands Road, Westlands",
			listedPhone: "+254 20 374 5678",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},
		{
			locationId: westlands.id,
			directoryName: "Bing Places",
			directoryUrl: "https://bingplaces.com",
			listingUrl: "https://bing.com/local/bounty-westlands",
			listedName: "Bounty Supermarket Westlands",
			listedAddress: "15 Westlands Rd",
			listedPhone: "+254 20 374 5678",
			nameMatch: true,
			addressMatch: false,
			phoneMatch: true,
			websiteMatch: false,
			napScore: 63,
			status: "incorrect",
			lastChecked: new Date(),
		},

		// Mombasa (3)
		{
			locationId: mombasa.id,
			directoryName: "Google Business Profile",
			directoryUrl: "https://business.google.com",
			listingUrl: "https://g.page/bounty-mombasa",
			listedName: "Bounty Supermarket",
			listedAddress: "34 Moi Avenue, Mombasa CBD",
			listedPhone: "+254 41 223 4567",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},
		{
			locationId: mombasa.id,
			directoryName: "TripAdvisor",
			directoryUrl: "https://tripadvisor.com",
			listingUrl: null,
			listedName: null,
			listedAddress: null,
			listedPhone: null,
			nameMatch: false,
			addressMatch: false,
			phoneMatch: false,
			websiteMatch: false,
			napScore: 0,
			status: "missing",
			lastChecked: new Date(),
		},
		{
			locationId: mombasa.id,
			directoryName: "Kenya National Chamber of Commerce",
			directoryUrl: "https://kencc.co.ke",
			listingUrl: "https://kencc.co.ke/members/bounty",
			listedName: "Bounty Supermarket",
			listedAddress: "34 Moi Avenue, Mombasa CBD",
			listedPhone: "+254 41 223 4567",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},

		// Kisumu (3)
		{
			locationId: kisumu.id,
			directoryName: "Google Business Profile",
			directoryUrl: "https://business.google.com",
			listingUrl: "https://g.page/bounty-kisumu",
			listedName: "Bounty Supermarket",
			listedAddress: "8 Oginga Odinga Street, Kisumu",
			listedPhone: "+254 57 202 4321",
			nameMatch: true,
			addressMatch: true,
			phoneMatch: true,
			websiteMatch: true,
			napScore: 100,
			status: "active",
			lastChecked: new Date(),
		},
		{
			locationId: kisumu.id,
			directoryName: "Foursquare",
			directoryUrl: "https://foursquare.com",
			listingUrl: "https://foursquare.com/v/bounty-kisumu",
			listedName: "Bounty Supermarket Kisumu",
			listedAddress: "8 Oginga Odinga St",
			listedPhone: null,
			nameMatch: true,
			addressMatch: false,
			phoneMatch: false,
			websiteMatch: false,
			napScore: 38,
			status: "incorrect",
			lastChecked: new Date(),
		},
		{
			locationId: kisumu.id,
			directoryName: "Yelp",
			directoryUrl: "https://yelp.com",
			listingUrl: null,
			listedName: null,
			listedAddress: null,
			listedPhone: null,
			nameMatch: false,
			addressMatch: false,
			phoneMatch: false,
			websiteMatch: false,
			napScore: 0,
			status: "missing",
			lastChecked: new Date(),
		},
	]);
	console.log("   ✅ 12 citations");

	// ─── Done ─────────────────────────────────────────────────────────────────
	console.log("\n🎉  Seed complete!");
	console.log("    Locations : 4");
	console.log(`    Keywords  : ${keywords.length}`);
	console.log(`    Snapshots : ${snapshots.length}`);
	console.log("    Reviews   : 18");
	console.log("    Citations : 12");
	console.log("\nRun `bun run dev` and open http://localhost:3000\n");
	process.exit(0);
}

seed().catch((err) => {
	console.error("\n❌  Seed failed:\n", err);
	process.exit(1);
});
