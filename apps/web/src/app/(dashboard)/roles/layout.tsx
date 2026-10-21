import type { Metadata } from "next";

/** The tab title for this section (the page is a client component, so it can't export metadata). */
export const metadata: Metadata = { title: "Roles & Permissions" };

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
