/**
 * SentimentBadge Component
 *
 * Displays sentiment classification with color coding.
 * Memoized for performance optimization.
 */

import { memo } from "react";
import { Badge } from "./ui/badge";

interface SentimentBadgeProps {
	sentiment: "positive" | "neutral" | "negative";
}

const SENTIMENT_CONFIG = {
	positive: {
		className: "bg-green-100 text-green-700 border-green-200",
		label: "Positive",
	},
	neutral: {
		className: "bg-gray-100 text-gray-600 border-gray-200",
		label: "Neutral",
	},
	negative: {
		className: "bg-red-100 text-red-700 border-red-200",
		label: "Negative",
	},
} as const;

export const SentimentBadge = memo(function SentimentBadge({
	sentiment,
}: SentimentBadgeProps) {
	const config = SENTIMENT_CONFIG[sentiment];
	return (
		<Badge
			className={config.className}
			aria-label={`Sentiment: ${config.label}`}
		>
			{config.label}
		</Badge>
	);
});
