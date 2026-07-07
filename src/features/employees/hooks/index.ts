"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import useAxiosAuth from "@/hooks/useAxiosAuth";

export const EMPLOYEE_ENDPOINTS = {
	list: (companyId: string) => `/companies/${companyId}/employees`,
	detail: (companyId: string, employeeId: string) =>
		`/companies/${companyId}/employees/${employeeId}`,
	linkWallet: (companyId: string, employeeId: string) =>
		`/companies/${companyId}/employees/${employeeId}/wallet`,
	walletDetail: (employeeId: string) => `/employees/${employeeId}/wallet`,
} as const;

export interface EmployeeWalletSummary {
	id: string;
	is_funded: boolean;
	network: string;
	stellar_address: string;
}

export interface CompanyEmployee {
	company_id: string;
	country: string;
	created_at: string;
	department: string;
	email: string;
	employee_number: string;
	employment_type: string;
	role_slug: string;
	end_date: string | null;
	external_id: string;
	first_name: string;
	group_id: string | null;
	id: string;
	job_title: string;
	last_name: string;
	phone: string;
	salary_amount: string;
	salary_currency: string;
	start_date: string;
	status: string;
	updated_at: string;
	wallet?: EmployeeWalletSummary | null;
}

export interface EmployeeListResponse {
	data: CompanyEmployee[];
	message: string;
	statusCode: number;
}

export interface EmployeeResponse {
	data: CompanyEmployee;
	message: string;
	statusCode: number;
}

export interface EmployeeWalletBalance {
	amount: string;
	asset: string;
}

export interface EmployeeLastPayment {
	amount: string;
	asset: string;
	confirmed_at: string;
	from_address: string;
	stellar_tx_hash: string;
	transaction_id: string;
}

export interface EmployeeWalletDetail {
	balances: EmployeeWalletBalance[];
	created_at: string;
	id: string;
	is_funded: boolean;
	last_payment: EmployeeLastPayment | null;
	network: string;
	owner_id: string;
	owner_type: string;
	stellar_address: string;
	total_payments_received: number;
	updated_at: string;
	wallet_type: string;
}

export interface EmployeeWalletResponse {
	data: EmployeeWalletDetail;
	message: string;
	statusCode: number;
}

export interface GenericEmployeeResponse<T = Record<string, unknown>> {
	data: T;
	message: string;
	statusCode: number;
}

export interface CreateEmployeePayload extends Record<string, unknown> {
	country: string;
	department: string;
	email: string;
	employment_type: string;
	external_id?: string;
	first_name: string;
	group_id?: string;
	job_title: string;
	last_name: string;
	phone: string;
	salary_amount: string;
	salary_currency: string;
	start_date: string;
	role_slug: string;
}

export interface UpdateEmployeePayload extends Record<string, unknown> {
	department?: string;
	employment_type?: string;
	end_date?: string | null;
	external_id?: string;
	first_name?: string;
	group_id?: string | null;
	job_title?: string;
	last_name?: string;
	phone?: string;
	salary_amount?: string;
	salary_currency?: string;
	status?: string;
	role_slug?: string;
}

export interface LinkEmployeeWalletPayload extends Record<string, unknown> {
	stellar_address?: string;
}

function useResolvedCompanyId(companyId?: string) {
	const currentCompanyId = useAuthStore((state) => state.user?.company_id);
	return companyId ?? currentCompanyId ?? null;
}

function requireCompanyId(companyId: string | null) {
	if (!companyId) {
		throw new Error("Company ID is required");
	}
	return companyId;
}

function invalidateEmployeeRelatedQueries(
	queryClient: ReturnType<typeof useQueryClient>,
	companyId: string | null,
) {
	queryClient.invalidateQueries({
		queryKey: ["employees", "list", companyId],
	});
	queryClient.invalidateQueries({
		queryKey: ["stats", "employees", companyId],
	});
	queryClient.invalidateQueries({
		queryKey: ["stats", "overview", companyId],
	});
	queryClient.invalidateQueries({
		queryKey: ["stats", "wallets", companyId],
	});
}

export function useCompanyEmployees(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setEmployees = useEmployeeStore((state) => state.setEmployees);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["employees", "list", resolvedCompanyId],
		queryFn: async () => {
			const res = await axiosAuth.get<EmployeeListResponse>(
				EMPLOYEE_ENDPOINTS.list(requireCompanyId(resolvedCompanyId))
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId),
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data?.data) {
			setEmployees(query.data.data);
		}
	}, [query.data, setEmployees]);

	return query;
}

export function useEmployeeDetails(employeeId?: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const setSelectedEmployee = useEmployeeStore((state) => state.setSelectedEmployee);
	const upsertEmployee = useEmployeeStore((state) => state.upsertEmployee);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["employees", "detail", resolvedCompanyId, employeeId],
		queryFn: async () => {
			const res = await axiosAuth.get<EmployeeResponse>(
				EMPLOYEE_ENDPOINTS.detail(requireCompanyId(resolvedCompanyId), employeeId as string)
			);
			return res.data;
		},
		enabled: Boolean(resolvedCompanyId && employeeId),
	});

	useEffect(() => {
		if (query.data?.data) {
			setSelectedEmployee(query.data.data);
			upsertEmployee(query.data.data);
		}
	}, [query.data, setSelectedEmployee, upsertEmployee]);

	return query;
}

export function useCreateEmployee(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertEmployee = useEmployeeStore((state) => state.upsertEmployee);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["employees", "create", resolvedCompanyId],
		mutationFn: async (payload: CreateEmployeePayload) => {
			const res = await axiosAuth.post<EmployeeResponse>(
				EMPLOYEE_ENDPOINTS.list(requireCompanyId(resolvedCompanyId)),
				payload
			);
			return res.data;
		},
		onSuccess: (response) => {
			upsertEmployee(response.data);
			invalidateEmployeeRelatedQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useUpdateEmployee(employeeId: string, companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const upsertEmployee = useEmployeeStore((state) => state.upsertEmployee);
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["employees", "update", resolvedCompanyId, employeeId],
		mutationFn: async (payload: UpdateEmployeePayload) => {
			const res = await axiosAuth.patch<EmployeeResponse>(
				EMPLOYEE_ENDPOINTS.detail(requireCompanyId(resolvedCompanyId), employeeId),
				payload
			);
			return res.data;
		},
		onSuccess: (response) => {
			upsertEmployee(response.data);
			queryClient.setQueryData(
				["employees", "detail", resolvedCompanyId, employeeId],
				response,
			);
			invalidateEmployeeRelatedQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useTerminateEmployee(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["employees", "terminate", resolvedCompanyId],
		mutationFn: async (employeeId: string) => {
			const res = await axiosAuth.delete<GenericEmployeeResponse>(
				EMPLOYEE_ENDPOINTS.detail(requireCompanyId(resolvedCompanyId), employeeId)
			);
			return res.data;
		},
		onSuccess: (_, employeeId) => {
			queryClient.removeQueries({
				queryKey: ["employees", "detail", resolvedCompanyId, employeeId],
			});
			invalidateEmployeeRelatedQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useLinkEmployeeWallet(companyId?: string) {
	const resolvedCompanyId = useResolvedCompanyId(companyId);
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationKey: ["employees", "wallet-link", resolvedCompanyId],
		mutationFn: async ({
			employeeId,
			payload,
		}: {
			employeeId: string;
			payload: LinkEmployeeWalletPayload;
		}) => {
			const res = await axiosAuth.post<GenericEmployeeResponse>(
				EMPLOYEE_ENDPOINTS.linkWallet(requireCompanyId(resolvedCompanyId), employeeId),
				payload
			);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["employees", "wallet", variables.employeeId],
			});
			invalidateEmployeeRelatedQueries(queryClient, resolvedCompanyId);
		},
	});
}

export function useEmployeeWalletDetails(employeeId?: string) {
	const setEmployeeWallet = useEmployeeStore((state) => state.setEmployeeWallet);
	const axiosAuth = useAxiosAuth();

	const query = useQuery({
		queryKey: ["employees", "wallet", employeeId],
		queryFn: async () => {
			const res = await axiosAuth.get<EmployeeWalletResponse>(
				EMPLOYEE_ENDPOINTS.walletDetail(employeeId as string)
			);
			return res.data;
		},
		enabled: Boolean(employeeId),
	});

	useEffect(() => {
		if (query.data?.data && employeeId) {
			setEmployeeWallet(employeeId, query.data.data);
		}
	}, [query.data, employeeId, setEmployeeWallet]);

	return query;
}
