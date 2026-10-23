import { AdminShell } from "@/components/AdminShell";
import { RequireAdmin } from "@/features/auth/RequireAdmin";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
	return (
		<RequireAdmin>
			<AdminShell>{children}</AdminShell>
		</RequireAdmin>
	);
}
