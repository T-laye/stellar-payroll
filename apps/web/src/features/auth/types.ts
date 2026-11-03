export interface AuthSessionResponse {
	access_token?: string;
	pay_token?: string;
	verify_email_token?: string;
	/** Live login: the role's name ("Owner") and its permissions. */
	role?: string;
	permissions?: string[];
}

export interface AuthUserResponse {
	id?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	role_slug?: string;
	role_name?: string;
	company_id?: string;
	company_name?: string;
	company_slug?: string;
}

/** A company this person belongs to (`GET /auth/memberships`, and `companies` on login). */
export interface CompanyMembership {
	company_id: string;
	company_name: string;
	company_slug: string;
	role: string;
}

export interface AuthResponseData {
	company_id?: string;
	company_slug?: string;
	companies?: CompanyMembership[];
	/** More than one company and no `company_id` sent: no session yet, the person picks one and logs in again. */
	requires_company_selection?: boolean;
	redirect_url?: string;
	session?: AuthSessionResponse;
	verify_email_token?: string;
	user?: AuthUserResponse;
}

export interface AuthResponse {
	statusCode?: number;
	message?: string;
	data?: AuthResponseData;
	user?: AuthUserResponse;
	token?: string;
}
