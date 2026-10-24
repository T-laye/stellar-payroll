"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { cn } from "@repo/ui/lib/utils";
import { useCompanyList } from "@/features/admin/lookups";

const ALL = "all";

export function SearchBox({
	value,
	onChange,
	label,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	label: string;
	className?: string;
}) {
	return (
		<div className={cn("relative lg:w-72", className)}>
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className="pl-9" aria-label={label} />
		</div>
	);
}

/** A plain select where "" means no filter (Radix can't hold an empty value, so it maps to "all"). */
export function FilterSelect({
	value,
	onChange,
	options,
	label,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	label: string;
	className?: string;
}) {
	return (
		<Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
			<SelectTrigger className={cn("w-full sm:w-48", className)} aria-label={label}>
				<SelectValue placeholder={label} />
			</SelectTrigger>
			<SelectContent>
				{options.map((o) => (
					<SelectItem key={o.value || ALL} value={o.value || ALL}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export function CompanySelect({
	value,
	onChange,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}) {
	const companies = useCompanyList();
	return (
		<FilterSelect
			value={value}
			onChange={onChange}
			label="Company"
			className={className}
			options={[{ value: "", label: "All companies" }, ...companies.map((c) => ({ value: c.id, label: c.name }))]}
		/>
	);
}
