import * as Sentry from "@sentry/tanstackstart-react";
import * as cheerio from "cheerio";

/**
 * Website crawler for bountybasket.online SEO analysis
 */

export interface PageAnalysis {
	url: string;
	pageType: "home" | "category" | "product" | "blog" | "other";
	title: string | null;
	metaDescription: string | null;
	h1: string | null;
	h2Count: number;
	wordCount: number;
	isIndexable: boolean;
	hasCanonical: boolean;
	canonicalUrl: string | null;
	images: Array<{ src: string; alt: string | null; hasAlt: boolean }>;
	internalLinks: number;
	externalLinks: number;
	hasSchema: boolean;
	loadTime?: number;
}

export interface SEOIssue {
	issueType: "critical" | "warning" | "info";
	category:
		| "meta"
		| "content"
		| "technical"
		| "performance"
		| "mobile"
		| "accessibility";
	title: string;
	description: string;
	recommendation: string;
	severity: number; // 1-10
	impact: "high" | "medium" | "low";
}

/**
 * Fetch and parse HTML from a URL
 */
export async function fetchPage(url: string): Promise<string> {
	const startTime = Date.now();
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Bounty-SEO-Crawler/1.0 (SEO Analysis Bot)",
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch ${url}: ${response.status} ${response.statusText}`,
		);
	}

	const html = await response.text();
	const _loadTime = (Date.now() - startTime) / 1000; // seconds

	return html;
}

/**
 * Analyze page content and extract SEO data
 */
export function analyzePage(url: string, html: string): PageAnalysis {
	const $ = cheerio.load(html);

	// Remove script and style content from word count
	$("script, style, noscript").remove();

	// Extract metadata
	const title = $("title").first().text().trim() || null;
	const metaDescription =
		$('meta[name="description"]').attr("content")?.trim() || null;
	const h1 = $("h1").first().text().trim() || null;
	const h2Count = $("h2").length;

	// Word count (body text only)
	const bodyText = $("body").text();
	const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
	const wordCount = words.length;

	// Indexability
	const robotsMeta = $('meta[name="robots"]').attr("content") || "";
	const isIndexable = !robotsMeta.includes("noindex");

	// Canonical URL
	const hasCanonical = $('link[rel="canonical"]').length > 0;
	const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;

	// Images
	const images = $("img")
		.map((_i, el) => {
			const src = $(el).attr("src") || "";
			const alt = $(el).attr("alt")?.trim() || null;
			return { src, alt, hasAlt: !!alt };
		})
		.get();

	// Links
	const allLinks = $("a[href]");
	let internalLinks = 0;
	let externalLinks = 0;

	allLinks.each((_i, el) => {
		const href = $(el).attr("href") || "";
		if (href.startsWith("http")) {
			if (href.includes("bountybasket.online")) {
				internalLinks++;
			} else {
				externalLinks++;
			}
		} else if (href.startsWith("/") || !href.startsWith("#")) {
			internalLinks++;
		}
	});

	// Schema markup
	const hasSchema =
		$('script[type="application/ld+json"]').length > 0 ||
		$("[itemtype]").length > 0;

	// Determine page type from URL
	const pageType = determinePageType(url);

	return {
		url,
		pageType,
		title,
		metaDescription,
		h1,
		h2Count,
		wordCount,
		isIndexable,
		hasCanonical,
		canonicalUrl,
		images,
		internalLinks,
		externalLinks,
		hasSchema,
	};
}

/**
 * Detect SEO issues based on page analysis
 */
export function detectIssues(analysis: PageAnalysis): SEOIssue[] {
	const issues: SEOIssue[] = [];

	// Critical: Missing title
	if (!analysis.title) {
		issues.push({
			issueType: "critical",
			category: "meta",
			title: "Missing Title Tag",
			description: "This page does not have a <title> tag.",
			recommendation:
				"Add a unique, descriptive title tag (50-60 characters) that includes your target keyword.",
			severity: 10,
			impact: "high",
		});
	} else {
		// Warning: Title too short or too long
		const titleLength = analysis.title.length;
		if (titleLength < 30) {
			issues.push({
				issueType: "warning",
				category: "meta",
				title: "Title Tag Too Short",
				description: `Title is only ${titleLength} characters. Optimal length is 50-60 characters.`,
				recommendation:
					"Expand your title to include more descriptive keywords and context.",
				severity: 6,
				impact: "medium",
			});
		} else if (titleLength > 60) {
			issues.push({
				issueType: "warning",
				category: "meta",
				title: "Title Tag Too Long",
				description: `Title is ${titleLength} characters. It will be truncated in search results.`,
				recommendation:
					"Shorten your title to 50-60 characters for optimal display.",
				severity: 5,
				impact: "medium",
			});
		}
	}

	// Critical: Missing meta description
	if (!analysis.metaDescription) {
		issues.push({
			issueType: "critical",
			category: "meta",
			title: "Missing Meta Description",
			description:
				"This page does not have a meta description tag. This is crucial for search result snippets.",
			recommendation:
				"Add a compelling meta description (150-160 characters) that includes your target keyword and encourages clicks.",
			severity: 9,
			impact: "high",
		});
	} else {
		// Warning: Meta description too short or too long
		const metaLength = analysis.metaDescription.length;
		if (metaLength < 120) {
			issues.push({
				issueType: "warning",
				category: "meta",
				title: "Meta Description Too Short",
				description: `Meta description is only ${metaLength} characters. Optimal length is 150-160 characters.`,
				recommendation: "Expand your meta description to provide more context.",
				severity: 5,
				impact: "medium",
			});
		} else if (metaLength > 160) {
			issues.push({
				issueType: "info",
				category: "meta",
				title: "Meta Description Too Long",
				description: `Meta description is ${metaLength} characters. It will be truncated in search results.`,
				recommendation:
					"Shorten your meta description to 150-160 characters for optimal display.",
				severity: 3,
				impact: "low",
			});
		}
	}

	// Critical: Missing H1
	if (!analysis.h1) {
		issues.push({
			issueType: "critical",
			category: "content",
			title: "Missing H1 Heading",
			description: "This page does not have an H1 tag.",
			recommendation:
				"Add a single, descriptive H1 heading that clearly describes the page content and includes your target keyword.",
			severity: 8,
			impact: "high",
		});
	}

	// Warning: Low word count
	if (analysis.wordCount < 300) {
		issues.push({
			issueType: "warning",
			category: "content",
			title: "Thin Content",
			description: `Page has only ${analysis.wordCount} words. Pages with more content tend to rank better.`,
			recommendation:
				"Add more descriptive, valuable content (aim for 800+ words for important pages). Include relevant keywords naturally.",
			severity: 6,
			impact: "medium",
		});
	}

	// Warning: Few H2 headings
	if (analysis.h2Count === 0 && analysis.wordCount > 300) {
		issues.push({
			issueType: "warning",
			category: "content",
			title: "No Subheadings (H2)",
			description: "This page has no H2 tags to structure the content.",
			recommendation:
				"Break up your content with H2 subheadings. This improves readability and SEO.",
			severity: 4,
			impact: "medium",
		});
	}

	// Critical: Not indexable
	if (!analysis.isIndexable) {
		issues.push({
			issueType: "critical",
			category: "technical",
			title: "Page Not Indexable",
			description:
				'This page has a "noindex" directive in the robots meta tag.',
			recommendation:
				'Remove the "noindex" directive unless you intentionally want to hide this page from search engines.',
			severity: 10,
			impact: "high",
		});
	}

	// Warning: Missing canonical URL
	if (!analysis.hasCanonical) {
		issues.push({
			issueType: "warning",
			category: "technical",
			title: "Missing Canonical URL",
			description: "This page does not have a canonical URL tag.",
			recommendation:
				"Add a <link rel='canonical'> tag to prevent duplicate content issues.",
			severity: 5,
			impact: "medium",
		});
	}

	// Accessibility: Images without alt text
	const imagesWithoutAlt = analysis.images.filter((img) => !img.hasAlt);
	if (imagesWithoutAlt.length > 0) {
		issues.push({
			issueType: "warning",
			category: "accessibility",
			title: "Images Missing Alt Text",
			description: `${imagesWithoutAlt.length} image(s) are missing alt text.`,
			recommendation:
				"Add descriptive alt text to all images for accessibility and SEO. Include keywords where relevant.",
			severity: 6,
			impact: "medium",
		});
	}

	// Info: No schema markup
	if (!analysis.hasSchema) {
		issues.push({
			issueType: "info",
			category: "technical",
			title: "Missing Schema Markup",
			description:
				"This page does not have structured data (schema.org markup).",
			recommendation:
				"Add JSON-LD schema markup (e.g., Product, Breadcrumb, Organization) to enhance search result appearance.",
			severity: 3,
			impact: "low",
		});
	}

	// Warning: Few internal links
	if (analysis.internalLinks < 2) {
		issues.push({
			issueType: "info",
			category: "content",
			title: "Few Internal Links",
			description: `This page has only ${analysis.internalLinks} internal link(s).`,
			recommendation:
				"Add more internal links to related pages/products to improve site navigation and SEO.",
			severity: 3,
			impact: "low",
		});
	}

	return issues;
}

/**
 * Calculate SEO scores
 */
export function calculateScores(
	_analysis: PageAnalysis,
	issues: SEOIssue[],
): {
	seoScore: number;
	contentScore: number;
	technicalScore: number;
} {
	// Start with perfect scores
	let contentScore = 100;
	let technicalScore = 100;

	// Deduct points for each issue
	for (const issue of issues) {
		const penalty = issue.severity * 2; // Max 20 points per issue

		if (["meta", "content", "accessibility"].includes(issue.category)) {
			contentScore -= penalty;
		} else {
			technicalScore -= penalty;
		}
	}

	// Ensure scores don't go below 0
	contentScore = Math.max(0, contentScore);
	technicalScore = Math.max(0, technicalScore);

	// Overall SEO score is weighted average
	const seoScore = Math.round(contentScore * 0.6 + technicalScore * 0.4);

	return {
		seoScore,
		contentScore,
		technicalScore,
	};
}

/**
 * Determine page type from URL
 */
function determinePageType(
	url: string,
): "home" | "category" | "product" | "blog" | "other" {
	const urlObj = new URL(url);
	const pathname = urlObj.pathname;

	if (pathname === "/" || pathname === "") {
		return "home";
	}

	if (pathname.includes("/blog/") || pathname.includes("/article/")) {
		return "blog";
	}

	if (pathname.includes("/category/") || pathname.match(/^\/[^/]+\/?$/)) {
		return "category";
	}

	if (pathname.includes("/product/") || pathname.match(/^\/[^/]+\/[^/]+\/?$/)) {
		return "product";
	}

	return "other";
}

/**
 * Full page crawl and analysis
 */
export async function crawlAndAnalyze(url: string): Promise<{
	analysis: PageAnalysis;
	issues: SEOIssue[];
	scores: ReturnType<typeof calculateScores>;
}> {
	return Sentry.startSpan(
		{ name: "website-crawler.crawlAndAnalyze", attributes: { url } },
		async () => {
			const html = await fetchPage(url);
			const analysis = analyzePage(url, html);
			const issues = detectIssues(analysis);
			const scores = calculateScores(analysis, issues);

			return { analysis, issues, scores };
		},
	);
}
