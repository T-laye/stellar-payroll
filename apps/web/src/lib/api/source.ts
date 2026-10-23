/**
 * Where the app's data comes from.
 *
 * - "mock" (the default for now): an in-browser backend (`@repo/mock-api`) with a demo company, so
 *   every screen and payroll state can be explored without an account or the network. Data lives in
 *   localStorage (`payorbit-mock-db`); "Reset demo data" on the sign-in page restores it.
 * - "live": the PayOrbit API (`NEXT_PUBLIC_API_SOURCE=live`).
 */
export const API_SOURCE: "mock" | "live" = process.env.NEXT_PUBLIC_API_SOURCE === "live" ? "live" : "mock";

export const USE_MOCK_API = API_SOURCE === "mock";

/** The demo accounts the mock backend seeds (packages/mock-api/src/seed.ts). */
export const DEMO_ACCOUNTS = [
	{ label: "Owner", email: "demo@payorbit.com", description: "Full access: employees, payroll, wallets, roles." },
	{ label: "HR manager", email: "hr@payorbit.com", description: "Prepares payroll; can't approve or execute it." },
	{ label: "Employee", email: "employee@payorbit.com", description: "Amara's own payments and wallet (PIN 1234)." },
	{
		label: "Test owner",
		email: "stellardev002@gmail.com",
		description: "Stellar Developer, Stellar Dev Studio: a fresh, funded workspace with no employees yet.",
		password: "Test@1234",
	},
	{
		label: "Test admin",
		email: "tlayefaah@gmail.com",
		description: "Tubo Layefa, Layefa Technologies: a fresh, funded workspace with no employees yet.",
		password: "Test@1234",
	},
] as const satisfies readonly { label: string; email: string; description: string; password?: string }[];
export const DEMO_PASSWORD = "Password1";

/** Restores the seed data (mock mode only). */
export async function resetDemoData() {
	const { resetMockDb } = await import("@repo/mock-api/db");
	resetMockDb();
}
