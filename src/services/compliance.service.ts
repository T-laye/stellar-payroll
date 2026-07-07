import {
	getComplianceStats,
	type ComplianceStats,
	type StatsResponse,
} from "@/services/stats.service";

export type ComplianceStatsResponse = StatsResponse<ComplianceStats>;

export function getCompanyComplianceStats(companyId: string) {
	return getComplianceStats(companyId);
}
