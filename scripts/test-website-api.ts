#!/usr/bin/env tsx

/**
 * Test Website SEO API endpoints
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { seoPages, seoIssues } from "../src/db/schema";

// Load env vars
config({ path: [".env.local", ".env"] });

const db = drizzle(process.env.DATABASE_URL!, {
	schema: { seoPages, seoIssues },
});

async function testAPI() {
	console.log("\n🧪 Testing Website SEO API...\n");

	try {
		// Test 1: Fetch all pages
		console.log("1️⃣  Fetching all pages...");
		const pages = await db.select().from(seoPages);
		console.log(`   ✅ Found ${pages.length} page(s)`);
		
		if (pages.length > 0) {
			const page = pages[0];
			console.log(`   - Page ID: ${page.id}`);
			console.log(`   - URL: ${page.url}`);
			console.log(`   - Title: ${page.title}`);
			console.log(`   - SEO Score: ${page.seoScore}/100`);
		}

		// Test 2: Fetch issues
		console.log("\n2️⃣  Fetching all issues...");
		const issues = await db.select().from(seoIssues);
		console.log(`   ✅ Found ${issues.length} issue(s)`);
		
		if (issues.length > 0) {
			const criticalIssues = issues.filter(i => i.issueType === "critical");
			const warningIssues = issues.filter(i => i.issueType === "warning");
			const infoIssues = issues.filter(i => i.issueType === "info");
			
			console.log(`   - Critical: ${criticalIssues.length}`);
			console.log(`   - Warnings: ${warningIssues.length}`);
			console.log(`   - Info: ${infoIssues.length}`);
		}

		console.log("\n✅ API test complete! Database is working correctly.\n");
		console.log("📊 Visit http://localhost:3000/website to view the dashboard\n");

	} catch (error) {
		console.error("❌ API test failed:", error);
		process.exit(1);
	}
}

testAPI()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Fatal error:", err);
		process.exit(1);
	});
