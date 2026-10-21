import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@repo/ui/og-card";

/**
 * The app's link preview (Open Graph; twitter-image.tsx reuses it): what people see when an invite,
 * a payment or a payroll link is shared. Rendered once at build time.
 */
export const alt = "PayOrbit — payroll dashboard and employee payment portal";
export const size = OG_SIZE;
export const contentType = "image/png";

const svg = (file: Buffer) => `data:image/svg+xml;base64,${file.toString("base64")}`;

export default async function Image() {
	const [bold, medium, logo] = await Promise.all([
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Satoshi-Bold.ttf")),
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Satoshi-Medium.ttf")),
		readFile(join(process.cwd(), "public/images/logo-white.svg")).then(svg),
	]);

	return new ImageResponse(
		<OgCard
			logo={logo}
			eyebrow="PayOrbit app"
			title="Global payroll."
			highlight="Powered by Stellar."
			subtitle="Run payroll, track every payment, and give employees a clear view of their pay."
		/>,
		{
			...size,
			fonts: [
				{ name: "Satoshi", data: bold, weight: 700, style: "normal" },
				{ name: "Satoshi", data: medium, weight: 500, style: "normal" },
			],
		},
	);
}
