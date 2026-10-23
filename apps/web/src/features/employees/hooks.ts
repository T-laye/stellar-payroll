"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createEmployee,
	getEmployee,
	getEmployees,
	getEmployeeWallet,
	inviteEmployee,
	linkEmployeeWallet,
	terminateEmployee,
	updateEmployee,
} from "@/features/employees/api";
import type { CreateEmployeePayload, UpdateEmployeePayload } from "@/features/employees/types";
import { refreshPayroll, useCompanyId } from "@/features/payroll/hooks";

export function useEmployees() {
	const companyId = useCompanyId();
	return useQuery({
		queryKey: ["employees", companyId],
		queryFn: () => getEmployees(companyId!),
		enabled: !!companyId,
		staleTime: 30_000,
		select: (response) => response.data,
	});
}

export function useEmployee(id?: string) {
	const companyId = useCompanyId();
	return useQuery({
		queryKey: ["employees", companyId, id],
		queryFn: () => getEmployee(companyId!, id!),
		enabled: !!companyId && !!id,
		select: (response) => response.data,
	});
}

export function useEmployeeWallet(id?: string, enabled = true) {
	return useQuery({
		queryKey: ["employees", "wallet", id],
		queryFn: () => getEmployeeWallet(id!),
		enabled: !!id && enabled,
		retry: false,
		select: (response) => response.data,
	});
}

function useRefresh() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: ["employees"] });
		refreshPayroll(queryClient);
	};
}

/** Creates the employee, then links the wallet address if one was given. */
export function useCreateEmployee() {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({
		mutationFn: async ({
			payload,
			walletAddress,
			custodial,
			invite,
			key,
		}: {
			payload: CreateEmployeePayload;
			walletAddress?: string;
			custodial?: boolean;
			invite?: boolean;
			key: string;
		}) => {
			const employee = (await createEmployee(companyId!, payload, key)).data;
			// A wallet activates the employee; an empty body makes an admin-held custodial wallet.
			if (walletAddress || custodial) await linkEmployeeWallet(companyId!, employee.id, walletAddress);
			if (invite) await inviteEmployee(companyId!, employee.id);
			return employee;
		},
		onSuccess: refresh,
	});
}

export function useUpdateEmployee(id: string) {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({
		mutationFn: async ({ payload, walletAddress }: { payload: UpdateEmployeePayload; walletAddress?: string }) => {
			const employee = (await updateEmployee(companyId!, id, payload)).data;
			if (walletAddress && walletAddress !== employee.wallet?.stellar_address)
				await linkEmployeeWallet(companyId!, id, walletAddress);
			return employee;
		},
		onSuccess: refresh,
	});
}

export function useSetEmployeeStatus() {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => updateEmployee(companyId!, id, { status }),
		onSuccess: refresh,
	});
}

export function useTerminateEmployee() {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({ mutationFn: (id: string) => terminateEmployee(companyId!, id), onSuccess: refresh });
}

/** Sends (or re-sends) the employee's portal invite. */
export function useInviteEmployee(id: string) {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({ mutationFn: () => inviteEmployee(companyId!, id), onSuccess: refresh });
}

/** Links an external address, or creates a custodial wallet when no address is given. */
export function useLinkWallet(id: string) {
	const companyId = useCompanyId();
	const refresh = useRefresh();
	return useMutation({ mutationFn: (address?: string) => linkEmployeeWallet(companyId!, id, address), onSuccess: refresh });
}
