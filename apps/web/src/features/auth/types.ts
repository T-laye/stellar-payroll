export interface AuthSessionResponse {
	access_token?: string;
	pay_token?: string;
	verify_email_token?: string;
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

export interface AuthResponseData {
	company_id?: string;
	company_slug?: string;
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
