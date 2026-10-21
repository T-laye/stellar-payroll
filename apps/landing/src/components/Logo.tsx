import Link from "next/link";

/** The PayOrbit wordmark (purple), or the white version for dark sections. */
export default function Logo({ w = "w-32", variant = "color" }: { w?: string; variant?: "color" | "white" }) {
	return (
		<Link href="/" className={`flex shrink-0 items-center ${w}`} aria-label="PayOrbit home">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				alt="PayOrbit"
				src={variant === "white" ? "/images/logo-white.svg" : "/images/logo.svg"}
				width={146}
				height={32}
				className="h-auto w-full"
			/>
		</Link>
	);
}
