import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@repo/ui/sonner";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { SHARE_DESCRIPTION, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

/** The live site's typeface; Satoshi (packages/ui) is the fallback. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * App metadata. Icons, the manifest and link previews come from file conventions in this folder
 * (favicon.ico · icon.svg · apple-icon.png · manifest.ts · opengraph-image.tsx · twitter-image.tsx).
 * Each route segment's layout.tsx sets `title`, rendered as "%s | PayOrbit". The app sits behind
 * sign-in, so robots.ts and `robots` keep it out of search; previews still show when links are shared.
 */
export const metadata: Metadata = {
	metadataBase: SITE_URL,
	title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: SITE_KEYWORDS,
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	// Amounts, dates and wallet addresses must not turn into tap-to-call or map links.
	formatDetection: { telephone: false, email: false, address: false, date: false },
	robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
	category: "finance",
	openGraph: { type: "website", locale: "en_US", siteName: SITE_NAME, title: TITLE, description: SHARE_DESCRIPTION, url: "/" },
	twitter: { card: "summary_large_image", title: TITLE, description: SHARE_DESCRIPTION },
	appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
	themeColor: THEME_COLOR,
	// Shrink the layout viewport when the keyboard opens instead of covering inputs.
	interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html data-scroll-behavior="smooth" lang="en" className={`${inter.variable} antialiased`}>
			<body>
				<ReactQueryProvider>
					{children}
					<Toaster position="top-right" richColors />
				</ReactQueryProvider>
				<Analytics />
			</body>
		</html>
	);
}
