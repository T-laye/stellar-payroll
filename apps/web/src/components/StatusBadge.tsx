import { TonePill } from "@/components/status-pill";
import type { Tone } from "@/lib/status";

/** Payment-request and other simple statuses (lowercase API value). Payroll and payments use status-pill.tsx. */
const STATUSES: Record<string, { label: string; tone: Tone }> = {
	active: { label: "Active", tone: "success" },
	inactive: { label: "Inactive", tone: "neutral" },
	completed: { label: "Completed", tone: "success" },
	processing: { label: "Processing", tone: "info" },
	pending: { label: "Pending", tone: "warning" },
	failed: { label: "Failed", tone: "danger" },
	draft: { label: "Draft", tone: "neutral" },
	approved: { label: "Approved", tone: "success" },
	rejected: { label: "Rejected", tone: "danger" },
	paid: { label: "Paid", tone: "success" },
};

export default function StatusBadge({ status }: { status: string }) {
	const config = STATUSES[status] ?? { label: status.charAt(0).toUpperCase() + status.slice(1), tone: "neutral" as const };
	return <TonePill label={config.label} tone={config.tone} />;
}
