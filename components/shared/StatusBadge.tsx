import { cn } from "../../lib/utils";

// ─── Shared: status badge config ─────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
	active: {
		label: "Active",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
	completed: {
		label: "Completed",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	processing: {
		label: "Processing",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	pending: {
		label: "Pending",
		className:
			"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	failed: {
		label: "Failed",
		className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
	},
	draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
	approved: {
		label: "Approved",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
};

export default function StatusBadge({ status }: { status: string }) {
	const cfg = statusConfig[status] ?? {
		label: status,
		className: "bg-muted text-muted-foreground",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
				cfg.className,
			)}
		>
			{cfg.label}
		</span>
	);
}
