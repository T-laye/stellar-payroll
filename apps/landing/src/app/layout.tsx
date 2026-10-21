import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SHARE_DESCRIPTION, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

/** The live site's typeface; Satoshi (packages/ui) is the fallback. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * Icons and link previews come from file conventions in this folder: favicon.ico, icon.svg,
 * apple-icon.png, opengraph-image.tsx and twitter-image.tsx (1200×630, rendered at build time).
 */
export const metadata: Metadata = {
	metadataBase: SITE_URL,
	title: { default: TITLE, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: SITE_KEYWORDS,
	category: "finance",
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	alternates: { canonical: "/" },
	openGraph: { type: "website", locale: "en_US", url: "/", siteName: SITE_NAME, title: TITLE, description: SHARE_DESCRIPTION },
	twitter: { card: "summary_large_image", title: TITLE, description: SHARE_DESCRIPTION },
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
	},
	formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = { themeColor: THEME_COLOR };

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${inter.variable} antialiased`}>
			<body>{children}</body>
		</html>
	);
}
