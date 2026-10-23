"use client";

import { useState } from "react";
import { AlertTriangle, Search, Users } from "lucide-react";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";
import { PersonCell } from "@/components/person";
import { EmptyState } from "@/components/states";
import type { CompanyEmployee } from "@/features/employees/types";
import type { PayrollGroup } from "@/features/payroll/types";
import { sumAmounts, toInputAmount } from "@/lib/decimal";
import { formatMoney } from "@/lib/format";
import { hasWallet } from "@/lib/status";

/**
 * Choose who a payroll pays, and how much. Each row starts at the employee's salary; the amount
 * can be changed for this cycle only. People without a wallet can be picked but are flagged.
 */
export function EmployeePicker({
	employees,
	groups,
	asset,
	selection,
	onChange,
}: {
	employees: CompanyEmployee[];
	groups: PayrollGroup[];
	asset: string;
	/** employee id → amount for this cycle */
	selection: Record<string, string>;
	onChange: (next: Record<string, string>) => void;
}) {
	const [search, setSearch] = useState("");
	const [group, setGroup] = useState<string>("all");
	const term = search.trim().toLowerCase();
	const visible = employees.filter(
		(e) =>
			(group === "all" || e.group_id === group) &&
			(!term || `${e.first_name} ${e.last_name} ${e.email} ${e.job_title}`.toLowerCase().includes(term)),
	);
	const allVisibleSelected = visible.length > 0 && visible.every((e) => e.id in selection);

	const toggle = (employee: CompanyEmployee, on: boolean) => {
		const next = { ...selection };
		if (on) next[employee.id] = toInputAmount(employee.salary_amount);
		else delete next[employee.id];
		onChange(next);
	};
	const toggleAll = (on: boolean) => {
		const next = { ...selection };
		for (const e of visible) {
			if (on) next[e.id] ??= toInputAmount(e.salary_amount);
			else delete next[e.id];
		}
		onChange(next);
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-2 sm:flex-row">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search employees"
						className="pl-9"
						aria-label="Search employees"
					/>
				</div>
				{groups.length > 0 && (
					<div className="flex gap-1 overflow-x-auto">
						{[{ id: "all", name: "Everyone" }, ...groups].map((g) => (
							<button
								key={g.id}
								type="button"
								onClick={() => setGroup(g.id)}
								className={cn(
									"shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
									group === g.id
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:bg-accent",
								)}
							>
								{g.name.split(" — ")[0]}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<label className="flex cursor-pointer items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-sm font-medium">
					<Checkbox checked={allVisibleSelected} onCheckedChange={(v) => toggleAll(v === true)} aria-label="Select all" />
					Select all{visible.length !== employees.length ? ` (${visible.length} shown)` : ""}
				</label>
				{visible.length === 0 ? (
					<EmptyState compact icon={Users} title="No employees match" description="Clear the search or pick another group." />
				) : (
					<ul className="max-h-[440px] divide-y divide-border overflow-y-auto">
						{visible.map((e) => {
							const checked = e.id in selection;
							const noWallet = !hasWallet(e);
							const otherAsset = e.salary_currency !== asset;
							return (
								<li
									key={e.id}
									className={cn(
										"flex flex-col gap-2 px-4 py-3 transition-colors sm:flex-row sm:items-center",
										checked && "bg-primary/3",
									)}
								>
									<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
										<Checkbox
											checked={checked}
											onCheckedChange={(v) => toggle(e, v === true)}
											aria-label={`Select ${e.first_name} ${e.last_name}`}
										/>
										<PersonCell name={`${e.first_name} ${e.last_name}`} subtitle={e.job_title} size="sm" className="flex-1" />
									</label>
									<div className="flex items-center gap-3 pl-7 sm:pl-0">
										{noWallet && (
											<span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
												<AlertTriangle className="size-3.5" /> No wallet
											</span>
										)}
										{otherAsset && !noWallet && (
											<span className="text-xs text-muted-foreground">Salary in {e.salary_currency}</span>
										)}
										<div className="relative w-36 shrink-0 sm:w-40">
											<Input
												type="number"
												min="0"
												step="0.01"
												inputMode="decimal"
												disabled={!checked}
												value={checked ? selection[e.id] : toInputAmount(e.salary_amount)}
												onChange={(ev) => onChange({ ...selection, [e.id]: ev.target.value })}
												aria-label={`Amount for ${e.first_name} ${e.last_name}`}
												className="h-8 [appearance:textfield] pr-12 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
											/>
											<span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-muted-foreground">
												{asset}
											</span>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}

/** The exact total of the picked amounts (decimal strings, never JS number arithmetic). */
export function selectionTotal(selection: Record<string, string>) {
	return sumAmounts(Object.values(selection));
}

export const selectionSummary = (selection: Record<string, string>, asset: string) => {
	const count = Object.keys(selection).length;
	return `${count} selected · ${formatMoney(selectionTotal(selection), asset)}`;
};
