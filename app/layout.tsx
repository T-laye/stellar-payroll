import type { Metadata } from "next";
// import { Inter, Rubik } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import "./globals.css";

// const interSans = Inter({
// 	variable: "--font-inter-sans",
// 	subsets: ["latin"],
// });


export const metadata: Metadata = {
	title: "Stellar - Global Payroll Made Simple",
	description:
		"Pay your global team in minutes with Stellar. Fast, secure, and transparent cross-border payments powered by blockchain.",
	// generator: 'v0.app',
	keywords: [
		"payroll",
		"cross-border payments",
		"global payments",
		"blockchain",
		"stellar",
	],
	openGraph: {
		title: "Stellar - Global Payroll Made Simple",
		description: "Pay your global team in minutes with Stellar",
		type: "website",
	},
	icons: {
		icon: [
			{
				url: "/favicon-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/favicon-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/favicon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-touch-icon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={` antialiased`}>
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	);
}
