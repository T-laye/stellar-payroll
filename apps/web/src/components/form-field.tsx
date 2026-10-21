import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

/** Label, control, then either the error or a hint. `htmlFor` ties the label to the control. */
export function FormField({
	label,
	htmlFor,
	required,
	hint,
	error,
	children,
	className,
}: {
	label: string;
	htmlFor?: string;
	required?: boolean;
	hint?: ReactNode;
	error?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</label>
			{children}
			{error ? (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			) : (
				hint && <p className="text-xs text-muted-foreground">{hint}</p>
			)}
		</div>
	);
}
