import type { Metadata } from "next";

/** The tab title for this section (the page is a client component, so it can't export metadata). */
export const metadata: Metadata = { title: "Accept your invite", description: "Set your password to see your payments on PayOrbit." };

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
