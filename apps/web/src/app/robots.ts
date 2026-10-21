import type { MetadataRoute } from "next";

/** The app is behind sign-in: keep it out of search (the landing site is the indexable one). */
export default function robots(): MetadataRoute.Robots {
	return { rules: { userAgent: "*", disallow: "/" } };
}
