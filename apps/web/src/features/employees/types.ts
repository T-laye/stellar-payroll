import type { Asset, PayCycle } from "@/features/payroll/types";

export interface EmployeeWalletSummary {
	id: string;
	is_funded: boolean;
	network: string;
	stellar_address: string;
}

export interface CompanyEmployee {
	id: string;
	company_id: string;
	employee_number: string;
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	country: string;
	department: string;
	job_title: string;
	employment_type: "FULL_TIME" | "PART_TIME" | "CONTRACTOR";
	external_id: string;
	group_id: string | null;
	salary_amount: string;
	salary_currency: Asset;
	/** Defaults to the pay group's cycle, else MONTHLY. */
	pay_frequency?: PayCycle;
	start_date: string;
	end_date: string | null;
	/** PENDING until a wallet is linked; ACTIVE can't be set without one (409). */
	status: "PENDING" | "ACTIVE" | "INACTIVE" | "TERMINATED";
	created_at: string;
	updated_at: string;
	wallet?: EmployeeWalletSummary | null;
	/** The portal login: NOT_INVITED until POST …/invite, PENDING until they sign in. */
	invite_status?: "NOT_INVITED" | "PENDING" | "ACCEPTED";
}

export interface EmployeeWalletDetail {
	id: string;
	stellar_address: string;
	wallet_type: string;
	network: string;
	is_funded: boolean;
	balances: { asset: string; amount: string }[];
	total_payments_received: number;
	last_payment: {
		amount: string;
		asset: string;
		confirmed_at: string;
		from_address: string;
		stellar_tx_hash: string;
		transaction_id: string;
	} | null;
	created_at: string;
	updated_at: string;
}

export interface CreateEmployeePayload {
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	country: string;
	department: string;
	job_title: string;
	employment_type: CompanyEmployee["employment_type"];
	group_id?: string;
	salary_amount: string;
	salary_currency: Asset;
	pay_frequency: PayCycle;
	start_date: string;
}

export type UpdateEmployeePayload = Partial<Omit<CreateEmployeePayload, "email" | "country" | "start_date" | "group_id">> & {
	/** null takes them out of their pay group. */
	group_id?: string | null;
	status?: CompanyEmployee["status"];
	end_date?: string | null;
};
