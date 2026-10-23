/**
 * Where the console's data comes from: "mock" (the default, the in-browser demo backend from
 * `@repo/mock-api`, shared with the app) or "live" (`NEXT_PUBLIC_API_SOURCE=live`, the PayOrbit API).
 */
export const API_SOURCE: "mock" | "live" = process.env.NEXT_PUBLIC_API_SOURCE === "live" ? "live" : "mock";

export const USE_MOCK_API = API_SOURCE === "mock";

/** The demo platform admin the mock seeds (packages/mock-api/src/seed.ts). */
export const DEMO_ADMIN = { email: "admin@payorbit.com", password: "Password1" } as const;

/** Restores the seed data (mock mode only). */
export async function resetDemoData() {
	const { resetMockDb } = await import("@repo/mock-api/db");
	resetMockDb();
}
