#!/usr/bin/env tsx

/**
 * Website Crawler Script for bountybasket.online
 * 
 * Usage:
 *   bun run scripts/crawl-website.ts <url>
 *   bun run scripts/crawl-website.ts --full  (crawl entire site)
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import {
	seoPages,
	seoIssues,
	seoAuditHistory,
} from "../src/db/schema";
import { crawlAndAnalyze } from "../src/lib/website-crawler";
import { eq } from "drizzle-orm";

// Load env vars
config({ path: [".env.local", ".env"] });

const db = drizzle(process.env.DATABASE_URL!, {
	schema: { seoPages, seoIssues, seoAuditHistory },
});

const BASE_URL = "https://bountybasket.online";

/**
 * Common pages to crawl on an ecommerce site
 */
const COMMON_PAGES = [
	"/",
	"/about",
	"/contact",
	"/shop",
	"/cart",
	"/checkout",
	"/privacy-policy",
	"/terms-of-service",
	"/faq",
	"/blog",
];

async function crawlSinglePage(url: string) {
	console.log(`\n🔍 Crawling: ${url}`);

	try {
		const { analysis, issues, scores } = await crawlAndAnalyze(url);

		console.log(`✅ Analysis complete:`);
		console.log(`   - Title: ${analysis.title || "MISSING"}`);
		console.log(`   - Meta Description: ${analysis.metaDescription ? "✓" : "✗ MISSING"}`);
		console.log(`   - H1: ${analysis.h1 || "✗ MISSING"}`);
		console.log(`   - Word Count: ${analysis.wordCount}`);
		console.log(`   - Images: ${analysis.images.length} (${analysis.images.filter(i => !i.hasAlt).length} missing alt)`);
		console.log(`   - SEO Score: ${scores.seoScore}/100`);
		console.log(`   - Issues Found: ${issues.length}`);

		// Check if page exists in database
		const [existingPage] = await db
			.select()
			.from(seoPages)
			.where(eq(seoPages.url, url))
			.limit(1);

		let pageId: number;

		if (existingPage) {
			// Update existing page
			console.log(`   - Updating existing page in database...`);
			const [updated] = await db
				.update(seoPages)
				.set({
					title: analysis.title,
					metaDescription: analysis.metaDescription,
					h1: analysis.h1,
					wordCount: analysis.wordCount,
					isIndexable: analysis.isIndexable,
					hasCanonical: analysis.hasCanonical,
					canonicalUrl: analysis.canonicalUrl,
					seoScore: scores.seoScore,
					contentScore: scores.contentScore,
					technicalScore: scores.technicalScore,
					lastCrawled: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(seoPages.id, existingPage.id))
				.returning();
			pageId = updated.id;
		} else {
			// Insert new page
			console.log(`   - Inserting new page into database...`);
			const [inserted] = await db
				.insert(seoPages)
				.values({
					url,
					pageType: analysis.pageType,
					title: analysis.title,
					metaDescription: analysis.metaDescription,
					h1: analysis.h1,
					wordCount: analysis.wordCount,
					isIndexable: analysis.isIndexable,
					hasCanonical: analysis.hasCanonical,
					canonicalUrl: analysis.canonicalUrl,
					seoScore: scores.seoScore,
					contentScore: scores.contentScore,
					technicalScore: scores.technicalScore,
					lastCrawled: new Date(),
				})
				.returning();
			pageId = inserted.id;
		}

		// Delete old issues for this page
		await db.delete(seoIssues).where(eq(seoIssues.pageId, pageId));

		// Insert new issues
		if (issues.length > 0) {
			console.log(`   - Saving ${issues.length} SEO issues...`);
			await db.insert(seoIssues).values(
				issues.map((issue) => ({
					pageId,
					issueType: issue.issueType,
					category: issue.category,
					title: issue.title,
					description: issue.description,
					recommendation: issue.recommendation,
					severity: issue.severity,
					impact: issue.impact,
				})),
			);
		}

		console.log(`✅ Page saved successfully! (ID: ${pageId})`);

		return { pageId, issuesCount: issues.length, score: scores.seoScore };
	} catch (error) {
		console.error(`❌ Failed to crawl ${url}:`, error);
		return null;
	}
}

async function crawlMultiplePages(urls: string[]) {
	console.log(`\n🚀 Starting site crawl...`);
	console.log(`📄 Pages to crawl: ${urls.length}\n`);

	const startTime = Date.now();
	const results = [];

	for (const url of urls) {
		const result = await crawlSinglePage(url);
		if (result) {
			results.push(result);
		}
		// Small delay to avoid overwhelming the server
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	const duration = Math.round((Date.now() - startTime) / 1000);
	const totalIssues = results.reduce((sum, r) => sum + r.issuesCount, 0);
	const avgScore = Math.round(
		results.reduce((sum, r) => sum + r.score, 0) / results.length,
	);

	console.log(`\n✅ Crawl Complete!`);
	console.log(`   - Pages Analyzed: ${results.length}/${urls.length}`);
	console.log(`   - Total Issues Found: ${totalIssues}`);
	console.log(`   - Average SEO Score: ${avgScore}/100`);
	console.log(`   - Duration: ${duration}s`);

	// Save audit history
	await db.insert(seoAuditHistory).values({
		auditType: "full",
		overallScore: avgScore,
		pagesAnalyzed: results.length,
		issuesFound: totalIssues,
		duration,
		startedAt: new Date(Date.now() - duration * 1000),
		completedAt: new Date(),
	});

	console.log(`\n📊 Visit http://localhost:3000/website to view results`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
	console.log(`
Usage:
  bun run scripts/crawl-website.ts <url>          Crawl a single page
  bun run scripts/crawl-website.ts --full         Crawl common ecommerce pages
  bun run scripts/crawl-website.ts --homepage     Crawl homepage only

Examples:
  bun run scripts/crawl-website.ts https://bountybasket.online
  bun run scripts/crawl-website.ts --full
	`);
	process.exit(0);
}

if (args[0] === "--full") {
	const urls = COMMON_PAGES.map((path) => `${BASE_URL}${path}`);
	crawlMultiplePages(urls)
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Fatal error:", err);
			process.exit(1);
		});
} else if (args[0] === "--homepage") {
	crawlSinglePage(BASE_URL)
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Fatal error:", err);
			process.exit(1);
		});
} else {
	const url = args[0];
	if (!url.startsWith("http")) {
		console.error("❌ Error: URL must start with http:// or https://");
		process.exit(1);
	}
	crawlSinglePage(url)
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Fatal error:", err);
			process.exit(1);
		});
}
