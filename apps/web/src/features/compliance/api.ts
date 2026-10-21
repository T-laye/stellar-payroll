import { getComplianceStats } from "@/features/stats/api";

export function getCompanyComplianceStats(companyId: string) {
	return getComplianceStats(companyId);
}
