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

	const numericValue =
		typeof value === "number" ? value : Number.parseFloat(String(value));

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
