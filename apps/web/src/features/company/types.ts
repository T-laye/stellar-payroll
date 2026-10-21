export interface Company {
	country: string;
	created_at: string;
	default_currency: string;
	email: string;
	id: string;
	is_active: boolean;
	logo_url: string | null;
	name: string;
	phone: string | null;
	slug: string;
	timezone: string;
	updated_at: string;
	website: string | null;
}

export interface CompanyResponse {
	data: Company;
	message: string;
	statusCode: number;
}

export interface UpdateCompanyPayload extends Record<string, unknown> {
	default_currency?: string;
	logo_url?: string;
	name?: string;
	phone?: string;
	timezone?: string;
	website?: string;
}
