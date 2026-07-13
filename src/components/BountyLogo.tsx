interface BountyLogoProps {
	/** Diameter in pixels */
	size?: number;
	className?: string;
}

/** Renders the Bounty Supermarket cart logo from /public */
export function BountyLogo({ size = 40, className = "" }: BountyLogoProps) {
	return (
		<img
			src="/BOUNTY_CART_YELLOW.svg"
			alt="Bounty Supermarket"
			width={size}
			height={size}
			className={`shrink-0 ${className}`}
			style={{ width: size, height: size }}
		/>
	);
}
