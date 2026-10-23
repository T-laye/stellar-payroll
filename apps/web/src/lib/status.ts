/**
 * One place for every status the app shows: the API's states mapped to the words people see
 * (PRD §4, §5), a tone for colour, and whether the state is still waiting on the network.
 *
 * Runs:     DRAFT → Pending · APPROVED before its pay date → Scheduled (the server pays it then) ·
 *           APPROVED after its pay date → Approved (waits for Pay now) · PROCESSING / RETRYING → Processing ·
 *           COMPLETED → Completed · FAILED → Failed · CANCELLED → Cancelled (frontend-integration.md §2).
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

export type RunPhase = "pending" | "scheduled" | "awaiting" | "processing" | "completed" | "failed" | "cancelled";

interface RunLike {
	status: string;
	scheduled_at?: string | null;
	approved_at?: string | null;
	executed_at?: string | null;
}

/**
 * The server only pays an APPROVED run by itself when it was approved before its `scheduled_at`;
 * approved afterwards, it waits for execute.
 */
export function paysItself(run: RunLike) {
	if (!run.scheduled_at) return false;
	return !run.approved_at || Date.parse(run.approved_at) <= Date.parse(run.scheduled_at);
}

export function runPhase(run: RunLike, now = Date.now()): RunPhase {
	switch (run.status) {
		case "DRAFT":
			return "pending";
		case "APPROVED":
			if (!paysItself(run)) return "awaiting";
			return run.scheduled_at && Date.parse(run.scheduled_at) > now ? "scheduled" : "processing";
		case "PROCESSING":
		case "RETRYING":
			return "processing";
		case "COMPLETED":
			return "completed";
		case "FAILED":
			return "failed";
		case "CANCELLED":
			return "cancelled";
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
	awaiting: {
		label: "Approved",
		tone: "warning",
		description: "Approved after its pay date, so it won't pay itself. Pay it now to send the payments.",
	},
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
	// The live per-run payments view says PROCESSING / COMPLETED for SUBMITTED / CONFIRMED.
	switch (status) {
		case "SUBMITTED":
		case "PROCESSING":
			return "processing";
		case "CONFIRMED":
		case "COMPLETED":
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

/**
 * Whether payroll can reach this employee. The live employee list leaves `wallet` out entirely
 * (single-employee GETs include it), so a missing field falls back to the status: the API refuses
 * ACTIVE without a wallet, and PENDING means none yet.
 */
export function hasWallet(employee: EmployeeLike) {
	if (employee.wallet) return true;
	if (employee.wallet === null) return false;
	return employee.status !== "PENDING";
}

/** PRD §9: Active / Pending / Inactive. Pending = no wallet yet; the invite is shown on its own. */
export function employeePhase(employee: EmployeeLike): EmployeePhase {
	if (employee.status === "INACTIVE") return "inactive";
	if (employee.status === "TERMINATED") return "terminated";
	// The API's own PENDING: waiting for a wallet. (ACTIVE always has one; the check covers older data.)
	if (employee.status === "PENDING" || !hasWallet(employee)) return "pending";
	return "active";
}

export const EMPLOYEE_PHASES: Record<EmployeePhase, StatusView> = {
	active: { label: "Active", tone: "success", description: "Ready to be paid." },
	pending: {
		label: "Pending",
		tone: "warning",
		description: "Waiting for a wallet. Payroll can't pay them until one is linked.",
	},
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
