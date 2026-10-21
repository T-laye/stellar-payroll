import type { Metadata } from "next";

/** The tab title for this section (the page is a client component, so it can't export metadata). */
export const metadata: Metadata = { title: "Sign in", description: "Sign in to your PayOrbit organization account." };

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
