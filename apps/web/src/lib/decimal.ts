/**
 * Money arithmetic on the API's decimal strings ("5200.0000000"), exact to the 7 places Stellar
 * uses. Never add amounts with JS `Number` (frontend-integration.md §1): sums go through BigInt.
 */

const PLACES = 7;
const ZERO = BigInt(0);
const SCALE = BigInt(10) ** BigInt(PLACES);

function toUnits(value: string | number | null | undefined) {
	const text = String(value ?? "").trim();
	const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(text);
	if (!match || (!match[2] && !match[3])) return ZERO;
	const whole = BigInt(match[2] || "0");
	const fraction = BigInt((match[3] ?? "").slice(0, PLACES).padEnd(PLACES, "0"));
	const units = whole * SCALE + fraction;
	return match[1] ? -units : units;
}

function fromUnits(units: bigint) {
	const negative = units < ZERO;
	const abs = negative ? -units : units;
	const whole = abs / SCALE;
	const fraction = (abs % SCALE).toString().padStart(PLACES, "0");
	return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/** The exact sum, as a decimal string with 7 places. */
export function sumAmounts(values: (string | number | null | undefined)[]) {
	return fromUnits(values.reduce<bigint>((total, value) => total + toUnits(value), ZERO));
}

/** For an input box: "5200.0000000" → "5200.00", "0.1250000" → "0.125". */
export function toInputAmount(value: string | number | null | undefined) {
	const text = fromUnits(toUnits(value));
	const [whole, fraction = ""] = text.split(".");
	const trimmed = fraction.replace(/0+$/, "");
	return `${whole}.${trimmed.length < 2 ? trimmed.padEnd(2, "0") : trimmed}`;
}

export const isPositiveAmount = (value: string | number | null | undefined) => toUnits(value) > ZERO;

/** Why an amount typed into a form can't be paid, or null if it can (Stellar: 7 places, under a trillion). */
export function amountProblem(value: string) {
	const text = value.trim();
	if (text.startsWith("-")) return "Enter an amount greater than zero";
	const match = /^(\d*)(?:\.(\d*))?$/.exec(text);
	if (!match || (!match[1] && !match[2])) return text ? "Enter a number, like 1500.50" : "Enter an amount greater than zero";
	if (!isPositiveAmount(text)) return "Enter an amount greater than zero";
	if ((match[2] ?? "").length > PLACES) return `Use at most ${PLACES} decimal places`;
	if ((match[1] ?? "").replace(/^0+/, "").length > 12) return "This amount is too large";
	return null;
}
