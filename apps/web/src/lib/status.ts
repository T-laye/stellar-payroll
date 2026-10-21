/**
 * One place for every status the app shows: the API's states mapped to the words people see
 * (PRD §4, §5), a tone for colour, and whether the state is still waiting on the network.
 *
 * Runs:     DRAFT → Pending · APPROVED (future) → Scheduled · PROCESSING / RETRYING → Processing ·
 *           COMPLETED → Completed · FAILED → Failed (or Cancelled, if it never started paying).
 * Payments: PENDING → Pending · SUBMITTED → Processing · CONFIRMED → Completed · FAILED → Failed.
 *           Completed only ever comes from CONFIRMED.
 */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export interface StatusView {
	label: string;
	tone: Tone;
	/** Still moving: show the live signal. */
	live?: boolean;
	description: string;
}

export type RunPhase = "pending" | "scheduled" | "processing" | "completed" | "failed" | "cancelled";

interface RunLike {
	status: string;
	scheduled_at?: string | null;
	executed_at?: string | null;
}

export function runPhase(run: RunLike, now = Date.now()): RunPhase {
	switch (run.status) {
		case "DRAFT":
			return "pending";
		case "APPROVED":
			return run.scheduled_at && Date.parse(run.scheduled_at) > now ? "scheduled" : "processing";
		case "PROCESSING":
		case "RETRYING":
			return "processing";
		case "COMPLETED":
			return "completed";
		case "FAILED":
			// The API marks a cancelled run FAILED; one that never started paying was cancelled.
			return run.executed_at ? "failed" : "cancelled";
		default:
			return "pending";
	}
}

export const RUN_PHASES: Record<RunPhase, StatusView> = {
	pending: {
		label: "Pending",
		tone: "warning",
		description: "Draft: waiting for review and approval. Nothing is paid until it's approved.",
	},
	scheduled: { label: "Scheduled", tone: "brand", description: "Approved. It will be paid automatically at the scheduled time." },
	processing: { label: "Processing", tone: "info", live: true, description: "Payments are being sent and confirmed." },
	completed: { label: "Completed", tone: "success", description: "Every payment was confirmed." },
	failed: { label: "Failed", tone: "danger", description: "One or more payments failed. Review the reasons and retry." },
	cancelled: { label: "Cancelled", tone: "neutral", description: "Cancelled before any payment was sent." },
};

export const runStatus = (run: RunLike) => RUN_PHASES[runPhase(run)];

/** The filter tabs on payroll history, in PRD order. */
export const RUN_FILTERS: { value: "all" | RunPhase; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "pending", label: "Pending" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "processing", label: "Processing" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
];

export type PaymentPhase = "pending" | "processing" | "completed" | "failed";

export function paymentPhase(status: string): PaymentPhase {
	switch (status) {
		case "SUBMITTED":
			return "processing";
		case "CONFIRMED":
			return "completed";
		case "FAILED":
			return "failed";
		default:
			return "pending";
	}
}

export const PAYMENT_PHASES: Record<PaymentPhase, StatusView> = {
	pending: { label: "Pending", tone: "warning", live: true, description: "The payment has not yet been processed." },
	processing: { label: "Processing", tone: "info", live: true, description: "The payment is being sent and confirmed." },
	completed: { label: "Completed", tone: "success", description: "The payment was received and confirmed on the network." },
	failed: { label: "Failed", tone: "danger", description: "The payment didn't go through." },
};

export const paymentStatus = (status: string) => PAYMENT_PHASES[paymentPhase(status)];

/** Payment statuses the API accepts as filters, by the label people pick. */
export const PAYMENT_FILTERS: { value: string; label: string }[] = [
	{ value: "", label: "All statuses" },
	{ value: "PENDING", label: "Pending" },
	{ value: "SUBMITTED", label: "Processing" },
	{ value: "CONFIRMED", label: "Completed" },
	{ value: "FAILED", label: "Failed" },
];

export type EmployeePhase = "active" | "pending" | "inactive" | "terminated";

interface EmployeeLike {
	status: string;
	wallet?: unknown;
	invite_status?: string;
}

/** PRD §9: Pending = active, but not ready to be paid yet (no wallet, or the invite isn't accepted). */
export function employeePhase(employee: EmployeeLike): EmployeePhase {
	if (employee.status === "INACTIVE") return "inactive";
	if (employee.status === "TERMINATED") return "terminated";
	if (!employee.wallet || employee.invite_status === "PENDING") return "pending";
	return "active";
}

export const EMPLOYEE_PHASES: Record<EmployeePhase, StatusView> = {
	active: { label: "Active", tone: "success", description: "Ready to be paid." },
	pending: { label: "Pending", tone: "warning", description: "Missing a wallet or hasn't accepted the invite yet." },
	inactive: { label: "Inactive", tone: "neutral", description: "Not included in new payroll." },
	terminated: { label: "Terminated", tone: "danger", description: "No longer with the company. Payment history is kept." },
};

export const employeeStatus = (employee: EmployeeLike) => EMPLOYEE_PHASES[employeePhase(employee)];

export const SCHEDULE_STATUSES: Record<string, StatusView> = {
	ACTIVE: { label: "Active", tone: "success", description: "Drafts a payroll run before each pay date for you to approve." },
	PAUSED: { label: "Paused", tone: "warning", description: "No runs are drafted until you resume it." },
	CANCELLED: { label: "Cancelled", tone: "neutral", description: "Stopped for good. Past runs are kept." },
};

export const scheduleStatus = (status: string) => SCHEDULE_STATUSES[status] ?? SCHEDULE_STATUSES.ACTIVE!;

/** Tailwind classes per tone: soft background, readable text, matching dot. */
export const TONE_CLASSES: Record<Tone, { badge: string; dot: string; icon: string }> = {
	neutral: {
		badge: "bg-muted text-muted-foreground border-border",
		dot: "bg-muted-foreground",
		icon: "bg-muted text-muted-foreground",
	},
	info: { badge: "bg-info/10 text-info border-info/20", dot: "bg-info", icon: "bg-info/10 text-info" },
	success: { badge: "bg-success/10 text-success border-success/20", dot: "bg-success", icon: "bg-success/10 text-success" },
	warning: { badge: "bg-warning/10 text-warning border-warning/25", dot: "bg-warning", icon: "bg-warning/10 text-warning" },
	danger: {
		badge: "bg-destructive/10 text-destructive border-destructive/20",
		dot: "bg-destructive",
		icon: "bg-destructive/10 text-destructive",
	},
	brand: { badge: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary", icon: "bg-primary/10 text-primary" },
};
