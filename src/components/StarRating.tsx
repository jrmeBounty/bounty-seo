/**
 * StarRating Component
 *
 * Displays a 5-star rating with memoization for performance.
 * Used in Dashboard and Reviews pages.
 */

import { Star } from "lucide-react";
import { memo } from "react";

interface StarRatingProps {
	rating: number;
	size?: number;
}

export const StarRating = memo(function StarRating({
	rating,
	size = 12,
}: StarRatingProps) {
	return (
		<div
			className="flex gap-0.5"
			role="img"
			aria-label={`${rating} out of 5 stars`}
		>
			{Array.from({ length: 5 }, (_, i) => (
				<Star
					key={i}
					size={size}
					className={
						i < rating
							? "fill-[#D4A017] text-[#D4A017]"
							: "fill-gray-200 text-gray-200"
					}
					aria-hidden="true"
				/>
			))}
		</div>
	);
});
