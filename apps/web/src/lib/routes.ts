/** Every app path in one place. Detail routes are functions of the record id. */
export const routes = {
	authRoutes: {
		SIGN_IN: "/auth/sign-in",
		SIGN_UP: "/auth/sign-up",
		FORGOT_PASSWORD: "/auth/forgot-password",
		RESET_PASSWORD: "/auth/reset-password",
		VERIFICATION_SENT: "/auth/verification-sent",
		VERIFY_EMAIL: "/auth/verify-email",
		COMPLETE_PROFILE: "/auth/complete-profile",
	},
	dashboardRoutes: {
		OVERVIEW: "/overview",
		EMPLOYEES: "/employees",
		PAYROLL: "/payroll",
		RECURRING: "/recurring",
		TRANSACTIONS: "/transactions",
		NOTIFICATIONS: "/notifications",
		REQUESTS: "/requests",
		WALLETS: "/wallets",
		ROLES: "/roles",
		SETTINGS: "/settings",
		/** Employee self-service. */
		PAYMENTS: "/payments",
		PROFILE: "/profile",
	},
	employees: {
		list: "/employees",
		create: "/employees/new",
		detail: (id: string) => `/employees/${id}`,
		edit: (id: string) => `/employees/${id}/edit`,
	},
	payroll: {
		list: "/payroll",
		create: "/payroll/new",
		detail: (id: string) => `/payroll/${id}`,
	},
	recurring: {
		list: "/recurring",
		create: "/recurring/new",
		detail: (id: string) => `/recurring/${id}`,
	},
	transactions: {
		list: "/transactions",
		detail: (id: string) => `/transactions/${id}`,
	},
	me: {
		payments: "/payments",
		payment: (id: string) => `/payments/${id}`,
	},
};
