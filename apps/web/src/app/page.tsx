import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** The app root opens the dashboard; the dashboard layout sends signed-out visitors to sign in. */
export default function Page() {
	redirect(routes.dashboardRoutes.OVERVIEW);
}
