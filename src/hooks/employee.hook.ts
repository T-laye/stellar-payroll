"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import {
	createCompanyEmployee,
	getCompanyEmployee,
	getCompanyEmployees,
	getEmployeeWallet,
	linkEmployeeWallet,
	terminateCompanyEmployee,
	updateCompanyEmployee,
	type CreateEmployeePayload,
	type LinkEmployeeWalletPayload,
	type UpdateEmployeePayload,
} from "@/services/employee.service";

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

	const query = useQuery({
		queryKey: ["employees", "list", resolvedCompanyId],
		queryFn: () => getCompanyEmployees(requireCompanyId(resolvedCompanyId)),
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

	const query = useQuery({
		queryKey: ["employees", "detail", resolvedCompanyId, employeeId],
		queryFn: () =>
			getCompanyEmployee(requireCompanyId(resolvedCompanyId), employeeId as string),
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

	return useMutation({
		mutationKey: ["employees", "create", resolvedCompanyId],
		mutationFn: (payload: CreateEmployeePayload) =>
			createCompanyEmployee(requireCompanyId(resolvedCompanyId), payload),
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

	return useMutation({
		mutationKey: ["employees", "update", resolvedCompanyId, employeeId],
		mutationFn: (payload: UpdateEmployeePayload) =>
			updateCompanyEmployee(
				requireCompanyId(resolvedCompanyId),
				employeeId,
				payload,
			),
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

	return useMutation({
		mutationKey: ["employees", "terminate", resolvedCompanyId],
		mutationFn: (employeeId: string) =>
			terminateCompanyEmployee(requireCompanyId(resolvedCompanyId), employeeId),
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

	return useMutation({
		mutationKey: ["employees", "wallet-link", resolvedCompanyId],
		mutationFn: ({
			employeeId,
			payload,
		}: {
			employeeId: string;
			payload: LinkEmployeeWalletPayload;
		}) =>
			linkEmployeeWallet(
				requireCompanyId(resolvedCompanyId),
				employeeId,
				payload,
			),
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

	const query = useQuery({
		queryKey: ["employees", "wallet", employeeId],
		queryFn: () => getEmployeeWallet(employeeId as string),
		enabled: Boolean(employeeId),
	});

	useEffect(() => {
		if (query.data?.data && employeeId) {
			setEmployeeWallet(employeeId, query.data.data);
		}
	}, [query.data, employeeId, setEmployeeWallet]);

	return query;
}
