"use client";

import { useParams } from "next/navigation";
import { UserDetail } from "@/features/admin/components/user-detail";

export default function UserPage() {
	const { id } = useParams<{ id: string }>();
	return <UserDetail key={id} id={id} />;
}
