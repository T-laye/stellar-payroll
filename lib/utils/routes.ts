export const routes = {
	authRoutes: {
		SIGN_IN: "/auth/sign-in",
		SIGN_UP: "/auth/sign-up",
		FORGOT_PASSWORD: "/auth/forgot-password",
		RESET_PASSWORD: "/auth/reset-password",
		VERIFICATION_SENT: "/auth/verification-sent",
		VERIFY_EMAIL: "/auth/verify-email",
	},
	dashboardRoutes: {
		OVERVIEW: "/dashboard",
        EMPLOYEES:'/dashboard/employees',
        PAYROLL_GROUPS:'/dashboard/payroll',
        PAYMENTS:'/dashboard/payments',
        SETTINGS:'/dashboard/settings'
	},
};
