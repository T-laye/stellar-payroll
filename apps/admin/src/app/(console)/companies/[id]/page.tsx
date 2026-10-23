"use client";

import { useParams } from "next/navigation";
import { CompanyDetail } from "@/features/admin/components/company-detail";

export default function CompanyPage() {
	const { id } = useParams<{ id: string }>();
	return <CompanyDetail key={id} id={id} />;
}
