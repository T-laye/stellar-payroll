import type { LucideIcon } from "lucide-react";
import { EmptyState as Empty } from "@/components/states";

/** The older card-wrapped empty state (wallets, payment requests). New screens use `EmptyState` from states.tsx. */
export default function EmptyState({
	icon,
	title,
	description,
	action,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-border bg-card shadow-xs">
			<Empty icon={icon} title={title} description={description} action={action} />
		</div>
	);
}
