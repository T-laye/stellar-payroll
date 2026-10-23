import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { Providers } from "@/components/Providers";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

/** Staff only: never indexed (robots.ts). Pages set `title` and get "%s | PayOrbit Admin". */
export const metadata: Metadata = {
	title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
	formatDetection: { telephone: false, email: false, address: false, date: false },
};

export const viewport: Viewport = { themeColor: THEME_COLOR };

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${inter.variable} antialiased`}>
			<body>
				<Providers>
					{children}
					<Toaster position="top-right" richColors />
				</Providers>
			</body>
		</html>
	);
}
