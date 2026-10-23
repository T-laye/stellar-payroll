import { cn } from "@repo/ui/lib/utils";
import { TONE_CLASSES, employeeStatus, paymentStatus, runStatus, scheduleStatus, type StatusView, type Tone } from "@/lib/status";

/** A status as a soft pill with a dot; the dot pulses while the state is waiting on the network. */
export function StatusPill({
	view,
	className,
	title,
}: {
	view: Pick<StatusView, "label" | "tone" | "live">;
	className?: string;
	title?: string;
}) {
	const tone = TONE_CLASSES[view.tone];
	return (
		<span
			title={title}
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
				tone.badge,
				className,
			)}
		>
			<span className={cn("size-1.5 rounded-full", tone.dot, view.live && "animate-signal")} aria-hidden />
			{view.label}
		</span>
	);
}

export const RunStatusPill = ({ run, className }: { run: Parameters<typeof runStatus>[0]; className?: string }) => {
	const view = runStatus(run);
	return <StatusPill view={view} title={view.description} className={className} />;
};

export const PaymentStatusPill = ({ status, className }: { status: string; className?: string }) => {
	const view = paymentStatus(status);
	return <StatusPill view={view} title={view.description} className={className} />;
};

export const EmployeeStatusPill = ({
	employee,
	className,
}: {
	employee: Parameters<typeof employeeStatus>[0];
	className?: string;
}) => {
	const view = employeeStatus(employee);
	return <StatusPill view={view} title={view.description} className={className} />;
};

export const ScheduleStatusPill = ({ status, className }: { status: string; className?: string }) => {
	const view = scheduleStatus(status);
	return <StatusPill view={view} title={view.description} className={className} />;
};

/** For anything else (payment requests, compliance checks). */
export const TonePill = ({ label, tone, className }: { label: string; tone: Tone; className?: string }) => (
	<StatusPill view={{ label, tone }} className={className} />
);
