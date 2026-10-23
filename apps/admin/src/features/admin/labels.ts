/** Words for what the API stores as codes. */

/** "payroll_run.line_items.bulk_add" → "Payroll run · line items bulk add". */
export function actionLabel(action: string) {
	const [resource = "", ...rest] = action.split(".");
	const noun = resource.replace(/_/g, " ");
	const verb = rest.join(" ").replace(/_/g, " ");
	return `${noun.charAt(0).toUpperCase()}${noun.slice(1)}${verb ? ` · ${verb}` : ""}`;
}

const regions = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

/** Live stores ISO codes ("NG"), older records full names ("Nigeria"); show a name either way. */
export function countryName(country: string | null | undefined) {
	if (!country) return "--";
	if (/^[A-Z]{2}$/.test(country) && regions) {
		try {
			return regions.of(country) ?? country;
		} catch {
			return country;
		}
	}
	return country;
}

export const fullName = (p: { first_name?: string; last_name?: string; email?: string } | null | undefined) =>
	p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Unknown" : "Unknown";
