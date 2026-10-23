import { FULL_PAGE, api, type PageMeta } from "@/lib/api/request";
import type {
	CompanyEmployee,
	CreateEmployeePayload,
	EmployeeWalletDetail,
	UpdateEmployeePayload,
} from "@/features/employees/types";

export const EMPLOYEE_ENDPOINTS = {
	list: (companyId: string) => `/companies/${companyId}/employees`,
	detail: (companyId: string, employeeId: string) => `/companies/${companyId}/employees/${employeeId}`,
	linkWallet: (companyId: string, employeeId: string) => `/companies/${companyId}/employees/${employeeId}/wallet`,
	invite: (companyId: string, employeeId: string) => `/companies/${companyId}/employees/${employeeId}/invite`,
	wallet: (employeeId: string) => `/employees/${employeeId}/wallet`,
} as const;

export const getEmployees = (companyId: string) =>
	api.get<CompanyEmployee[], PageMeta>(EMPLOYEE_ENDPOINTS.list(companyId), { page_size: FULL_PAGE });
export const getEmployee = (companyId: string, id: string) => api.get<CompanyEmployee>(EMPLOYEE_ENDPOINTS.detail(companyId, id));
export const createEmployee = (companyId: string, payload: CreateEmployeePayload, key?: string) =>
	api.post<CompanyEmployee>(EMPLOYEE_ENDPOINTS.list(companyId), payload, key);
export const updateEmployee = (companyId: string, id: string, payload: UpdateEmployeePayload) =>
	api.patch<CompanyEmployee>(EMPLOYEE_ENDPOINTS.detail(companyId, id), payload);
/** The API terminates (the record stays, for payroll history). */
export const terminateEmployee = (companyId: string, id: string) => api.delete<null>(EMPLOYEE_ENDPOINTS.detail(companyId, id));
/** An address links an external wallet; no address asks the API to create a custodial one. */
export const linkEmployeeWallet = (companyId: string, id: string, stellarAddress?: string) =>
	api.post<{ id: string; stellar_address: string }>(
		EMPLOYEE_ENDPOINTS.linkWallet(companyId, id),
		stellarAddress ? { stellar_address: stellarAddress } : {},
	);
/** Creates the portal login and emails a set-password link (201); again while pending re-sends it (200); 409 once they've signed in. */
export const inviteEmployee = (companyId: string, id: string) => api.post<CompanyEmployee>(EMPLOYEE_ENDPOINTS.invite(companyId, id));
export const getEmployeeWallet = (id: string) => api.get<EmployeeWalletDetail>(EMPLOYEE_ENDPOINTS.wallet(id));
