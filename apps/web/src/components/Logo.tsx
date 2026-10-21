import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { withBasePath } from "@/lib/site";

/**
 * The PayOrbit wordmark from getpayorbit.com (purple), a white version for the dark sidebar and
 * sign-in panel, and the orbit mark alone for tight spaces.
 */
export default function Logo({
	w = "w-28",
	variant = "color",
	mark = false,
	href = "/",
	className,
}: {
	w?: string;
	variant?: "color" | "white";
	mark?: boolean;
	href?: string | null;
	className?: string;
}) {
	const file = `${mark ? "mark" : "logo"}${variant === "white" ? "-white" : ""}.svg`;
	// A plain <img>: SVGs need no optimising, and this keeps the base path explicit.
	const image = (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			alt="PayOrbit"
			src={withBasePath(`/images/${file}`)}
			width={mark ? 32 : 146}
			height={32}
			className="h-auto w-full object-contain"
		/>
	);
	const classes = cn("flex shrink-0 items-center", w, className);
	return href ? (
		<Link href={href} className={classes}>
			{image}
		</Link>
	) : (
		<span className={classes}>{image}</span>
	);
}
