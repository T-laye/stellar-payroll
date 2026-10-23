"use client";

import { useParams } from "next/navigation";
import { TransactionDetail } from "@/features/admin/components/transaction-detail";

export default function TransactionPage() {
	const { id } = useParams<{ id: string }>();
	return <TransactionDetail key={id} id={id} />;
}
