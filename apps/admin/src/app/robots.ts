import type { MetadataRoute } from "next";

/** The console is staff-only: keep it out of search. */
export default function robots(): MetadataRoute.Robots {
	return { rules: { userAgent: "*", disallow: "/" } };
}
