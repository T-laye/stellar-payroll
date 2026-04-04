"use client";

import { useMemo, useState } from "react";
import { Lock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
	useCompanyPermissions,
	useCompanyRoles,
	useCreateRole,
	useDeleteRole,
	useUpdateRole,
} from "@/hooks/role.hook";
import { useRoleStore } from "@/lib/stores/role-store";
import { type Role } from "@/services/role.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DeleteDialog from "../shared/DeleteDialog";

interface RoleFormState {
	name: string;
	slug: string;
	description: string;
	permissions: string[];
	is_active: boolean;
}

const emptyRoleForm: RoleFormState = {
	name: "",
	slug: "",
	description: "",
	permissions: [],
	is_active: true,
};

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function isOwnerRole(role: Pick<Role, "slug"> | null) {
	return role?.slug === "owner";
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
		</div>
	);
}

export function RolesManager() {
	const companyId = useAuthStore((state) => state.user?.company_id);
	const roles = useRoleStore((state) => state.roles);
	const permissions = useRoleStore((state) => state.permissions);
	const { isLoading: rolesLoading, isFetching: rolesFetching } =
		useCompanyRoles(companyId ?? undefined);
	const { isLoading: permissionsLoading } = useCompanyPermissions(
		companyId ?? undefined,
	);
	const { mutateAsync: createRole, isPending: isCreating } = useCreateRole(
		companyId ?? undefined,
	);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole(
		editingRole?.id ?? "",
		companyId ?? undefined,
	);
	const { mutateAsync: deleteRole, isPending: isDeleting } = useDeleteRole(
		companyId ?? undefined,
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [slugTouched, setSlugTouched] = useState(false);
	const [formState, setFormState] = useState<RoleFormState>(emptyRoleForm);

	// Delete dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

	const groupedPermissions = useMemo(() => {
		return permissions.reduce<Record<string, string[]>>((acc, permission) => {
			const group = permission.includes(":")
				? permission.split(":")[0]
				: "general";
			const title = group.charAt(0).toUpperCase() + group.slice(1);
			acc[title] = acc[title] ? [...acc[title], permission] : [permission];
			return acc;
		}, {});
	}, [permissions]);

	const resetDialog = () => {
		setEditingRole(null);
		setFormState(emptyRoleForm);
		setSlugTouched(false);
		setDialogOpen(false);
	};

	const openCreateDialog = () => {
		setEditingRole(null);
		setFormState(emptyRoleForm);
		setSlugTouched(false);
		setDialogOpen(true);
	};

	const openEditDialog = (role: Role) => {
		if (isOwnerRole(role)) {
			toast.info("Owner role is locked", {
				description: "The owner role and its permissions cannot be edited.",
			});
			return;
		}

		setEditingRole(role);
		setFormState({
			name: role.name,
			slug: role.slug,
			description: role.description,
			permissions: role.permissions.includes("*") ? [] : role.permissions,
			is_active: role.is_active,
		});
		setSlugTouched(true);
		setDialogOpen(true);
	};

	const togglePermission = (permission: string, checked: boolean) => {
		setFormState((current) => ({
			...current,
			permissions: checked
				? [...current.permissions, permission]
				: current.permissions.filter((item) => item !== permission),
		}));
	};

	const handleNameChange = (value: string) => {
		setFormState((current) => ({
			...current,
			name: value,
			slug:
				editingRole || slugTouched
					? current.slug
					: slugify(value || current.slug),
		}));
	};

	const handleSubmit = async () => {
		const name = formState.name.trim();
		const slug = formState.slug.trim();
		const description = formState.description.trim();

		if (!name || (!editingRole && !slug)) {
			toast.error("Role name and slug are required.");
			return;
		}

		if (!formState.permissions.length) {
			toast.error("Select at least one permission for this role.");
			return;
		}

		try {
			if (editingRole) {
				await updateRole({
					name,
					description,
					is_active: formState.is_active,
					permissions: formState.permissions,
				});
				toast.success("Role updated successfully.");
			} else {
				await createRole({
					name,
					slug,
					description,
					permissions: formState.permissions,
				});
				toast.success("Role created successfully.");
			}

			resetDialog();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save role.",
			);
		}
	};

	const handleDeleteClick = (role: Role) => {
		if (isOwnerRole(role)) {
			toast.info("Owner role is locked", {
				description: "The owner role cannot be deleted.",
			});
			return;
		}
		setRoleToDelete(role);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!roleToDelete) return;
		try {
			await deleteRole(roleToDelete.id);
			toast.success("Role deleted successfully.");
			setDeleteDialogOpen(false);
			setRoleToDelete(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete role.",
			);
		}
	};

	if (!companyId) {
		return (
			<div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
				Company context is required before roles can be managed.
			</div>
		);
	}

	const isSavingRole = isCreating || isUpdating;

	return (
		<>
			<div className="space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-sm font-medium text-foreground">Company Roles</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Default roles appear automatically for every company. The owner
							role is locked, but you can create custom roles and edit other
							roles as needed.
						</p>
					</div>
					<Button className="gap-2" onClick={openCreateDialog}>
						<Plus className="h-4 w-4" />
						Create Role
					</Button>
				</div>

				{rolesLoading || permissionsLoading ? (
					<div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
						Loading roles and permissions...
					</div>
				) : roles.length === 0 ? (
					<div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
						No roles found for this company yet.
					</div>
				) : (
					<div className="grid gap-4">
						{roles.map((role) => {
							const locked = isOwnerRole(role);
							const previewPermissions = role.permissions.includes("*")
								? ["Full platform access"]
								: role.permissions.slice(0, 4);

							return (
								<div
									key={role.id}
									className="rounded-2xl border border-border bg-muted/20 p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-foreground">
													{role.name}
												</p>
												<Badge variant="outline">{role.slug}</Badge>
												{role.is_system && (
													<Badge variant="secondary">System</Badge>
												)}
												{locked && (
													<Badge variant="outline" className="gap-1">
														<Lock className="h-3 w-3" />
														Locked
													</Badge>
												)}
												{!role.is_active && (
													<Badge variant="destructive">Inactive</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">
												{role.description || "No description provided."}
											</p>
											<div className="flex flex-wrap gap-2">
												{previewPermissions.map((permission) => (
													<Badge
														key={`${role.id}-${permission}`}
														variant="outline"
													>
														{permission}
													</Badge>
												))}
												{role.permissions.length > 4 &&
													!role.permissions.includes("*") && (
														<Badge variant="outline">
															+{role.permissions.length - 4} more
														</Badge>
													)}
											</div>
										</div>

										<div className="flex flex-wrap items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												className="gap-2"
												onClick={() => openEditDialog(role)}
												disabled={locked || rolesFetching}
											>
												<Pencil className="h-4 w-4" />
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-2 text-destructive hover:text-destructive"
												onClick={() => handleDeleteClick(role)}
												disabled={locked || isDeleting}
											>
												<Trash2 className="h-4 w-4" />
												Delete
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Create / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={(open) => !open && resetDialog()}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>
							{editingRole ? `Edit ${editingRole.name}` : "Create Role"}
						</DialogTitle>
						<DialogDescription>
							Choose a role name, add a description, and assign the exact
							permissions this role should have.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Role Name">
							<Input
								value={formState.name}
								onChange={(event) => handleNameChange(event.target.value)}
								placeholder="Payroll Reviewer"
							/>
						</Field>

						<Field label="Slug">
							<Input
								value={formState.slug}
								onChange={(event) => {
									setSlugTouched(true);
									setFormState((current) => ({
										...current,
										slug: slugify(event.target.value),
									}));
								}}
								disabled={Boolean(editingRole)}
								placeholder="payroll-reviewer"
							/>
						</Field>
					</div>

					<Field label="Description">
						<Textarea
							value={formState.description}
							onChange={(event) =>
								setFormState((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							placeholder="Describe what this role is allowed to do."
						/>
					</Field>

					{editingRole && (
						<label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
							<Checkbox
								checked={formState.is_active}
								onCheckedChange={(checked) =>
									setFormState((current) => ({
										...current,
										is_active: checked === true,
									}))
								}
								className="border-muted-foreground data-[state=checked]:border-primary"
							/>
							<div>
								<p className="text-sm font-medium text-foreground">
									Role is active
								</p>
								<p className="text-xs text-muted-foreground">
									Inactive roles remain visible but can be treated as disabled.
								</p>
							</div>
						</label>
					)}

					<div className="space-y-3">
						<div>
							<p className="text-sm font-medium text-foreground">Permissions</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Select all permissions that should be granted to this role.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{Object.entries(groupedPermissions).map(([group, items]) => (
								<div
									key={group}
									className="rounded-2xl border border-border bg-muted/20 p-4"
								>
									<p className="mb-3 text-sm font-semibold text-foreground">
										{group}
									</p>
									<div className="space-y-3">
										{items.map((permission) => {
											const checked =
												formState.permissions.includes(permission);

											return (
												<label
													key={permission}
													className="flex items-start gap-3"
												>
													<Checkbox
														checked={checked}
														onCheckedChange={(value) =>
															togglePermission(permission, value === true)
														}
														className="border-muted-foreground data-[state=checked]:border-primary"
													/>
													<div className="space-y-1">
														<p className="text-sm font-medium text-foreground">
															{permission}
														</p>
														<p className="text-xs text-muted-foreground">
															{permission.replace(":", " ").replace(/-/g, " ")}
														</p>
													</div>
												</label>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={resetDialog}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSavingRole}>
							{isSavingRole ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : editingRole ? (
								"Save Role"
							) : (
								"Create Role"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<DeleteDialog
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					setDeleteDialogOpen(open);
					if (!open) setRoleToDelete(null);
				}}
				title={`Delete "${roleToDelete?.name}"`}
				description={`This will permanently remove the "${roleToDelete?.name}" role. Any employees assigned to this role may lose access. This action cannot be undone.`}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
			/>
		</>
	);
}
