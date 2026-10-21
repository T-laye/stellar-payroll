import type { Metadata } from "next";

/** The tab title for this section (the page is a client component, so it can't export metadata). */
export const metadata: Metadata = { title: "Dashboard", description: "Payroll overview: totals, upcoming payroll and latest activity." };

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
