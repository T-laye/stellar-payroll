"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCurrentUser, useUpdateCurrentUser } from "@/hooks/user.hook";
import { useCompanyDetails, useUpdateCompany } from "@/hooks/company.hook";
import { useCompanyStore } from "@/lib/stores/company-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	Loader2,
	Eye,
	EyeOff,
	Check,
	Pencil,
	X,
	Globe,
} from "lucide-react";
import { currencies } from "@/lib/utils/constants";

const ProfileSchema = z.object({
	first_name: z.string().min(2, "First name must be at least 2 characters"),
	last_name: z.string().min(2, "Last name must be at least 2 characters"),
});

const CompanyProfileSchema = z.object({
	name: z.string().min(2, "Company name must be at least 2 characters"),
	default_currency: z.string().min(3, "Currency is required"),
	logo_url: z.string().optional(),
	phone: z.string().optional(),
	timezone: z.string().min(2, "Timezone is required"),
	website: z.string().optional(),
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
type CompanyProfileFormData = z.infer<typeof CompanyProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;

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
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(element);
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
						Role changes are managed from the dedicated roles page.
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

function CompanyForm() {
	const user = useAuthStore((state) => state.user);
	const company = useCompanyStore((state) => state.company);
	const [isEditing, setIsEditing] = useState(false);
	useCompanyDetails();
	const { mutateAsync: saveCompany, isPending: isSaving } = useUpdateCompany();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isDirty },
	} = useForm<CompanyProfileFormData>({
		resolver: zodResolver(CompanyProfileSchema),
		defaultValues: {
			name: company?.name ?? user?.company ?? "",
			default_currency: company?.default_currency ?? "USDC",
			logo_url: company?.logo_url ?? "",
			phone: company?.phone ?? "",
			timezone: company?.timezone ?? "",
			website: company?.website ?? "",
		},
	});

	useEffect(() => {
		reset({
			name: company?.name ?? user?.company ?? "",
			default_currency: company?.default_currency ?? "USDC",
			logo_url: company?.logo_url ?? "",
			phone: company?.phone ?? "",
			timezone: company?.timezone ?? "",
			website: company?.website ?? "",
		});
	}, [
		company?.default_currency,
		company?.logo_url,
		company?.name,
		company?.phone,
		company?.timezone,
		company?.website,
		reset,
		user?.company,
	]);

	const handleCancel = () => {
		reset({
			name: company?.name ?? user?.company ?? "",
			default_currency: company?.default_currency ?? "USDC",
			logo_url: company?.logo_url ?? "",
			phone: company?.phone ?? "",
			timezone: company?.timezone ?? "",
			website: company?.website ?? "",
		});
		setIsEditing(false);
	};

	const onSubmit = async (data: CompanyProfileFormData) => {
		try {
			await saveCompany({
				name: data.name.trim(),
				default_currency: data.default_currency.trim().toUpperCase(),
				logo_url: data.logo_url?.trim() || undefined,
				phone: data.phone?.trim() || undefined,
				timezone: data.timezone.trim(),
				website: data.website?.trim() || undefined,
			});
			toast.success("Company profile updated", {
				description: "Your company settings have been saved.",
			});
			setIsEditing(false);
		} catch (error) {
			toast.error("Failed to update company", {
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Company Name" error={errors.name?.message}>
					<div className="relative">
						<Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							{...register("name")}
							disabled={!isEditing}
							className={cn("pl-9", !isEditing && "bg-muted/40")}
						/>
					</div>
				</Field>

				<Field label="Company Email">
					<div className="relative">
						<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={company?.email ?? ""}
							disabled
							className="bg-muted/40 pl-9"
						/>
					</div>
				</Field>

				<Field label="Country">
					<div className="relative">
						<Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={company?.country ?? ""}
							disabled
							className="bg-muted/40 pl-9"
						/>
					</div>
				</Field>

				<Field label="Slug">
					<div className="relative">
						<Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={company?.slug ?? ""}
							disabled
							className="bg-muted/40 pl-9"
						/>
					</div>
				</Field>

				<Field
					label="Default Currency"
					error={errors.default_currency?.message}
				>
					<Select
						defaultValue={company?.default_currency ?? "USDC"}
						onValueChange={(value) =>
							setValue("default_currency", value, { shouldDirty: true })
						}
						disabled={!isEditing}
					>
						<SelectTrigger className={!isEditing ? "bg-muted/40" : ""}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{currencies.map((currency) => (
								<SelectItem key={currency.value} value={currency.value}>
									{currency.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field label="Timezone" error={errors.timezone?.message}>
					<Input
						{...register("timezone")}
						disabled={!isEditing}
						className={!isEditing ? "bg-muted/40" : ""}
						placeholder="Africa/Lagos"
					/>
				</Field>

				<Field label="Phone Number" error={errors.phone?.message}>
					<Input
						{...register("phone")}
						disabled={!isEditing}
						className={!isEditing ? "bg-muted/40" : ""}
						placeholder="+234..."
					/>
				</Field>

				<Field label="Website" error={errors.website?.message}>
					<Input
						{...register("website")}
						disabled={!isEditing}
						className={!isEditing ? "bg-muted/40" : ""}
						placeholder="https://example.com"
					/>
				</Field>

				<Field label="Logo URL" error={errors.logo_url?.message}>
					<Input
						{...register("logo_url")}
						disabled={!isEditing}
						className={!isEditing ? "bg-muted/40" : ""}
						placeholder="https://cdn.example.com/logo.png"
					/>
				</Field>
			</div>

			<div className="mt-6 flex items-center gap-3">
				{!isEditing ? (
					<Button
						type="button"
						variant="outline"
						className="gap-2"
						onClick={() => setIsEditing(true)}
					>
						<Pencil className="h-4 w-4" />
						Edit Company
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
									<Check className="h-4 w-4" /> Save Company
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

export default function SettingsPage() {
	const handleComingSoon = (feature: string) => {
		toast.info(`${feature} coming soon`, {
			description: "This feature is currently under development.",
		});
	};

	return (
		<div className="max-w-5xl space-y-6 sm:space-y-8">
			<FadeUp>
				<div>
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
						Settings
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage your account details, company profile, password, and personal
						security preferences.
					</p>
				</div>
			</FadeUp>

			<FadeUp delay={60}>
				<SettingsCard
					icon={Building}
					title="Company Profile"
					description="Update company information used across payroll operations"
				>
					<CompanyForm />
				</SettingsCard>
			</FadeUp>

			<FadeUp delay={120}>
				<SettingsCard
					icon={User}
					title="Account Information"
					description="Update your first and last name"
				>
					<ProfileForm />
				</SettingsCard>
			</FadeUp>

			<FadeUp delay={180}>
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
