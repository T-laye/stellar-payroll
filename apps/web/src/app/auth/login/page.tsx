import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * The backend's emails link to /auth/login (frontend-integration.md §4); the app's page is
 * /auth/sign-in. Keep any query string.
 */
export default async function LoginRedirect({ searchParams }: PageProps<"/auth/login">) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(await searchParams)) {
		if (typeof value === "string") params.set(key, value);
	}
	redirect(`${routes.authRoutes.SIGN_IN}${params.size ? `?${params}` : ""}`);
}
