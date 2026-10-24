export function formatStatNumber(value: number | null | undefined) {
	if (value == null || Number.isNaN(value)) {
		return "--";
	}

	return new Intl.NumberFormat("en-US").format(value);
}

export function formatStatAmount(value: number | string | null | undefined) {
	if (value == null || value === "") {
		return "--";
	}

	const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value));

	if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
		return new Intl.NumberFormat("en-US", {
			maximumFractionDigits: 2,
		}).format(numericValue);
	}

	return String(value);
}

export function formatStatPercent(value: number | null | undefined) {
	if (value == null || Number.isNaN(value)) {
		return "--";
	}

	return `${value.toFixed(1)}%`;
}

export function formatStatDate(value: string | null | undefined) {
	if (!value) {
		return "Not available";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Not available";
	}

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function formatStatLabel(value: string) {
	return value
		.replace(/[_:]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function sumStatRecord(record: Record<string, number> | null | undefined) {
	if (!record) {
		return 0;
	}

	return Object.values(record).reduce((total, value) => total + value, 0);
}

// ---- Money and dates for the payroll screens ----

const toNumber = (value: number | string | null | undefined) => {
	const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(n) ? n : 0;
};

/**
 * An amount in its asset. USDC is a dollar stablecoin, so it reads as dollars ("$5,200.00");
 * XLM keeps its code ("950.00 XLM"). Pass `withCode` to append "USDC" too.
 */
export function formatMoney(
	value: number | string | null | undefined,
	asset = "USDC",
	{ withCode = false, compact = false } = {},
) {
	const n = toNumber(value);
	const digits =
		compact && Math.abs(n) >= 1000
			? { notation: "compact" as const, maximumFractionDigits: 1 }
			: { minimumFractionDigits: 2, maximumFractionDigits: 2 };
	const number = new Intl.NumberFormat("en-US", digits).format(Math.abs(n));
	const sign = n < 0 ? "-" : "";
	if (asset === "USDC" || asset === "USD") return `${sign}$${number}${withCode ? " USDC" : ""}`;
	return `${sign}${number} ${asset}`;
}

export function formatCount(value: number | null | undefined) {
	return value == null ? "--" : new Intl.NumberFormat("en-US").format(value);
}

/** "Oct 21, 2026". */
export function formatDate(value: string | number | Date | null | undefined) {
	if (value == null || value === "") return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "--"
		: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "Oct 21, 2026, 10:24 AM". */
export function formatDateTime(value: string | number | Date | null | undefined) {
	if (value == null || value === "") return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "--"
		: date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "3 hours ago", "in 2 days". */
export function formatRelative(value: string | number | Date | null | undefined, now = Date.now()) {
	if (value == null || value === "") return "--";
	const ms = new Date(value).getTime() - now;
	if (Number.isNaN(ms)) return "--";
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["year", 31_536_000_000],
		["month", 2_592_000_000],
		["week", 604_800_000],
		["day", 86_400_000],
		["hour", 3_600_000],
		["minute", 60_000],
	];
	const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
	for (const [unit, size] of units) if (Math.abs(ms) >= size) return rtf.format(Math.round(ms / size), unit);
	return "just now";
}

/** "Oct 1 – Oct 31, 2026" for a pay period (dates are YYYY-MM-DD, UTC). */
export function formatPeriod(start: string, end: string) {
	const opts = { month: "short", day: "numeric", timeZone: "UTC" } as const;
	const a = new Date(start);
	const b = new Date(end);
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "--";
	return `${a.toLocaleDateString("en-US", opts)} – ${b.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export function initials(name: string) {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "?"
	);
}

/** "monthly", "BIWEEKLY" → "Monthly", "Bi-weekly". */
export function formatFrequency(value: string | null | undefined) {
	switch ((value ?? "").toUpperCase()) {
		case "WEEKLY":
			return "Weekly";
		case "BIWEEKLY":
			return "Bi-weekly";
		case "MONTHLY":
			return "Monthly";
		default:
			return "--";
	}
}

/** YYYY-MM-DD in local time, for <input type="date">. */
export function toDateInput(value: Date | number) {
	const d = new Date(value);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
