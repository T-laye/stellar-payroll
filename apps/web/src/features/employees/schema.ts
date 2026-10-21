import { z } from "zod";

/** Add / edit employee. `full_name` splits into the API's first and last name. */
export const EmployeeSchema = z.object({
	full_name: z
		.string()
		.trim()
		.min(2, "Enter the employee's full name")
		.refine((value) => value.split(/\s+/).length >= 2, "Enter a first and last name"),
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
		.refine((value) => value === "" || /^G[A-Z2-7]{55}$/.test(value), "A Stellar address starts with G and has 56 characters"),
	salary_amount: z
		.string()
		.trim()
		.refine((value) => Number(value) > 0, "Enter an amount greater than zero"),
	salary_currency: z.enum(["USDC", "XLM"]),
	pay_frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
	group_id: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof EmployeeSchema>;

export function splitName(fullName: string) {
	const [first = "", ...rest] = fullName.trim().split(/\s+/);
	return { first_name: first, last_name: rest.join(" ") };
}
