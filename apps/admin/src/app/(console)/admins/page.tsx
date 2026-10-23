"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/dialog";
import { toast } from "@repo/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { PersonCell } from "@/components/person";
import { SectionCard } from "@/components/section-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { SearchBox } from "@/features/admin/components/filters";
import { useGrantPlatformAdmin, usePlatformAdmins, useRevokePlatformAdmin, useUsers } from "@/features/admin/hooks";
import { fullName } from "@/features/admin/labels";
import { useCompanyNames, useUserNames } from "@/features/admin/lookups";
import type { PlatformAdmin, PlatformUser } from "@/features/admin/types";
import { useAdminSession } from "@/features/auth/session";
import { errorMessage, newIdempotencyKey } from "@/lib/api/request";
import { formatDate } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

/** Find an active user by name or email and make them a platform admin. */
function GrantDialog({ open, onOpenChange, adminIds }: { open: boolean; onOpenChange: (open: boolean) => void; adminIds: Set<string> }) {
	const [search, setSearch] = useState("");
	const [key, setKey] = useState(newIdempotencyKey);
	const term = useDebounced(search.trim());
	const users = useUsers({ search: term, is_active: "true", limit: 8 }, open && term.length >= 2);
	const companyName = useCompanyNames();
	const grant = useGrantPlatformAdmin();
	const candidates = (users.data?.data ?? []).filter((u) => !adminIds.has(u.id));

	const pick = (u: PlatformUser) =>
		grant.mutate(
			{ userId: u.id, key },
			{
				onSuccess: () => {
					toast.success(`${fullName(u)} is now a platform admin`);
					setKey(newIdempotencyKey());
					setSearch("");
					onOpenChange(false);
				},
				onError: (error) => {
					toast.error(errorMessage(error));
					setKey(newIdempotencyKey());
				},
			},
		);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add a platform admin</DialogTitle>
					<DialogDescription>
						They&apos;ll see every company, user and payment, and can suspend companies and manage admins. Only PayOrbit staff should
						have this.
					</DialogDescription>
				</DialogHeader>
				<SearchBox value={search} onChange={setSearch} label="Search users by name or email" className="lg:w-full" />
				<div className="max-h-80 min-h-24 overflow-y-auto rounded-lg border border-border">
					{search.trim().length < 2 ? (
						<p className="p-4 text-sm text-muted-foreground">Type at least two letters.</p>
					) : term !== search.trim() || users.isLoading ? (
						<p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" /> Searching…
						</p>
					) : candidates.length === 0 ? (
						<p className="p-4 text-sm text-muted-foreground">No active users match who aren&apos;t admins already.</p>
					) : (
						<ul className="divide-y divide-border">
							{candidates.map((u) => (
								<li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
									<PersonCell name={fullName(u)} subtitle={`${u.email} · ${companyName(u.company_id)}`} className="min-w-0 flex-1" size="sm" />
									<Button size="sm" variant="outline" disabled={grant.isPending} onClick={() => pick(u)}>
										{grant.isPending && grant.variables?.userId === u.id ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Grant
									</Button>
								</li>
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

/** The PayOrbit staff who can use this console. There's always at least one. */
export default function AdminsPage() {
	const me = useAdminSession((s) => s.user);
	const { data, isLoading, isError, error, refetch } = usePlatformAdmins();
	const revoke = useRevokePlatformAdmin();
	const userName = useUserNames();
	const [granting, setGranting] = useState(false);
	const [removing, setRemoving] = useState<PlatformAdmin | null>(null);
	const admins = data ?? [];
	const adminIds = new Set(admins.map((a) => a.user_id));
	const onlyOne = admins.length <= 1;

	const confirmRevoke = () => {
		if (!removing) return;
		revoke.mutate(removing.user_id, {
			onSuccess: () => {
				toast.success(`${fullName(removing)} is no longer a platform admin`);
				setRemoving(null);
			},
			onError: (e) => toast.error(errorMessage(e)),
		});
	};

	return (
		<>
			<PageHeader
				title="Platform admins"
				description="PayOrbit staff with access to this console."
				actions={
					<Button onClick={() => setGranting(true)}>
						<UserPlus /> Add admin
					</Button>
				}
			/>
			<SectionCard flush>
				{isLoading ? (
					<TableSkeleton rows={3} columns={4} />
				) : isError ? (
					<ErrorState message={errorMessage(error, "We couldn't load platform admins.")} onRetry={() => refetch()} />
				) : admins.length === 0 ? (
					<EmptyState icon={ShieldCheck} title="No platform admins" />
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-5">Admin</TableHead>
									<TableHead className="hidden md:table-cell">Granted by</TableHead>
									<TableHead className="hidden sm:table-cell">Since</TableHead>
									<TableHead className="w-32 pr-5 text-right">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{admins.map((a) => (
									<TableRow key={a.user_id}>
										<TableCell className="max-w-64 pl-5 sm:max-w-80">
											<Link href={`/users/${a.user_id}`} className="block hover:[&_span]:text-primary">
												<PersonCell name={`${fullName(a)}${a.user_id === me?.id ? " (you)" : ""}`} subtitle={a.email} />
											</Link>
										</TableCell>
										<TableCell className="hidden text-muted-foreground md:table-cell">
											{a.granted_by ? userName(a.granted_by) : "Set up with PayOrbit"}
										</TableCell>
										<TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(a.created_at)}</TableCell>
										<TableCell className="pr-5 text-right">
											<Button
												variant="ghost"
												size="sm"
												className="text-destructive hover:text-destructive"
												disabled={onlyOne}
												title={onlyOne ? "PayOrbit needs at least one platform admin" : undefined}
												onClick={() => setRemoving(a)}
											>
												<ShieldOff /> Remove
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</SectionCard>

			<GrantDialog open={granting} onOpenChange={setGranting} adminIds={adminIds} />
			{removing && (
				<ConfirmDialog
					open
					onOpenChange={(open) => !open && setRemoving(null)}
					title={removing.user_id === me?.id ? "Remove your own access?" : `Remove ${fullName(removing)}?`}
					description={
						removing.user_id === me?.id
							? "You'll lose this console straight away. Your company account isn't affected."
							: "They keep their company account but lose this console."
					}
					confirmLabel="Remove access"
					tone="destructive"
					loading={revoke.isPending}
					onConfirm={confirmRevoke}
				/>
			)}
		</>
	);
}
