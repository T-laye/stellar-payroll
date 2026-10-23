import { api } from "@/lib/api/request";
import type {
	AuditFilters,
	AuditLog,
	Company,
	CompanyFilters,
	PageMeta,
	PlatformAdmin,
	PlatformOverview,
	PlatformTransaction,
	PlatformUser,
	TransactionFilters,
	UserFilters,
} from "@/features/admin/types";

/** PayOrbit's platform endpoints: every company, platform admins only. */
export const ADMIN_ENDPOINTS = {
	overview: "/admin/stats/overview",
	companies: "/admin/companies",
	company: (id: string) => `/admin/companies/${id}`,
	companyAction: (id: string, action: "suspend" | "reactivate") => `/admin/companies/${id}/${action}`,
	users: "/admin/users",
	user: (id: string) => `/admin/users/${id}`,
	userAction: (id: string, action: "deactivate" | "reactivate") => `/admin/users/${id}/${action}`,
	transactions: "/admin/transactions",
	transaction: (id: string) => `/admin/transactions/${id}`,
	auditLogs: "/admin/audit-logs",
	admins: "/admin/platform-admins",
	admin: (userId: string) => `/admin/platform-admins/${userId}`,
} as const;

export const getOverview = () => api.get<PlatformOverview>(ADMIN_ENDPOINTS.overview);

export const getCompanies = (filters: CompanyFilters) => api.get<Company[], PageMeta>(ADMIN_ENDPOINTS.companies, { ...filters });
export const getCompany = (id: string) => api.get<Company>(ADMIN_ENDPOINTS.company(id));
export const setCompanyActive = (id: string, active: boolean, key?: string) =>
	api.patch<Company>(ADMIN_ENDPOINTS.companyAction(id, active ? "reactivate" : "suspend"), undefined, key);

export const getUsers = (filters: UserFilters) => api.get<PlatformUser[], PageMeta>(ADMIN_ENDPOINTS.users, { ...filters });
export const getUser = (id: string) => api.get<PlatformUser>(ADMIN_ENDPOINTS.user(id));
export const setUserActive = (id: string, active: boolean, key?: string) =>
	api.patch<PlatformUser>(ADMIN_ENDPOINTS.userAction(id, active ? "reactivate" : "deactivate"), undefined, key);

export const getTransactions = (filters: TransactionFilters) =>
	api.get<PlatformTransaction[], PageMeta>(ADMIN_ENDPOINTS.transactions, { ...filters });
export const getTransaction = (id: string) => api.get<PlatformTransaction>(ADMIN_ENDPOINTS.transaction(id));

export const getAuditLogs = (filters: AuditFilters) => api.get<AuditLog[], PageMeta>(ADMIN_ENDPOINTS.auditLogs, { ...filters });

export const getPlatformAdmins = () => api.get<PlatformAdmin[]>(ADMIN_ENDPOINTS.admins);
/** Answers the updated list. 409 if they're already one. */
export const grantPlatformAdmin = (userId: string, key?: string) => api.post<PlatformAdmin[]>(ADMIN_ENDPOINTS.admins, { user_id: userId }, key);
/** Answers the updated list. 409 for the last remaining admin. */
export const revokePlatformAdmin = (userId: string) => api.delete<PlatformAdmin[]>(ADMIN_ENDPOINTS.admin(userId));
