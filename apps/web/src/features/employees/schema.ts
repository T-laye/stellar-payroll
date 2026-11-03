import { z } from "zod";
import { amountProblem } from "@/lib/decimal";
import { isStellarAddress } from "@/lib/stellar";

/** Add / edit employee. `full_name` splits into the API's first and last name. */
export const EmployeeSchema = z.object({
	full_name: z
		.string()
		.trim()
		.min(2, "Enter the employee's full name")
		.refine((value) => value.split(/\s+/).length >= 2, "Enter a first and last name")
		.refine((value) => {
			const { first_name, last_name } = splitName(value);
			return first_name.length <= 100 && last_name.length <= 100;
		}, "First and last name can each be at most 100 characters"),
	email: z.email("Enter a valid email address"),
	job_title: z.string().trim().min(2, "Enter a role or job title"),
	department: z.string().trim().min(2, "Enter a department"),
	employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACTOR"]),
	country: z.string().min(2, "Choose a country"),
	phone: z.string().trim().optional(),
	start_date: z.string().min(1, "Choose a start date"),
	wallet_address: z
		.string()
		.trim()
		.refine((value) => value === "" || isStellarAddress(value), "This isn't a valid Stellar address. Check for typos: it starts with G and has 56 characters"),
	salary_amount: z
		.string()
		.trim()
		.superRefine((value, ctx) => {
			const problem = amountProblem(value);
			if (problem) ctx.addIssue({ code: "custom", message: problem });
		}),
	salary_currency: z.enum(["USDC", "XLM"]),
	pay_frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
	group_id: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof EmployeeSchema>;

export function splitName(fullName: string) {
	const [first = "", ...rest] = fullName.trim().split(/\s+/);
	return { first_name: first, last_name: rest.join(" ") };
}
