export interface CurrentUserData {
	company_id: string;
	created_at: string;
	email: string;
	email_verified_at: string | null;
	first_name: string;
	id: string;
	is_active: boolean;
	last_login_at: string | null;
	last_name: string;
	role_id: string;
	role_name: string;
}

export interface CurrentUserResponse {
	data: CurrentUserData;
	message: string;
	statusCode: number;
}

export interface UpdateCurrentUserPayload extends Record<string, unknown> {
	first_name: string;
	last_name: string;
}
