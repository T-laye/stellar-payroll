"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCurrentUser, useUpdateCurrentUser } from "@/hooks/user.hook";
import {
	useCompanyPermissions,
	useCompanyRoles,
	useCreateRole,
	useDeleteRole,
	useUpdateRole,
} from "@/hooks/role.hook";
import { useRoleStore } from "@/lib/stores/role-store";
import { type Role } from "@/services/role.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	User,
	Mail,
	Building,
	ShieldCheck,
	Key,
	AlertTriangle,
	Plus,
	Loader2,
	Eye,
	EyeOff,
	Check,
	Pencil,
	X,
	UsersRound,
	Trash2,
	Lock,
} from "lucide-react";

const ProfileSchema = z.object({
	first_name: z.string().min(2, "First name must be at least 2 characters"),
	last_name: z.string().min(2, "Last name must be at least 2 characters"),
});

const PasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z.string().min(6, "Must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your new password"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;

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

function FadeUp({
	children,
	delay = 0,
	className,
}: {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={className}
			style={{
				opacity: inView ? 1 : 0,
				transform: inView ? "translateY(0)" : "translateY(16px)",
				transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
			}}
		>
			{children}
		</div>
	);
}

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="flex items-center gap-1 text-xs text-destructive">
					<span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
					{error}
				</p>
			)}
		</div>
	);
}

function PasswordInput({
	error,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
	const [show, setShow] = useState(false);

	return (
		<div className="relative">
			<Input
				{...props}
				type={show ? "text" : "password"}
				className={cn(
					"pr-10",
					error && "border-destructive focus-visible:ring-destructive",
				)}
			/>
			<button
				type="button"
				onClick={() => setShow((value) => !value)}
				tabIndex={-1}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

function SettingsCard({
	icon: Icon,
	title,
	description,
	children,
	accent,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	children: React.ReactNode;
	accent?: "default" | "danger";
}) {
	const isDanger = accent === "danger";

	return (
		<Card className={cn("overflow-hidden", isDanger && "border-destructive/20")}>
			<div
				className={cn(
					"flex items-center gap-3 border-b px-5 py-4 sm:px-6",
					isDanger ? "bg-destructive/5" : "bg-muted/20",
				)}
			>
				<div
					className={cn(
						"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
						isDanger ? "bg-destructive/10" : "bg-primary/10",
					)}
				>
					<Icon
						className={cn(
							"h-4 w-4",
							isDanger ? "text-destructive" : "text-primary",
						)}
					/>
				</div>
				<div>
					<h2
						className={cn(
							"text-sm font-semibold",
							isDanger ? "text-destructive" : "text-foreground",
						)}
					>
						{title}
					</h2>
					<p className="text-xs text-muted-foreground">{description}</p>
				</div>
			</div>
			<div className="p-5 sm:p-6">{children}</div>
		</Card>
	);
}

function ProfileForm() {
	const user = useAuthStore((state) => state.user);
	const [isEditing, setIsEditing] = useState(false);
	const { isFetching } = useCurrentUser();
	const { mutateAsync: updateCurrentUser, isPending: isSaving } =
		useUpdateCurrentUser();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(ProfileSchema),
		defaultValues: {
			first_name: user?.first_name ?? "",
			last_name: user?.last_name ?? "",
		},
	});

	useEffect(() => {
		reset({
			first_name: user?.first_name ?? "",
			last_name: user?.last_name ?? "",
		});
	}, [reset, user?.first_name, user?.last_name]);

	const handleCancel = () => {
		reset({
			first_name: user?.first_name ?? "",
			last_name: user?.last_name ?? "",
		});
		setIsEditing(false);
	};

	const onSubmit = async (data: ProfileFormData) => {
		try {
			await updateCurrentUser(data);
			toast.success("Profile updated", {
				description: "Your account details have been saved.",
			});
			setIsEditing(false);
		} catch (error) {
			toast.error("Failed to update profile", {
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="First Name" error={errors.first_name?.message}>
					<div className="relative">
						<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							{...register("first_name")}
							placeholder="John"
							disabled={!isEditing || isFetching}
							className={cn(
								"pl-9 transition-colors",
								!isEditing && "cursor-default bg-muted/40",
								errors.first_name && "border-destructive",
							)}
						/>
					</div>
				</Field>

				<Field label="Last Name" error={errors.last_name?.message}>
					<div className="relative">
						<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							{...register("last_name")}
							placeholder="Doe"
							disabled={!isEditing || isFetching}
							className={cn(
								"pl-9 transition-colors",
								!isEditing && "cursor-default bg-muted/40",
								errors.last_name && "border-destructive",
							)}
						/>
					</div>
				</Field>

				<Field label="Email Address">
					<div className="relative">
						<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={user?.email ?? ""}
							disabled
							className="cursor-default bg-muted/40 pl-9"
						/>
					</div>
				</Field>

				<Field label="Company">
					<div className="relative">
						<Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={user?.company ?? ""}
							disabled
							className="cursor-default bg-muted/40 pl-9"
						/>
					</div>
				</Field>

				<Field label="Account Role">
					<div className="relative">
						<ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={user?.role_name ?? ""}
							disabled
							className="cursor-default bg-muted/40 pl-9 capitalize"
						/>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Role cannot be changed here. Contact your admin.
					</p>
				</Field>
			</div>

			<div className="mt-6 flex items-center gap-3">
				{!isEditing ? (
					<Button
						type="button"
						variant="outline"
						className="gap-2"
						onClick={() => setIsEditing(true)}
						disabled={isFetching}
					>
						<Pencil className="h-4 w-4" />
						Edit Profile
					</Button>
				) : (
					<>
						<Button
							type="submit"
							disabled={isSaving || !isDirty}
							className="gap-2 shadow-sm"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" /> Saving...
								</>
							) : (
								<>
									<Check className="h-4 w-4" /> Save Changes
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							className="gap-2"
						>
							<X className="h-4 w-4" /> Cancel
						</Button>
					</>
				)}
			</div>
		</form>
	);
}

function PasswordForm() {
	const changePassword = useAuthStore((state) => state.changePassword);
	const [isSaving, setIsSaving] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<PasswordFormData>({
		resolver: zodResolver(PasswordSchema),
	});

	const newPassword = watch("newPassword", "");

	const strength = (() => {
		if (!newPassword) return 0;
		let score = 0;
		if (newPassword.length >= 8) score++;
		if (/[A-Z]/.test(newPassword)) score++;
		if (/[0-9]/.test(newPassword)) score++;
		if (/[^A-Za-z0-9]/.test(newPassword)) score++;
		return score;
	})();

	const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
	const strengthColor = [
		"",
		"bg-red-500",
		"bg-yellow-500",
		"bg-blue-500",
		"bg-green-500",
	][strength];
	const strengthText = [
		"",
		"text-red-500",
		"text-yellow-500",
		"text-blue-500",
		"text-green-500",
	][strength];

	const handleCancel = () => {
		reset();
		setIsOpen(false);
	};

	const onSubmit = async (data: PasswordFormData) => {
		setIsSaving(true);
		try {
			await changePassword(data.currentPassword, data.newPassword);
			toast.success("Password changed", {
				description: "Your password has been updated successfully.",
			});
			reset();
			setIsOpen(false);
		} catch (error) {
			toast.error("Failed to change password", {
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (!isOpen) {
		return (
			<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
				<div>
					<p className="text-sm font-medium text-foreground">Password</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Last changed: unknown
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="gap-2"
					onClick={() => setIsOpen(true)}
				>
					<Key className="h-4 w-4" />
					Change Password
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
			<Field label="Current Password" error={errors.currentPassword?.message}>
				<PasswordInput
					{...register("currentPassword")}
					placeholder="********"
					error={!!errors.currentPassword}
				/>
			</Field>

			<Field label="New Password" error={errors.newPassword?.message}>
				<PasswordInput
					{...register("newPassword")}
					placeholder="********"
					error={!!errors.newPassword}
				/>
				{newPassword && (
					<div className="mt-2 space-y-1">
						<div className="flex gap-1">
							{[1, 2, 3, 4].map((index) => (
								<div
									key={index}
									className={cn(
										"h-1 flex-1 rounded-full transition-all duration-300",
										index <= strength ? strengthColor : "bg-muted",
									)}
								/>
							))}
						</div>
						<p className={cn("text-xs font-medium", strengthText)}>
							{strengthLabel}
						</p>
					</div>
				)}
			</Field>

			<Field
				label="Confirm New Password"
				error={errors.confirmPassword?.message}
			>
				<PasswordInput
					{...register("confirmPassword")}
					placeholder="********"
					error={!!errors.confirmPassword}
				/>
			</Field>

			<div className="flex gap-3 pt-1">
				<Button type="submit" disabled={isSaving} className="gap-2 shadow-sm">
					{isSaving ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" /> Updating...
						</>
					) : (
						<>
							<Check className="h-4 w-4" /> Update Password
						</>
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleCancel}
					disabled={isSaving}
					className="gap-2"
				>
					<X className="h-4 w-4" /> Cancel
				</Button>
			</div>
		</form>
	);
}

function RolesManager() {
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
				editingRole || slugTouched ? current.slug : slugify(value || current.slug),
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

	const handleDelete = async (role: Role) => {
		if (isOwnerRole(role)) {
			toast.info("Owner role is locked", {
				description: "The owner role cannot be deleted.",
			});
			return;
		}

		const confirmed = window.confirm(
			`Delete the "${role.name}" role? This action cannot be undone.`,
		);

		if (!confirmed) {
			return;
		}

		try {
			await deleteRole(role.id);
			toast.success("Role deleted successfully.");
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
						<p className="text-sm font-medium text-foreground">
							Company Roles
						</p>
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
												onClick={() => handleDelete(role)}
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
											const checked = formState.permissions.includes(permission);

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
		</>
	);
}

export default function SettingsPage() {
	const handleComingSoon = (feature: string) => {
		toast.info(`${feature} coming soon`, {
			description: "This feature is currently under development.",
		});
	};

	return (
		<div className="max-w-4xl space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Settings
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage your account details, security, and company roles.
					</p>
				</div>
			</FadeUp>

			<FadeUp delay={60}>
				<SettingsCard
					icon={User}
					title="Account Information"
					description="Update your first and last name"
				>
					<ProfileForm />
				</SettingsCard>
			</FadeUp>

			<FadeUp delay={120}>
				<SettingsCard
					icon={Key}
					title="Security"
					description="Manage your password and account security"
				>
					<div className="space-y-4">
						<PasswordForm />

						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
							<div>
								<p className="text-sm font-medium text-foreground">
									Two-Factor Authentication
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Add an extra layer of security
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleComingSoon("Two-Factor Authentication")}
							>
								Enable 2FA
							</Button>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
							<div>
								<p className="text-sm font-medium text-foreground">
									Active Sessions
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									View and revoke active sessions
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleComingSoon("Session Management")}
							>
								View Sessions
							</Button>
						</div>
					</div>
				</SettingsCard>
			</FadeUp>

			<FadeUp delay={180}>
				<SettingsCard
					icon={UsersRound}
					title="Roles And Permissions"
					description="Create, update, and delete roles while assigning permissions"
				>
					<RolesManager />
				</SettingsCard>
			</FadeUp>

			<FadeUp delay={240}>
				<SettingsCard
					icon={AlertTriangle}
					title="Danger Zone"
					description="Irreversible actions - proceed with caution"
					accent="danger"
				>
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/10 bg-destructive/5 p-4">
						<div>
							<p className="text-sm font-medium text-foreground">
								Delete Account
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Permanently delete your account and all associated data
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onClick={() =>
								toast.error("Account deletion requires confirmation", {
									description:
										"Please contact support to permanently delete your account.",
									action: {
										label: "Contact Support",
										onClick: () => window.open("mailto:support@stellar.com"),
									},
								})
							}
						>
							Delete Account
						</Button>
					</div>
				</SettingsCard>
			</FadeUp>
		</div>
	);
}
