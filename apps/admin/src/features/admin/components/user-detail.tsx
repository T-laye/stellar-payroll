"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, ShieldOff, UserX } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton } from "@/components/hash";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/person";
import { DetailList, SectionCard } from "@/components/section-card";
import { CardSkeleton, ErrorState } from "@/components/states";
import { TonePill } from "@/components/status-pill";
import {
	useCompany,
	useGrantPlatformAdmin,
	usePlatformAdmins,
	useRevokePlatformAdmin,
	useSetUserActive,
	useUser,
} from "@/features/admin/hooks";
import { fullName } from "@/features/admin/labels";
import { useUserNames } from "@/features/admin/lookups";
import { useAdminSession } from "@/features/auth/session";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatDateTime } from "@/lib/format";

type Pending = "deactivate" | "reactivate" | "grant" | "revoke" | null;

export function UserDetail({ id }: { id: string }) {
	const me = useAdminSession((s) => s.user);
	const user = useUser(id);
	const u = user.data;
	const company = useCompany(u?.company_id);
	const admins = usePlatformAdmins();
	const userName = useUserNames();
	const setActive = useSetUserActive();
	const grant = useGrantPlatformAdmin();
	const revoke = useRevokePlatformAdmin();
	const [pending, setPending] = useState<Pending>(null);
	const [key, setKey] = useState(newIdempotencyKey);
	const adminRecord = admins.data?.find((a) => a.user_id === id);
	const isSelf = id === me?.id;
	const lastAdmin = !!adminRecord && admins.data?.length === 1;
	const name = u ? fullName(u) : "User";

	if (user.isError) {
		return (
			<>
				<PageHeader title="User" breadcrumbs={[{ label: "Users", href: "/users" }, { label: "Not found" }]} />
				<SectionCard>
					<ErrorState title="We couldn't load this user" message={errorMessage(user.error)} onRetry={() => user.refetch()} />
				</SectionCard>
			</>
		);
	}

	const done = (message: string) => {
		toast.success(message);
		setPending(null);
		setKey(newIdempotencyKey());
	};
	const failed = (error: unknown) => {
		toast.error(errorMessage(error));
		setKey(newIdempotencyKey());
	};

	const confirm = () => {
		if (!u) return;
		if (pending === "deactivate" || pending === "reactivate") {
			const active = pending === "reactivate";
			setActive.mutate({ id, active, key }, { onSuccess: () => done(active ? `${name} can sign in again` : `${name} is deactivated`), onError: failed });
		} else if (pending === "grant") {
			grant.mutate({ userId: id, key }, { onSuccess: () => done(`${name} is now a platform admin`), onError: failed });
		} else if (pending === "revoke") {
			revoke.mutate(id, { onSuccess: () => done(`${name} is no longer a platform admin`), onError: failed });
		}
	};

	const dialog: Record<Exclude<Pending, null>, { title: string; description: string; label: string; destructive?: boolean }> = {
		deactivate: {
			title: `Deactivate ${name}?`,
			description: "They're signed out and can't sign in until you reactivate them. Their records stay.",
			label: "Deactivate",
			destructive: true,
		},
		reactivate: { title: `Reactivate ${name}?`, description: "They can sign in again with their existing password.", label: "Reactivate" },
		grant: {
			title: `Make ${name} a platform admin?`,
			description: "They'll see every company, user and payment on PayOrbit, and can suspend companies and manage other admins.",
			label: "Grant access",
		},
		revoke: {
			title: `Remove ${name}'s platform access?`,
			description: "They keep their company account but lose this console.",
			label: "Remove access",
			destructive: true,
		},
	};
	const busy = setActive.isPending || grant.isPending || revoke.isPending;

	return (
		<>
			<PageHeader
				title={name}
				breadcrumbs={[{ label: "Users", href: "/users" }, { label: name }]}
				badge={
					u && (
						<span className="flex flex-wrap gap-1.5">
							<TonePill label={u.is_active ? "Active" : "Deactivated"} tone={u.is_active ? "success" : "neutral"} />
							{adminRecord && <TonePill label="Platform admin" tone="brand" />}
						</span>
					)
				}
				description={u?.email}
				actions={
					u && (
						<div className="flex flex-wrap gap-2">
							{adminRecord ? (
								<Button
									variant="outline"
									disabled={lastAdmin}
									title={lastAdmin ? "PayOrbit needs at least one platform admin" : undefined}
									onClick={() => setPending("revoke")}
								>
									<ShieldOff /> Remove admin access
								</Button>
							) : (
								<Button variant="outline" disabled={!u.is_active} onClick={() => setPending("grant")}>
									<ShieldCheck /> Make platform admin
								</Button>
							)}
							{u.is_active ? (
								<Button
									variant="outline"
									className="text-destructive hover:text-destructive"
									disabled={isSelf}
									title={isSelf ? "You can't deactivate yourself" : undefined}
									onClick={() => setPending("deactivate")}
								>
									<UserX /> Deactivate
								</Button>
							) : (
								<Button onClick={() => setPending("reactivate")}>
									<RotateCcw /> Reactivate
								</Button>
							)}
						</div>
					)
				}
			/>

			<div className="grid gap-6 lg:grid-cols-3">
				<SectionCard title="Account" className="lg:col-span-2">
					{user.isLoading || !u ? (
						<CardSkeleton className="h-40" />
					) : (
						<DetailList
							columns={2}
							items={[
								{ label: "Name", value: name },
								{ label: "Email", value: u.email },
								{
									label: "Company",
									value: (
										<Link href={`/companies/${u.company_id}`} className="font-medium text-primary hover:underline">
											{company.data?.name ?? "View company"}
										</Link>
									),
								},
								{ label: "Role", value: u.role_name || "--" },
								{ label: "Email verified", value: u.email_verified_at ? formatDateTime(u.email_verified_at) : "Not yet" },
								{ label: "Last sign-in", value: u.last_login_at ? formatDateTime(u.last_login_at) : "Never" },
								{ label: "Joined", value: formatDateTime(u.created_at) },
								{
									label: "User ID",
									value: (
										<span className="flex items-center gap-1">
											<span className="truncate font-mono text-xs">{u.id}</span>
											<CopyButton value={u.id} label="Copy user ID" />
										</span>
									),
								},
							]}
						/>
					)}
				</SectionCard>

				<SectionCard title="Console access">
					{u && (
						<div className="flex items-start gap-3">
							<Avatar name={name} />
							<div className="min-w-0 text-sm">
								{adminRecord ? (
									<>
										<p className="font-medium text-foreground">Platform admin</p>
										<p className="mt-0.5 text-muted-foreground">
											Since {formatDateTime(adminRecord.created_at)}
											{adminRecord.granted_by ? `, granted by ${userName(adminRecord.granted_by)}` : ""}.
										</p>
									</>
								) : (
									<>
										<p className="font-medium text-foreground">No console access</p>
										<p className="mt-0.5 text-muted-foreground">They only see their own company in the PayOrbit app.</p>
									</>
								)}
							</div>
						</div>
					)}
				</SectionCard>
			</div>

			{pending && (
				<ConfirmDialog
					open
					onOpenChange={(open) => !open && setPending(null)}
					title={dialog[pending].title}
					description={dialog[pending].description}
					confirmLabel={dialog[pending].label}
					tone={dialog[pending].destructive ? "destructive" : "default"}
					loading={busy}
					onConfirm={confirm}
				/>
			)}
		</>
	);
}
