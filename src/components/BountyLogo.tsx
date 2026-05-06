interface BountyLogoProps {
	/** Diameter in pixels (logo is circular) */
	size?: number;
	className?: string;
}

/** Renders the Bounty Supermarket circular logo from /public */
export function BountyLogo({ size = 40, className = "" }: BountyLogoProps) {
	return (
		<img
			src="/bounty picture.jpg"
			alt="Bounty Supermarket"
			width={size}
			height={size}
			className={`rounded-full object-cover shrink-0 ${className}`}
			style={{ width: size, height: size }}
		/>
	);
}
