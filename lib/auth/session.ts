export const AUTH_STORAGE_KEY = "payorbit_auth";

export interface StoredAuthSession {
	access_token: string | null;
	pay_token: string | null;
	verify_email_token: string | null;
}

interface PersistedAuthState {
	session?: StoredAuthSession | null;
}

interface PersistedAuthSnapshot {
	state?: PersistedAuthState;
	version?: number;
}

function readPersistedAuthSnapshot() {
	if (typeof window === "undefined") {
		return null;
	}

	const rawValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

	if (!rawValue) {
		return null;
	}

	try {
		return JSON.parse(rawValue) as PersistedAuthSnapshot;
	} catch {
		return null;
	}
}

export function getStoredAuthSession() {
	return readPersistedAuthSnapshot()?.state?.session ?? null;
}

export function clearStoredAuthSession() {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
